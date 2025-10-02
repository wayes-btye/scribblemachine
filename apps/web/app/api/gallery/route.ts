import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { GalleryResponse, GalleryItemResponse } from '@/lib/types/api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
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

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 50) // Max 50 items per page
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters. Page and limit must be positive integers.' },
        { status: 400 }
      )
    }

    // Validate sort parameters
    if (!['created_at', 'title'].includes(sortBy)) {
      return NextResponse.json(
        { error: 'Invalid sort_by parameter. Must be "created_at" or "title".' },
        { status: 400 }
      )
    }

    if (!['asc', 'desc'].includes(sortOrder)) {
      return NextResponse.json(
        { error: 'Invalid sort_order parameter. Must be "asc" or "desc".' },
        { status: 400 }
      )
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Get total count of succeeded jobs for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'succeeded')

    if (countError) {
      console.error('Gallery count error:', countError)
      return NextResponse.json(
        { error: 'Failed to fetch gallery count' },
        { status: 500 }
      )
    }

    // Fetch succeeded jobs with pagination
    // Note: Sorting by title requires extracting from params_json
    const jobsQuery = supabase
      .from('jobs')
      .select('id, status, params_json, created_at, ended_at')
      .eq('user_id', user.id)
      .eq('status', 'succeeded')
      .range(offset, offset + limit - 1)

    // Apply sorting
    if (sortBy === 'created_at') {
      jobsQuery.order('created_at', { ascending: sortOrder === 'asc' })
    }
    // Note: Sorting by title (from params_json) is not efficient in Postgres without a computed column
    // For now, we'll fetch and sort in memory if title sort is requested
    else if (sortBy === 'title') {
      jobsQuery.order('created_at', { ascending: sortOrder === 'asc' }) // Fallback to created_at for now
    }

    const { data: jobs, error: jobsError } = await jobsQuery

    if (jobsError) {
      console.error('Gallery jobs fetch error:', jobsError)
      return NextResponse.json(
        { error: 'Failed to fetch gallery items' },
        { status: 500 }
      )
    }

    if (!jobs || jobs.length === 0) {
      // Return empty gallery
      return NextResponse.json({
        items: [],
        pagination: {
          page,
          limit,
          total_count: totalCount || 0,
          has_more: false,
        },
      } as GalleryResponse)
    }

    // For each job, fetch associated assets and generate signed URLs
    const galleryItems: (GalleryItemResponse | null)[] = await Promise.all(
      jobs.map(async (job) => {
        // Get edge_map asset for this job
        const { data: edgeMapAssets, error: edgeMapError } = await supabase
          .from('assets')
          .select('*')
          .eq('user_id', user.id)
          .eq('kind', 'edge_map')
          .like('storage_path', `%/${job.id}/%`)
          .limit(1)
          .single()

        // Check if PDF exists
        const { data: pdfAssets } = await supabase
          .from('assets')
          .select('id')
          .eq('user_id', user.id)
          .eq('kind', 'pdf')
          .like('storage_path', `%/${job.id}/%`)
          .limit(1)
          .maybeSingle()

        // If no edge_map found, skip this job
        if (edgeMapError || !edgeMapAssets) {
          console.warn(`No edge_map found for job ${job.id}`)
          return null
        }

        // Generate signed URL for edge_map (1 hour expiry)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('intermediates')
          .createSignedUrl(edgeMapAssets.storage_path, 3600)

        if (signedUrlError || !signedUrlData) {
          console.error(`Failed to generate signed URL for job ${job.id}:`, signedUrlError)
          return null
        }

        // Extract parameters from params_json
        const params = job.params_json as any
        const title = params.title || null
        const complexity = params.complexity || 'standard'
        const lineThickness = params.line_thickness || 'medium'

        return {
          job_id: job.id,
          title,
          image_url: signedUrlData.signedUrl,
          thumbnail_url: null, // Future enhancement
          created_at: job.created_at,
          complexity,
          line_thickness: lineThickness,
          has_pdf: !!pdfAssets,
        } as GalleryItemResponse
      })
    )

    // Filter out null items (jobs without edge_map assets)
    const validItems = galleryItems.filter((item): item is GalleryItemResponse => item !== null)

    // If title sorting was requested, sort in memory
    if (sortBy === 'title' && validItems.length > 0) {
      validItems.sort((a, b) => {
        const titleA = a.title || ''
        const titleB = b.title || ''
        if (sortOrder === 'asc') {
          return titleA.localeCompare(titleB)
        } else {
          return titleB.localeCompare(titleA)
        }
      })
    }

    // Return gallery response
    const response: GalleryResponse = {
      items: validItems,
      pagination: {
        page,
        limit,
        total_count: totalCount || 0,
        has_more: offset + jobs.length < (totalCount || 0),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Gallery API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
