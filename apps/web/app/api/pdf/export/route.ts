import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@coloringpage/types'

interface ExportRequest {
  jobId: string
  paperSize: 'A4' | 'LETTER'
  title?: string
  includeCreditLine?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { jobId, paperSize, title, includeCreditLine }: ExportRequest =
      await request.json()

    // Validate input
    if (!jobId || !paperSize) {
      return NextResponse.json(
        { error: 'Job ID and paper size are required' },
        { status: 400 }
      )
    }

    // Validate paper size
    const validSizes = ['A4', 'LETTER']
    if (!validSizes.includes(paperSize)) {
      return NextResponse.json(
        { error: 'Invalid paper size. Must be A4 or LETTER' },
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

    // Verify job exists and belongs to user
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if job is completed
    if (job.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Job is not completed yet' },
        { status: 400 }
      )
    }

    // Check user's credit balance for watermark logic
    const { data: credits } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    const isFreeTier = !credits || credits.balance <= 0

    // TODO: In Phase 1, this would trigger the PDF generation worker
    // For now, we'll create a placeholder response

    // Create export parameters
    const exportParams = {
      jobId,
      paperSize,
      title,
      includeCreditLine: includeCreditLine !== false, // Default to true
      includeWatermark: isFreeTier,
    }

    // In production, this would:
    // 1. Queue a PDF generation job
    // 2. Return a job ID for polling
    // 3. The worker would generate the PDF and store it in artifacts bucket

    return NextResponse.json({
      message: 'PDF export queued successfully',
      exportParams,
      estimatedTime: '30-60 seconds',
      note: 'PDF generation integration with Phase 1 worker pending',
    })
  } catch (error) {
    console.error('PDF export API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}