import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

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

    // Look for edge_map asset for this job
    const { data: edgeMapAsset, error: assetError } = await supabase
      .from('assets')
      .select('storage_path')
      .eq('user_id', user.id)
      .eq('kind', 'edge_map')
      .like('storage_path', `${user.id}/${jobId}/%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (assetError || !edgeMapAsset) {
      return NextResponse.json(
        { error: 'Generated image not found' },
        { status: 404 }
      )
    }

    // Generate signed URL for download (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('intermediates')
      .createSignedUrl(edgeMapAsset.storage_path, 3600) // 1 hour expiry

    if (signedUrlError || !signedUrlData) {
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }

    // Return the signed URL for direct download
    return NextResponse.redirect(signedUrlData.signedUrl)

  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}