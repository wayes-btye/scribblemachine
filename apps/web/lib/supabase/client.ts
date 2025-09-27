import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase client for browser usage
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Note: Removed module-level client instance to prevent build-time initialization
// Use createClient() function instead for proper client-side initialization