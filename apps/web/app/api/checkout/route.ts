import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
}) : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      )
    }

    const { priceId, credits, pack } = await request.json()

    // Validate required fields
    if (!priceId || !credits || !pack) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId, credits, pack' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.headers.get('cookie') ?
              request.headers.get('cookie')?.split(';').map(cookie => {
                const [name, value] = cookie.trim().split('=')
                return { name, value: value || '' }
              }) || [] : []
          },
          setAll() {
            // No-op for API routes
          },
        },
      }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?success=true&credits=${credits}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
      metadata: {
        user_id: user.id,
        credits: credits.toString(),
        pack: pack,
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          credits: credits.toString(),
          pack: pack,
        },
      },
    })

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}