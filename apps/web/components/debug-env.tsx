'use client'

export function DebugEnv() {
  if (process.env.NODE_ENV === 'production') return null
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-sm">
      <h3 className="font-bold mb-2">Environment Debug</h3>
      <div className="space-y-1">
        <div>NODE_ENV: {process.env.NODE_ENV}</div>
        <div>VERCEL_ENV: {process.env.VERCEL_ENV || 'undefined'}</div>
        <div>NEXT_PUBLIC_VERCEL_ENV: {process.env.NEXT_PUBLIC_VERCEL_ENV || 'undefined'}</div>
        <div>Hostname: {typeof window !== 'undefined' ? window.location.hostname : 'server'}</div>
        <div>Is Vercel: {typeof window !== 'undefined' ? window.location.hostname.includes('vercel.app') ? 'true' : 'false' : 'unknown'}</div>
      </div>
    </div>
  )
}
