import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
}) : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe webhook not configured' },
        { status: 503 }
      )
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('No signature found in request headers')
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    console.log('Received webhook event:', event.type)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout completion:', session.id)

  const userId = session.metadata?.user_id
  const credits = session.metadata?.credits
  const pack = session.metadata?.pack

  if (!userId || !credits) {
    console.error('Missing required metadata:', { userId, credits, pack })
    return
  }

  const creditsToAdd = parseInt(credits, 10)
  if (isNaN(creditsToAdd) || creditsToAdd <= 0) {
    console.error('Invalid credits amount:', credits)
    return
  }

  const supabase = createServiceSupabaseClient()

  try {
    // Add credit event with Stripe event ID for idempotency
    const { error: eventError } = await supabase
      .from('credit_events')
      .insert({
        user_id: userId,
        delta: creditsToAdd,
        reason: `Credit pack purchase: ${pack} (${creditsToAdd} credits)`,
        stripe_event_id: session.id,
      })

    if (eventError) {
      if (eventError.code === '23505') { // Unique constraint violation
        console.log('Event already processed:', session.id)
        return
      }
      throw eventError
    }

    // Update credits balance
    const { error: creditsError } = await supabase.rpc('increment_user_credits', {
      user_id: userId,
      amount: creditsToAdd
    })

    if (creditsError) {
      throw creditsError
    }

    console.log(`Successfully added ${creditsToAdd} credits to user ${userId}`)

  } catch (error) {
    console.error('Error processing credit grant:', error)
    // In production, you might want to implement a retry mechanism
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id)

  // Additional payment processing logic can be added here if needed
  // For now, we handle credit granting in checkout.session.completed
}