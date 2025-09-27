import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

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

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Magic link error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Magic link sent successfully. Please check your email.',
    })
  } catch (error) {
    console.error('Magic link API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}