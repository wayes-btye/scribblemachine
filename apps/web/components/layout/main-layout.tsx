'use client'

import { AuthProvider } from '@/lib/auth/auth-provider'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/toaster'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-brand-cream">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Toaster />
      </div>
    </AuthProvider>
  )
}