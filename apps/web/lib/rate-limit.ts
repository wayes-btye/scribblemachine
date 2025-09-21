// import { createServiceSupabaseClient } from '@/lib/supabase/server' // TODO: Uncomment when rate limiting is implemented

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyPrefix?: string
}

class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      keyPrefix: 'rl',
      ...config,
    }
  }

  async checkLimit(identifier: string): Promise<{
    allowed: boolean
    remaining: number
    resetTime: Date
  }> {
    // const supabase = createServiceSupabaseClient() // TODO: Uncomment when rate limiting is properly implemented
    const key = `${this.config.keyPrefix}:${identifier}`
    const now = new Date()
    const windowStart = new Date(
      Math.floor(now.getTime() / this.config.windowMs) * this.config.windowMs
    )

    try {
      // TODO: Implement proper rate limiting when rate_limits table is created
      // For now, always allow (rate limiting disabled)
      console.log('Rate limiting disabled - allowing request for key:', key)

      const currentCount = 1

      const allowed = currentCount <= this.config.maxRequests
      const remaining = Math.max(0, this.config.maxRequests - currentCount)
      const resetTime = new Date(windowStart.getTime() + this.config.windowMs)

      return { allowed, remaining, resetTime }
    } catch (error) {
      console.error('Rate limiter error:', error)
      // Fail open on error
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: new Date(windowStart.getTime() + this.config.windowMs),
      }
    }
  }
}

// Pre-configured rate limiters
export const uploadRateLimiter = new RateLimiter({
  maxRequests: 10, // 10 uploads per hour
  windowMs: 60 * 60 * 1000, // 1 hour
  keyPrefix: 'upload',
})

export const generateRateLimiter = new RateLimiter({
  maxRequests: 5, // 5 generations per hour
  windowMs: 60 * 60 * 1000, // 1 hour
  keyPrefix: 'generate',
})

export const authRateLimiter = new RateLimiter({
  maxRequests: 5, // 5 auth attempts per 15 minutes
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyPrefix: 'auth',
})

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return 'unknown'
}