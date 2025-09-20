import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@coloringpage/types'
import { nanoid } from 'nanoid'
import { uploadRateLimiter, getClientIP } from '@/lib/rate-limit'

interface UploadRequest {
  filename: string
  contentType: string
  size: number
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()

    const identifier = user ? `user:${user.id}` : `ip:${getClientIP(request)}`
    const rateLimitResult = await uploadRateLimiter.checkLimit(identifier)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many upload requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.getTime().toString(),
          }
        }
      )
    }

    const { filename, contentType, size }: UploadRequest = await request.json()

    // Validate input
    if (!filename || !contentType || !size) {
      return NextResponse.json(
        { error: 'Filename, content type, and size are required' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif']
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload JPEG, PNG, or HEIC images.' },
        { status: 400 }
      )
    }

    // Check authentication (reuse the supabase client from rate limiting)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate unique asset ID and storage path
    const assetId = nanoid()
    const fileExtension = filename.split('.').pop()
    const storagePath = `${user.id}/${assetId}.${fileExtension}`

    // Create signed upload URL
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('originals')
      .createSignedUploadUrl(storagePath, {
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload URL creation error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      )
    }

    // Create asset record in database
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        id: assetId,
        user_id: user.id,
        kind: 'original',
        storage_path: storagePath,
        bytes: size,
      })
      .select()
      .single()

    if (assetError) {
      console.error('Asset creation error:', assetError)
      return NextResponse.json(
        { error: 'Failed to create asset record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      assetId,
      uploadUrl: uploadData.signedUrl,
      storagePath,
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}