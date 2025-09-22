import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@coloringpage/types'

interface ExportRequest {
  jobId?: string
  job_id?: string
  paperSize?: 'A4' | 'LETTER'
  paper_size?: 'A4' | 'LETTER'
  title?: string
  includeCreditLine?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const requestBody: ExportRequest = await request.json()

    // Handle both parameter formats
    const jobId = requestBody.jobId || requestBody.job_id
    const paperSize = requestBody.paperSize || requestBody.paper_size
    const { title, includeCreditLine } = requestBody

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
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

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

    // Look for existing PDF asset for this job
    const { data: pdfAsset, error: pdfAssetError } = await supabase
      .from('assets')
      .select('storage_path')
      .eq('user_id', user.id)
      .eq('kind', 'pdf')
      .like('storage_path', `${user.id}/${jobId}/%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (pdfAssetError || !pdfAsset) {
      return NextResponse.json(
        { error: 'PDF not found. The coloring page may still be processing or the PDF generation failed.' },
        { status: 404 }
      )
    }

    // Generate signed URL for PDF download (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('artifacts')
      .createSignedUrl(pdfAsset.storage_path, 3600) // 1 hour expiry

    if (signedUrlError || !signedUrlData) {
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pdfUrl: signedUrlData.signedUrl,
      expiresIn: 3600, // seconds
      paperSize,
      estimatedFileSize: '~500KB'
    })
  } catch (error) {
    console.error('PDF export API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}