import { createServiceSupabaseClient } from '@/lib/supabase/server'

interface RateLimit {
  id: string
  count: number
  window_start: string
}

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
    const supabase = createServiceSupabaseClient()
    const key = `${this.config.keyPrefix}:${identifier}`
    const now = new Date()
    const windowStart = new Date(
      Math.floor(now.getTime() / this.config.windowMs) * this.config.windowMs
    )

    try {
      // Try to get existing rate limit record
      const { data: existing, error: selectError } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('id', key)
        .eq('window_start', windowStart.toISOString())
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        // Error other than "not found"
        console.error('Rate limit check error:', selectError)
        // Allow request on error (fail open)
        return {
          allowed: true,
          remaining: this.config.maxRequests - 1,
          resetTime: new Date(windowStart.getTime() + this.config.windowMs),
        }
      }

      let currentCount = 1
      if (existing) {
        currentCount = existing.count + 1

        // Update existing record
        await supabase
          .from('rate_limits')
          .update({ count: currentCount })
          .eq('id', key)
          .eq('window_start', windowStart.toISOString())
      } else {
        // Create new record
        await supabase
          .from('rate_limits')
          .insert({
            id: key,
            count: currentCount,
            window_start: windowStart.toISOString(),
          })
      }

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