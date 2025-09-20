import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@coloringpage/types'

export async function GET(request: NextRequest) {
  try {
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

    // Get user profile from our users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    // Get user credits
    const { data: credits } = await supabase
      .from('credits')
      .select('balance, updated_at')
      .eq('user_id', user.id)
      .single()

    // Get job statistics
    const { data: jobStats } = await supabase
      .from('jobs')
      .select('status')
      .eq('user_id', user.id)

    const stats = {
      total_jobs: jobStats?.length || 0,
      successful_jobs: jobStats?.filter(job => job.status === 'succeeded').length || 0,
      failed_jobs: jobStats?.filter(job => job.status === 'failed').length || 0,
      pending_jobs: jobStats?.filter(job => job.status === 'queued' || job.status === 'running').length || 0,
    }

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      created_at: profile.created_at,
      last_login_at: profile.last_login_at,
      credits: {
        balance: credits?.balance || 0,
        updated_at: credits?.updated_at,
      },
      stats,
    })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { last_login_at } = await request.json()

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

    // Update last login time
    const updates: any = {}
    if (last_login_at) {
      updates.last_login_at = new Date().toISOString()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      )
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    })
  } catch (error) {
    console.error('Profile update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}