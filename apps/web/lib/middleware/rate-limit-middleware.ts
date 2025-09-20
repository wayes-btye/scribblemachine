import { NextRequest, NextResponse } from 'next/server'
import { getClientIP } from '@/lib/rate-limit'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
}

interface RateLimiter {
  checkLimit(identifier: string): Promise<RateLimitResult>
}

export function withRateLimit(
  rateLimiter: RateLimiter,
  getIdentifier?: (request: NextRequest) => string | Promise<string>
) {
  return function rateLimitMiddleware<T extends any[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      try {
        // Get identifier (defaults to IP address)
        let identifier: string
        if (getIdentifier) {
          identifier = await getIdentifier(request)
        } else {
          identifier = getClientIP(request)
        }

        // Check rate limit
        const result = await rateLimiter.checkLimit(identifier)

        // Add rate limit headers
        const headers = new Headers()
        headers.set('X-RateLimit-Limit', rateLimiter.toString())
        headers.set('X-RateLimit-Remaining', result.remaining.toString())
        headers.set('X-RateLimit-Reset', result.resetTime.getTime().toString())

        if (!result.allowed) {
          return NextResponse.json(
            {
              error: 'Rate limit exceeded',
              message: 'Too many requests. Please try again later.',
              retryAfter: Math.ceil(
                (result.resetTime.getTime() - Date.now()) / 1000
              ),
            },
            {
              status: 429,
              headers,
            }
          )
        }

        // Call the actual handler
        const response = await handler(request, ...args)

        // Add rate limit headers to successful response
        headers.forEach((value, key) => {
          response.headers.set(key, value)
        })

        return response
      } catch (error) {
        console.error('Rate limit middleware error:', error)
        // Continue with request if rate limiting fails
        return handler(request, ...args)
      }
    }
  }
}