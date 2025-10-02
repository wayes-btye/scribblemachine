'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth/auth-provider'
import { UserProfile } from '@/components/layout/user-profile'
import { MagicLinkForm } from '@/components/auth/magic-link-form'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { AuthenticatedLink } from '@/components/auth/authenticated-link'
import { Sparkles, LayoutGrid } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

export function Header() {
  const { user, loading } = useAuth()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="relative z-60 py-4 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Large Logo - Responsive sizing */}
        <div className="flex items-center transition-all duration-300 hover:scale-105 hover:rotate-1">
          <Link href="/">
            <Image
              src="/assets/ScribbleMachinecom.svg"
              alt="ScribbleMachine.com"
              width={280}
              height={112}
              priority
              className="w-auto"
              style={{ height: 'clamp(4rem, 8vw, 7rem)' }}
            />
          </Link>
        </div>

        {/* Navigation & Auth Section */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          {/* Gallery Link - Only show when authenticated */}
          {user && (
            <Link
              href="/gallery"
              className={`flex items-center text-base sm:text-lg font-medium px-4 py-2 rounded-lg transition-all duration-300 ${
                pathname === '/gallery'
                  ? 'bg-white/20 text-foreground'
                  : 'hover:bg-white/10 text-foreground/80 hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="hidden sm:inline">Gallery</span>
            </Link>
          )}

          {/* Auth Section */}
          {loading ? (
            <div className="h-12 w-24 sm:w-32 bg-white/20 animate-pulse rounded-lg" />
          ) : user ? (
            <UserProfile />
          ) : (
            <>
              {/* Hide Sign In on mobile to save space */}
              <div className="hidden sm:block">
                <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="text-lg font-medium px-6 py-3 hover:bg-white/10 rounded-lg transition-all duration-300 text-foreground">
                      Sign In
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-2xl">
                    <MagicLinkForm
                      onSuccess={() => {
                        setAuthDialogOpen(false)
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <AuthenticatedLink href="/workspace">
                <button className="btn-primary flex items-center text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="whitespace-nowrap">Start Creating</span>
                </button>
              </AuthenticatedLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}