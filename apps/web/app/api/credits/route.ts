import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@coloringpage/types'

export async function GET() {
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

    // Get user credits
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('balance, updated_at')
      .eq('user_id', user.id)
      .single()

    if (creditsError) {
      console.error('Credits fetch error:', creditsError)
      return NextResponse.json(
        { error: 'Failed to fetch credits' },
        { status: 500 }
      )
    }

    // Get recent credit events for transaction history
    const { data: events, error: eventsError } = await supabase
      .from('credit_events')
      .select('delta, reason, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const creditEvents = eventsError ? [] : events

    return NextResponse.json({
      balance: credits?.balance || 0,
      updated_at: credits?.updated_at,
      recent_events: creditEvents,
    })
  } catch (error) {
    console.error('Credits API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}