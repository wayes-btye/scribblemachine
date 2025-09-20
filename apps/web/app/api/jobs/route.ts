import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@coloringpage/types'
import { nanoid } from 'nanoid'

interface CreateJobRequest {
  assetId: string
  complexity: 'simple' | 'standard' | 'detailed'
  lineThickness: 'thin' | 'medium' | 'thick'
  customPrompt?: string
}

export async function POST(request: NextRequest) {
  try {
    const { assetId, complexity, lineThickness, customPrompt }: CreateJobRequest =
      await request.json()

    // Validate input
    if (!assetId || !complexity || !lineThickness) {
      return NextResponse.json(
        { error: 'Asset ID, complexity, and line thickness are required' },
        { status: 400 }
      )
    }

    // Validate complexity
    const validComplexities = ['simple', 'standard', 'detailed']
    if (!validComplexities.includes(complexity)) {
      return NextResponse.json(
        { error: 'Invalid complexity. Must be simple, standard, or detailed' },
        { status: 400 }
      )
    }

    // Validate line thickness
    const validThicknesses = ['thin', 'medium', 'thick']
    if (!validThicknesses.includes(lineThickness)) {
      return NextResponse.json(
        { error: 'Invalid line thickness. Must be thin, medium, or thick' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check user credits
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (creditsError || !credits || credits.balance < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 } // Payment Required
      )
    }

    // Check if asset belongs to user
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', user.id)
      .eq('kind', 'original')
      .single()

    if (assetError || !asset) {
      return NextResponse.json(
        { error: 'Asset not found or access denied' },
        { status: 404 }
      )
    }

    // Create job with parameters
    const jobId = nanoid()
    const jobParams = {
      assetId,
      complexity,
      lineThickness,
      customPrompt,
    }

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        id: jobId,
        user_id: user.id,
        status: 'queued',
        params_json: jobParams,
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      )
    }

    // Optimistically decrement credits (will be refunded if job fails)
    const { error: creditError } = await supabase
      .from('credits')
      .update({ balance: credits.balance - 1 })
      .eq('user_id', user.id)

    if (creditError) {
      console.error('Credit deduction error:', creditError)
      // Note: In production, this should trigger a rollback of the job creation
    }

    // Record credit usage
    await supabase
      .from('credit_events')
      .insert({
        user_id: user.id,
        delta: -1,
        reason: 'generation_queued',
      })

    // TODO: Trigger background job processing
    // This would connect to the existing pg-boss queue system from Phase 1

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      message: 'Job created successfully and queued for processing',
    })
  } catch (error) {
    console.error('Create job API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}