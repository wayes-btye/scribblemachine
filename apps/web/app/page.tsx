'use client'

import { Upload, Sparkles, Camera, Lightbulb, Zap, Palette, Heart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { AuthenticatedLink } from '@/components/auth/authenticated-link'
import { BackgroundBlobs } from '@/components/ui/background-blobs'

export default function Home() {
  useEffect(() => {
    // Professional intersection observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement
          target.style.opacity = '1'
          target.style.transform = 'translateY(0) translateX(0) scale(1)'
        }
      })
    }, observerOptions)

    // Observe all animated elements
    document.querySelectorAll('.fade-in-up, .scale-in').forEach((el, index) => {
      const element = el as HTMLElement
      element.style.opacity = '0'

      if (element.classList.contains('fade-in-up')) {
        element.style.transform = 'translateY(30px)'
      } else if (element.classList.contains('scale-in')) {
        element.style.transform = 'scale(0.9)'
      }

      element.style.transition = `opacity 0.8s ease-out ${index * 0.1}s, transform 0.8s ease-out ${index * 0.1}s`
      observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Creative Paint Dreams Background */}
      <BackgroundBlobs />

      {/* Main Content */}
      <main className="relative z-20">
        {/* Hero Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              {/* Hero Content */}
              <div className="text-center lg:text-left">
                <div className="fade-in-up">
                  <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
                    <span className="modern-sans">Where</span>{' '}
                    <span className="handwritten bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Memories</span>{' '}
                    <span className="refined-sans">& Dreams</span>
                    <br />
                    <span className="handwritten bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Become</span>{' '}
                    <span className="modern-sans">Coloring</span>{' '}
                    <span className="refined-sans bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">Magic</span>
                  </h1>
                </div>

                <div className="fade-in-up delay-200">
                  <p className="text-xl lg:text-2xl mb-10 leading-relaxed text-muted-foreground">
                    Upload your precious photos OR simply describe your wildest imagination.{' '}
                    <span className="font-semibold text-primary">Our AI turns both into stunning coloring adventures!</span>
                  </p>
                </div>

                {/* Dual-Mode CTA Buttons */}
                <div className="grid sm:grid-cols-2 gap-4 mb-12 fade-in-up delay-300">
                  <AuthenticatedLink href="/workspace?mode=upload">
                    <button className="btn-primary flex items-center justify-center text-lg px-6 py-4 relative w-full">
                      <Camera className="w-6 h-6 mr-3" />
                      <span className="font-bold">Upload Photo</span>
                    </button>
                  </AuthenticatedLink>
                  <AuthenticatedLink href="/workspace?mode=prompt">
                    <button className="btn-secondary flex items-center justify-center text-lg px-6 py-4 relative w-full">
                      <Lightbulb className="w-6 h-6 mr-3" />
                      <span className="font-bold">Imagine Ideas</span>
                    </button>
                  </AuthenticatedLink>
                </div>

                {/* Enhanced trust indicators */}
                <div className="inline-flex items-center bg-white/85 backdrop-blur-sm rounded-full px-8 py-4 shadow-sm fade-in-up delay-400">
                  <div className="flex items-center space-x-6 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      3 FREE Pages
                    </div>
                    <div className="flex items-center">
                      <span className="text-blue-500 mr-2">⚡</span>
                      Both Ways Work
                    </div>
                    <div className="flex items-center">
                      <span className="text-purple-500 mr-2">👨‍👩‍👧‍👦</span>
                      Family Safe
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Image */}
              <div className="relative scale-in delay-300 flex items-start justify-center pt-8">
                <div className="relative max-w-xl mx-auto">
                  <Image
                    src="/assets/HeroBook-WithImages-upscaled.png"
                    alt="Magical coloring book"
                    width={600}
                    height={600}
                    className="w-full rounded-2xl hero-book cursor-pointer"
                    style={{
                      filter: 'drop-shadow(0 25px 50px oklch(0.15 0.12 260 / 0.25)) drop-shadow(0 10px 20px oklch(0.15 0.12 260 / 0.15))',
                      transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg)',
                      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />

                  {/* Integrated logo element */}
                  <div className="absolute -top-8 -right-8 logo-float">
                    <div className="bg-white/95 backdrop-blur-sm rounded-full p-4 shadow-2xl border border-white/50">
                      <Image
                        src="/assets/ScribbleIcon.svg"
                        alt="ScribbleMachine"
                        width={64}
                        height={64}
                        className="w-16 h-16"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Icon-Focused How It Works Section */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12 fade-in-up">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                <span className="handwritten bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">How It Works</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Creating magical coloring pages is as simple as 1-2-3-4! Watch your ideas come to life.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Step 1: Upload */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 transition-all duration-300 border border-white/20 relative overflow-hidden fade-in-up delay-100 hover:transform hover:-translate-y-2 hover:shadow-xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-600"></div>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center relative bg-gradient-to-br from-purple-500 to-pink-500">
                  <Upload className="w-10 h-10 text-white icon-float" />
                  <div className="absolute -top-2 -right-2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow">1</div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center text-primary">Upload</h3>
                <p className="text-center text-muted-foreground">
                  Share your favorite photo or describe your creative idea in simple words
                </p>
              </div>

              {/* Step 2: Transform */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 transition-all duration-300 border border-white/20 relative overflow-hidden fade-in-up delay-200 hover:transform hover:-translate-y-2 hover:shadow-xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-600"></div>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center relative bg-gradient-to-br from-yellow-500 to-orange-500">
                  <Zap className="w-10 h-10 text-white icon-pulse" />
                  <div className="absolute -top-2 -right-2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow">2</div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center text-primary">Transform</h3>
                <p className="text-center text-muted-foreground">
                  Our AI magic instantly converts your input into line art ready for coloring
                </p>
              </div>

              {/* Step 3: Customize */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 transition-all duration-300 border border-white/20 relative overflow-hidden fade-in-up delay-300 hover:transform hover:-translate-y-2 hover:shadow-xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-600"></div>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center relative bg-gradient-to-br from-cyan-500 to-blue-500">
                  <Palette className="w-10 h-10 text-white icon-rotate" />
                  <div className="absolute -top-2 -right-2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow">3</div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center text-primary">Customize</h3>
                <p className="text-center text-muted-foreground">
                  Adjust complexity, style, and details to match your perfect vision
                </p>
              </div>

              {/* Step 4: Enjoy */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 transition-all duration-300 border border-white/20 relative overflow-hidden fade-in-up delay-400 hover:transform hover:-translate-y-2 hover:shadow-xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-600"></div>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center relative bg-gradient-to-br from-purple-500 to-indigo-500">
                  <Heart className="w-10 h-10 text-white icon-pulse" />
                  <div className="absolute -top-2 -right-2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow">4</div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center text-primary">Enjoy</h3>
                <p className="text-center text-muted-foreground">
                  Download, print, and start coloring your unique masterpiece
                </p>
              </div>
            </div>

            {/* Section Divider */}
            <div className="relative h-0.5 bg-gradient-to-r from-transparent via-border to-transparent my-16">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-bg px-4 text-2xl">✨</div>
            </div>

            {/* Quick Start CTA */}
            <div className="text-center fade-in-up delay-400">
              <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-8 shadow-lg inline-block max-w-2xl">
                <h3 className="text-2xl font-bold mb-4 text-primary">Ready to Begin?</h3>
                <p className="text-lg mb-6 text-muted-foreground">
                  Join thousands of families creating magical coloring moments every day!
                </p>
                <Link href="/workspace">
                  <button className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center">
                    <Sparkles className="w-6 h-6 mr-2 flex-shrink-0" />
                    <span className="whitespace-nowrap">Start Creating Now</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}