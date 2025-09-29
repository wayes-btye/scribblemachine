'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-provider'
import { MagicLinkForm } from '@/components/auth/magic-link-form'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

interface AuthenticatedLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  requireAuth?: boolean
}

export function AuthenticatedLink({
  href,
  children,
  className,
  requireAuth = true
}: AuthenticatedLinkProps) {
  const { user, loading } = useAuth()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

  // If auth is not required, just render a normal link
  if (!requireAuth) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }

  // If loading, render a disabled version
  if (loading) {
    return (
      <div className={className} style={{ opacity: 0.6, pointerEvents: 'none' }}>
        {children}
      </div>
    )
  }

  // If user is authenticated, render normal link
  if (user) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }

  // If user is not authenticated, render auth dialog trigger
  return (
    <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
      <DialogTrigger asChild>
        <div className={className} style={{ cursor: 'pointer' }}>
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border border-white/20 shadow-xl">
        <MagicLinkForm
          onSuccess={() => {
            setAuthDialogOpen(false)
            // After successful auth, navigate to the intended destination
            window.location.href = href
          }}
        />
      </DialogContent>
    </Dialog>
  )
}