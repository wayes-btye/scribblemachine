import { createServerClient } from '@supabase/ssr'
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
      // Get assets created for this specific job by matching storage path pattern
      // The worker creates paths like: userId/jobId/edge.png
      const { data: jobAssets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .in('kind', ['edge_map', 'pdf'])
        .like('storage_path', `%/${jobId}/%`)

      if (!assetsError && jobAssets) {
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
      params_json: job.params_json,
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