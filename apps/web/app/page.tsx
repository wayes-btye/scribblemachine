'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/auth-provider'
import { Upload, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-brand-soft-blue/10 to-brand-soft-pink/10">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Hero Section */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Your Moments. Their{' '}
            <span className="text-transparent bg-gradient-to-r from-brand-warm-blue to-brand-warm-orange bg-clip-text">
              Masterpiece.
            </span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-brand-warm-orange">
            Scribble Machine
          </h2>

          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Effortlessly turn cherished photos or imaginative ideas into magical coloring pages, ready to print & color!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/create">
              <Button
                size="lg"
                className="bg-brand-soft-blue hover:bg-brand-soft-blue/90 text-white text-lg px-8 py-4 rounded-2xl shadow-lg"
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Photo - It&apos;s FREE!
              </Button>
            </Link>
            <Link href="/imagine">
              <Button
                variant="outline"
                size="lg"
                className="border-brand-warm-orange text-brand-warm-orange hover:bg-brand-warm-orange/10 text-lg px-8 py-4 rounded-2xl"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Imagine An Idea
              </Button>
            </Link>
          </div>

          {/* Status Bar */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 max-w-md mx-auto shadow-sm">
            <p className="text-sm text-gray-600">
              {user ? (
                <>Welcome back! You&apos;re ready to create amazing coloring pages.</>
              ) : (
                <>Free Tier: 3 Pages • &apos;Made with Scribble Machine&apos; Watermark</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}