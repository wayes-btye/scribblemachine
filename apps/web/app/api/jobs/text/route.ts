import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { Job } from '@coloringpage/types'

const requestSchema = z.object({
  textPrompt: z.string()
    .min(5, 'Text prompt must be at least 5 characters')
    .max(500, 'Text prompt must be less than 500 characters'),
  complexity: z.enum(['simple', 'standard', 'detailed']),
  lineThickness: z.enum(['thin', 'medium', 'thick'])
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = requestSchema.parse(body)

    // Initialize Supabase client
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check user credit balance
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (creditsError || !credits || credits.balance < 1) {
      return NextResponse.json(
        { code: 'INSUFFICIENT_CREDITS', message: 'Insufficient credits for generation' },
        { status: 402 }
      )
    }

    // Deduct 1 credit optimistically (will be refunded if job fails)
    const { error: deductError } = await supabase.rpc('increment_user_credits', {
      user_id: user.id,
      amount: -1
    })

    if (deductError) {
      console.error('Credit deduction error:', deductError)
      return NextResponse.json(
        { code: 'CREDIT_ERROR', message: 'Failed to deduct credits' },
        { status: 500 }
      )
    }

    // Create job record with text prompt parameters
    const jobParams = {
      text_prompt: validatedData.textPrompt, // Store text prompt instead of asset_id
      complexity: validatedData.complexity,
      line_thickness: validatedData.lineThickness
    }

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        status: 'queued',
        params_json: jobParams,
        cost_cents: 100, // 1 credit = 100 cents
        model: 'gemini-2.5-flash-image-preview'
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)

      // Refund credit on job creation failure
      await supabase.rpc('increment_user_credits', {
        user_id: user.id,
        amount: 1
      })

      return NextResponse.json(
        { code: 'JOB_ERROR', message: 'Failed to create generation job' },
        { status: 500 }
      )
    }

    // Return the complete job object (matches interface expectations)
    const jobResponse: Job = {
      id: job.id,
      user_id: job.user_id,
      status: job.status as 'queued',
      params_json: job.params_json,
      cost_cents: job.cost_cents,
      model: job.model,
      started_at: job.started_at,
      ended_at: job.ended_at,
      error: job.error,
      created_at: job.created_at,
      updated_at: job.updated_at
    }

    return NextResponse.json(jobResponse)

  } catch (error) {
    console.error('Text generation API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}