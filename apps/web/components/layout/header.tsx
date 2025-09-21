'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { UserProfile } from '@/components/layout/user-profile'
import { MagicLinkForm } from '@/components/auth/magic-link-form'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { useState } from 'react'

export function Header() {
  const { user, loading } = useAuth()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <Image
            src="/assets/icons/scribble-icon.svg"
            alt="Scribble Machine"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="font-bold text-xl text-gray-900">
            Scribble Machine
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-brand-warm-blue transition-colors"
          >
            Home
          </Link>
          <Link
            href="/gallery"
            className="text-sm font-medium text-gray-600 hover:text-brand-warm-blue transition-colors"
          >
            Gallery
          </Link>
          <Link
            href="/how-it-works"
            className="text-sm font-medium text-gray-600 hover:text-brand-warm-blue transition-colors"
          >
            How It Works
          </Link>
        </nav>

        {/* Auth Section */}
        <div className="flex items-center space-x-3">
          {loading ? (
            <div className="h-9 w-24 bg-gray-200 animate-pulse rounded-md" />
          ) : user ? (
            <UserProfile />
          ) : (
            <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-warm-blue hover:bg-brand-warm-blue/90">
                  Sign In
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md border-0 p-0">
                <MagicLinkForm
                  onSuccess={() => {
                    setAuthDialogOpen(false)
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  )
}