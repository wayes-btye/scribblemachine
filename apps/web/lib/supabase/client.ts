import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@coloringpage/types'

// Client-side Supabase client for browser usage
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Default client instance for direct usage
export const supabase = createClient()