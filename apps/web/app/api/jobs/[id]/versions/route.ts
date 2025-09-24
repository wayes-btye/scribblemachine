import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@coloringpage/types'

interface JobVersion {
  id: string
  status: string
  params_json: any
  cost_cents: number | null
  model: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
  updated_at: string
  download_urls?: {
    edge_map?: string
    pdf?: string
  }
  version_type: 'original' | 'edit'
  edit_prompt?: string
  version_order: number
}

export async function GET(
  request: NextRequest,
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

    // Get the requested job and verify ownership
    const { data: requestedJob, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !requestedJob) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // Determine if this is an original job or an edit job
    const isEditJob = requestedJob.params_json?.edit_parent_id
    let originalJobId = isEditJob ? requestedJob.params_json.edit_parent_id : jobId

    // Get the original job
    let originalJob = isEditJob ? null : requestedJob
    if (isEditJob) {
      const { data: originalJobData, error: originalError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', originalJobId)
        .eq('user_id', user.id)
        .single()

      if (originalError || !originalJobData) {
        return NextResponse.json(
          { error: 'Original job not found' },
          { status: 404 }
        )
      }
      originalJob = originalJobData
    }

    // Get all edit jobs for this original job
    const { data: editJobs, error: editsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .contains('params_json', { edit_parent_id: originalJobId })
      .order('created_at', { ascending: true })

    if (editsError) {
      console.error('Error fetching edit jobs:', editsError)
      return NextResponse.json(
        { error: 'Error fetching edit history' },
        { status: 500 }
      )
    }

    // Helper function to get download URLs for a job
    const getDownloadUrls = async (job: any) => {
      console.log(`[DEBUG] Getting download URLs for job ${job.id}`)

      // Get the edge_map asset for this job
      const { data: edgeMapAsset, error: edgeMapError } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .eq('kind', 'edge_map')
        .eq('storage_path', `${user.id}/${job.id}/edge.png`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      console.log(`[DEBUG] Edge map asset query for job ${job.id}:`, {
        found: !!edgeMapAsset,
        error: edgeMapError?.message,
        assetPath: edgeMapAsset?.storage_path
      })

      // Get the PDF asset for this job
      const { data: pdfAsset, error: pdfError } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .eq('kind', 'pdf')
        .eq('storage_path', `${user.id}/${job.id}/coloring-page.pdf`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      console.log(`[DEBUG] PDF asset query for job ${job.id}:`, {
        found: !!pdfAsset,
        error: pdfError?.message,
        assetPath: pdfAsset?.storage_path
      })

      const downloadUrls: any = {}

      // Generate signed URLs for assets
      if (edgeMapAsset) {
        const { data: edgeMapUrl, error: signError } = await supabase.storage
          .from('intermediates')
          .createSignedUrl(edgeMapAsset.storage_path, 21600) // 6 hour expiry (increased from 1 hour)

        console.log(`[DEBUG] Edge map signed URL for job ${job.id}:`, {
          success: !!edgeMapUrl?.signedUrl,
          error: signError?.message,
          url: edgeMapUrl?.signedUrl ? `${edgeMapUrl.signedUrl.substring(0, 50)}...` : null
        })

        if (edgeMapUrl?.signedUrl) {
          downloadUrls.edge_map = edgeMapUrl.signedUrl
        }
      } else {
        console.log(`[DEBUG] No edge map asset found for job ${job.id}, trying fallback path`)

        // Try fallback: generate URL directly without asset lookup
        const fallbackPath = `${user.id}/${job.id}/edge.png`
        const { data: fallbackUrl, error: fallbackError } = await supabase.storage
          .from('intermediates')
          .createSignedUrl(fallbackPath, 21600)

        console.log(`[DEBUG] Fallback edge map URL for job ${job.id}:`, {
          success: !!fallbackUrl?.signedUrl,
          error: fallbackError?.message,
          fallbackPath,
          url: fallbackUrl?.signedUrl ? `${fallbackUrl.signedUrl.substring(0, 50)}...` : null
        })

        if (fallbackUrl?.signedUrl) {
          downloadUrls.edge_map = fallbackUrl.signedUrl
        }
      }

      if (pdfAsset) {
        const { data: pdfUrl, error: pdfSignError } = await supabase.storage
          .from('intermediates')
          .createSignedUrl(pdfAsset.storage_path, 21600) // 6 hour expiry

        console.log(`[DEBUG] PDF signed URL for job ${job.id}:`, {
          success: !!pdfUrl?.signedUrl,
          error: pdfSignError?.message,
          url: pdfUrl?.signedUrl ? `${pdfUrl.signedUrl.substring(0, 50)}...` : null
        })

        if (pdfUrl?.signedUrl) {
          downloadUrls.pdf = pdfUrl.signedUrl
        }
      }

      console.log(`[DEBUG] Final download URLs for job ${job.id}:`, {
        hasEdgeMap: !!downloadUrls.edge_map,
        hasPdf: !!downloadUrls.pdf
      })

      return downloadUrls
    }

    // Build the versions array
    const versions: JobVersion[] = []

    // Add original job
    if (originalJob) {
      const downloadUrls = await getDownloadUrls(originalJob)
      versions.push({
        id: originalJob.id,
        status: originalJob.status,
        params_json: originalJob.params_json,
        cost_cents: originalJob.cost_cents,
        model: originalJob.model,
        started_at: originalJob.started_at,
        ended_at: originalJob.ended_at,
        created_at: originalJob.created_at,
        updated_at: originalJob.updated_at,
        download_urls: downloadUrls,
        version_type: 'original',
        version_order: 0
      })
    }

    // Add edit jobs
    if (editJobs && editJobs.length > 0) {
      for (let i = 0; i < editJobs.length; i++) {
        const editJob = editJobs[i]
        const downloadUrls = await getDownloadUrls(editJob)

        versions.push({
          id: editJob.id,
          status: editJob.status,
          params_json: editJob.params_json,
          cost_cents: editJob.cost_cents,
          model: editJob.model,
          started_at: editJob.started_at,
          ended_at: editJob.ended_at,
          created_at: editJob.created_at,
          updated_at: editJob.updated_at,
          download_urls: downloadUrls,
          version_type: 'edit',
          edit_prompt: editJob.params_json?.edit_prompt,
          version_order: i + 1
        })
      }
    }

    // Filter to only include succeeded jobs for the response
    const succeededVersions = versions.filter(v => v.status === 'succeeded')

    return NextResponse.json({
      total_versions: succeededVersions.length,
      original_job_id: originalJobId,
      requested_job_id: jobId,
      versions: succeededVersions,
      metadata: {
        has_edits: editJobs && editJobs.length > 0,
        edit_count: editJobs?.length || 0,
        max_edits: 2
      }
    })

  } catch (error) {
    console.error('Versions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}