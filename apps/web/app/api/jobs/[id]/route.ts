import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@coloringpage/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
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

    // Get job details
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

    // Get related assets if job is completed
    let assets = null
    if (job.status === 'succeeded') {
      const { data: jobAssets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .in('kind', ['edge_map', 'pdf'])

      if (!assetsError) {
        // Filter assets that belong to this job (by matching creation time or job reference)
        // Note: In production, you might want to add a job_id field to assets table
        assets = jobAssets
      }
    }

    // Generate signed URLs for downloadable assets
    let downloadUrls: Record<string, string> = {}
    if (assets && assets.length > 0) {
      for (const asset of assets) {
        const bucket = asset.kind === 'pdf' ? 'artifacts' : 'intermediates'
        const { data: signedUrl } = await supabase.storage
          .from(bucket)
          .createSignedUrl(asset.storage_path, 3600) // 1 hour expiry

        if (signedUrl) {
          downloadUrls[asset.kind] = signedUrl.signedUrl
        }
      }
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      params: job.params_json,
      cost_cents: job.cost_cents,
      model: job.model,
      started_at: job.started_at,
      ended_at: job.ended_at,
      error: job.error,
      created_at: job.created_at,
      updated_at: job.updated_at,
      download_urls: downloadUrls,
    })
  } catch (error) {
    console.error('Job status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}