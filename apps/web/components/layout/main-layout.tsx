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
      <div className="min-h-screen relative">
        {/* Background paint splash pattern for all pages */}
        <div
          className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
          style={{
            background: `
              radial-gradient(ellipse 150% 100% at 25% 15%, oklch(0.99 0.06 320 / 0.4), transparent 60%),
              radial-gradient(ellipse 120% 80% at 80% 30%, oklch(0.98 0.08 60 / 0.35), transparent 55%),
              radial-gradient(ellipse 100% 120% at 45% 85%, oklch(0.99 0.05 180 / 0.3), transparent 50%),
              radial-gradient(ellipse 110% 90% at 90% 80%, oklch(0.97 0.09 280 / 0.25), transparent 60%),
              linear-gradient(135deg, oklch(0.99 0.02 45), oklch(0.97 0.03 60)),
              var(--paint-splatter)
            `
          }}
        />

        <div className="relative z-10">
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </div>
        <Toaster />
      </div>
    </AuthProvider>
  )
}