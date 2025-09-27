import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

interface EditJobRequest {
  editPrompt: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const originalJobId = params.id
    const { editPrompt }: EditJobRequest = await request.json()

    // Validate input
    if (!originalJobId || !editPrompt) {
      return NextResponse.json(
        { error: 'Job ID and edit prompt are required' },
        { status: 400 }
      )
    }

    // Validate edit prompt length and content
    if (editPrompt.length < 3 || editPrompt.length > 200) {
      return NextResponse.json(
        { error: 'Edit prompt must be between 3 and 200 characters' },
        { status: 400 }
      )
    }

    // Basic safety check for edit prompt
    const unsafePatterns = ['nsfw', 'nude', 'sex', 'violence', 'blood', 'weapon', 'gun', 'knife']
    const lowerPrompt = editPrompt.toLowerCase()
    if (unsafePatterns.some(pattern => lowerPrompt.includes(pattern))) {
      return NextResponse.json(
        { error: 'Edit prompt contains inappropriate content' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
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

    // Get original job and verify ownership
    const { data: originalJob, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', originalJobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !originalJob) {
      return NextResponse.json(
        { error: 'Original job not found or access denied' },
        { status: 404 }
      )
    }

    // Check if original job is completed
    if (originalJob.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Can only edit completed jobs' },
        { status: 400 }
      )
    }

    // Count existing edits for this job (jobs that reference this as parent)
    // We'll track this by looking for jobs with edit_parent_id in params_json
    const { data: existingEdits, error: editsError } = await supabase
      .from('jobs')
      .select('id')
      .eq('user_id', user.id)
      .contains('params_json', { edit_parent_id: originalJobId })

    if (editsError) {
      console.error('Error counting edits:', editsError)
      return NextResponse.json(
        { error: 'Error checking edit history' },
        { status: 500 }
      )
    }

    // Check 2-edit limit per job
    const editCount = existingEdits?.length || 0
    if (editCount >= 2) {
      return NextResponse.json(
        { error: 'Maximum of 2 edits per job allowed' },
        { status: 403 }
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
        { error: 'Insufficient credits for editing' },
        { status: 402 } // Payment Required
      )
    }

    // Get the most recent edge_map asset from the original job for editing
    // Storage path pattern: {user_id}/{job_id}/edge.png
    console.log(`Looking for edge_map asset with path: ${user.id}/${originalJobId}/edge.png`)
    const { data: edgeMapAssets, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', user.id)
      .eq('kind', 'edge_map')
      .eq('storage_path', `${user.id}/${originalJobId}/edge.png`)
      .order('created_at', { ascending: false })
      .limit(1)

    const edgeMapAsset = edgeMapAssets?.[0]

    console.log(`Found ${edgeMapAssets?.length || 0} edge_map assets for this job`)
    console.log('Selected asset:', edgeMapAsset?.id)

    if (assetError || !edgeMapAsset) {
      console.error('Asset lookup failed:', assetError)
      console.log(`Searching for any edge_map assets for user ${user.id}...`)

      // Debug: Let's see what assets exist for this user
      const { data: allAssets } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .eq('kind', 'edge_map')
        .limit(10)

      console.log('Found edge_map assets:', allAssets?.map(a => ({ id: a.id, storage_path: a.storage_path, created_at: a.created_at })))

      return NextResponse.json(
        { error: 'Original coloring page not found for editing' },
        { status: 404 }
      )
    }

    // Create new edit job with special parameters
    const editJobId = randomUUID()
    const editJobParams = {
      edit_parent_id: originalJobId,
      edit_prompt: editPrompt,
      edit_source_asset_id: edgeMapAsset.id,
      complexity: originalJob.params_json.complexity,
      line_thickness: originalJob.params_json.line_thickness,
      custom_prompt: originalJob.params_json.custom_prompt,
    }

    const { data: editJob, error: editJobError } = await supabase
      .from('jobs')
      .insert({
        id: editJobId,
        user_id: user.id,
        status: 'queued',
        params_json: editJobParams,
      })
      .select()
      .single()

    if (editJobError) {
      console.error('Edit job creation error:', editJobError)
      return NextResponse.json(
        { error: 'Failed to create edit job' },
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
        reason: 'edit_queued',
      })

    console.log(`Edit job ${editJob.id} created for original job ${originalJobId}`)
    console.log(`Edit prompt: "${editPrompt}"`)
    console.log(`Edit count for original job: ${editCount + 1}/2`)

    return NextResponse.json({
      id: editJob.id,
      user_id: editJob.user_id,
      status: editJob.status,
      params_json: editJob.params_json,
      cost_cents: editJob.cost_cents,
      model: editJob.model,
      started_at: editJob.started_at,
      ended_at: editJob.ended_at,
      error: editJob.error,
      created_at: editJob.created_at,
      updated_at: editJob.updated_at,
      edit_count: editCount + 1,
      edits_remaining: 1 - editCount,
    })
  } catch (error) {
    console.error('Edit job API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}