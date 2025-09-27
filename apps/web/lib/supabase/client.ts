import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase client for browser usage
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Default client instance for direct usage
export const supabase = createClient()