'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { UserProfile } from '@/components/layout/user-profile'
import { MagicLinkForm } from '@/components/auth/magic-link-form'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { user, loading } = useAuth()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

  return (
    <header className="relative z-60 py-4 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Large Logo */}
        <div className="flex items-center transition-all duration-300 hover:scale-105 hover:rotate-1 fade-in-up">
          <Link href="/">
            <Image
              src="/assets/ScribbleMachinecom.svg"
              alt="ScribbleMachine.com"
              width={280}
              height={112}
              className="w-auto"
              style={{ height: '7rem' }}
            />
          </Link>
        </div>

        {/* Auth Section */}
        <div className="flex items-center space-x-6 fade-in-up delay-200">
          {loading ? (
            <div className="h-12 w-32 bg-white/20 animate-pulse rounded-lg" />
          ) : user ? (
            <UserProfile />
          ) : (
            <>
              <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                <DialogTrigger asChild>
                  <button className="text-lg font-medium px-6 py-3 hover:bg-white/10 rounded-lg transition-all duration-300 text-foreground">
                    Sign In
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md border-0 p-0">
                  <MagicLinkForm
                    onSuccess={() => {
                      setAuthDialogOpen(false)
                    }}
                  />
                </DialogContent>
              </Dialog>
              <Link href="/workspace">
                <button className="btn-primary flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Creating
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}