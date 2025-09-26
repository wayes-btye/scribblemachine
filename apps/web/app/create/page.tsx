'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePageRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new unified workspace
    router.replace('/workspace')
  }, [router])

  // Show a simple loading message during redirect
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-brand-soft-blue/10 to-brand-soft-pink/10 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-brand-warm-blue border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to workspace...</p>
      </div>
    </div>
  )
}