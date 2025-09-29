'use client'

import { Button } from '@/components/ui/button'
import { Upload, Sparkles, Camera, Lightbulb, Zap, Palette, Heart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'

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
          entry.target.style.opacity = '1'
          entry.target.style.transform = 'translateY(0) translateX(0) scale(1)'
        }
      })
    }, observerOptions)

    // Observe all animated elements
    document.querySelectorAll('.fade-in-up, .scale-in').forEach((el, index) => {
      el.style.opacity = '0'

      if (el.classList.contains('fade-in-up')) {
        el.style.transform = 'translateY(30px)'
      } else if (el.classList.contains('scale-in')) {
        el.style.transform = 'scale(0.9)'
      }

      el.style.transition = `opacity 0.8s ease-out ${index * 0.1}s, transform 0.8s ease-out ${index * 0.1}s`
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Creative Paint Dreams Background */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[5] overflow-hidden">
        {/* Creative paint drops */}
        <div className="absolute top-[11%] left-[6%] w-[78px] h-[78px] rounded-full creative-paint-float-1"
             style={{
               background: 'radial-gradient(circle at 30% 30%, oklch(0.86 0.135 320 / 0.26), oklch(0.76 0.165 340 / 0.135), transparent 74%)'
             }} />
        <div className="absolute top-[19%] right-[6%] w-[98px] h-[98px] rounded-full creative-paint-float-2"
             style={{
               background: 'radial-gradient(ellipse at 40% 60%, oklch(0.815 0.115 60 / 0.225), oklch(0.715 0.145 80 / 0.115), transparent 79%)',
               animationDelay: '2.8s'
             }} />
        <div className="absolute bottom-[16%] left-[9%] w-[88px] h-[88px] rounded-full creative-paint-float-1"
             style={{
               background: 'radial-gradient(circle at 56% 36%, oklch(0.765 0.175 180 / 0.21), oklch(0.665 0.195 200 / 0.105), transparent 71%)',
               animationDelay: '5.6s'
             }} />
        <div className="absolute bottom-[13%] right-[9%] w-[73px] h-[73px] rounded-full creative-paint-float-2"
             style={{
               background: 'radial-gradient(ellipse at 43% 57%, oklch(0.835 0.155 280 / 0.235), oklch(0.735 0.175 300 / 0.115), transparent 77%)',
               animationDelay: '8.4s'
             }} />
        <div className="absolute top-[62%] right-[11%] w-[83px] h-[83px] rounded-full creative-paint-float-1"
             style={{
               background: 'radial-gradient(circle at 50% 50%, oklch(0.805 0.125 40 / 0.175), oklch(0.705 0.145 50 / 0.075), transparent 81%)',
               animationDelay: '11.2s'
             }} />

        {/* Enhanced color bleeds */}
        <div className="absolute top-[9%] left-[2.5%] w-[140px] h-[118px] enhanced-color-bleed"
             style={{
               background: 'linear-gradient(135deg, oklch(0.905 0.095 280 / 0.11), oklch(0.855 0.115 300 / 0.165), oklch(0.805 0.135 320 / 0.09))',
               borderRadius: '61% 39% 69% 31%',
               filter: 'blur(3.8px)'
             }} />
        <div className="absolute top-[23%] right-[1.5%] w-[120px] h-[138px] enhanced-color-bleed-2"
             style={{
               background: 'linear-gradient(-45deg, oklch(0.885 0.075 40 / 0.135), oklch(0.825 0.095 60 / 0.185), oklch(0.765 0.115 80 / 0.095))',
               borderRadius: '41% 59% 51% 49%',
               filter: 'blur(2.8px)',
               animationDelay: '4.6s'
             }} />
        <div className="absolute bottom-[19%] left-[4%] w-[130px] h-[108px] enhanced-color-bleed"
             style={{
               background: 'linear-gradient(90deg, oklch(0.865 0.115 160 / 0.12), oklch(0.805 0.135 180 / 0.175), oklch(0.745 0.155 200 / 0.095))',
               borderRadius: '69% 31% 59% 41%',
               filter: 'blur(4.2px)',
               animationDelay: '9.2s'
             }} />
        <div className="absolute bottom-[9%] right-[3.5%] w-[115px] h-[125px] enhanced-color-bleed-2"
             style={{
               background: 'linear-gradient(180deg, oklch(0.845 0.155 240 / 0.14), oklch(0.785 0.175 260 / 0.195), oklch(0.725 0.195 280 / 0.105))',
               borderRadius: '51% 49% 69% 31%',
               filter: 'blur(3.8px)',
               animationDelay: '13.8s'
             }} />

        {/* Elegant watercolor spreads */}
        <div className="absolute top-[6%] left-[11%] w-[115px] h-[115px] elegant-watercolor-fade"
             style={{
               background: 'radial-gradient(ellipse at center, oklch(0.925 0.055 160 / 0.135), oklch(0.865 0.075 180 / 0.20), oklch(0.805 0.095 200 / 0.11), transparent 86.5%)',
               borderRadius: '73.5% 26.5% 63.5% 36.5%'
             }} />
        <div className="absolute top-[11%] right-[13.5%] w-[100px] h-[100px] elegant-watercolor-fade"
             style={{
               background: 'radial-gradient(circle at 62% 28%, oklch(0.885 0.115 240 / 0.165), oklch(0.825 0.135 260 / 0.235), oklch(0.765 0.155 280 / 0.135), transparent 83.5%)',
               borderRadius: '36.5% 63.5% 73.5% 26.5%',
               animationDelay: '3.7s'
             }} />
        <div className="absolute bottom-[9%] left-[15%] w-[105px] h-[105px] elegant-watercolor-fade"
             style={{
               background: 'radial-gradient(ellipse at 48% 62%, oklch(0.905 0.065 60 / 0.11), oklch(0.845 0.085 80 / 0.165), oklch(0.785 0.105 100 / 0.09), transparent 81.5%)',
               borderRadius: '53.5% 46.5% 56.5% 43.5%',
               animationDelay: '7.4s'
             }} />
        <div className="absolute bottom-[13.5%] right-[18.5%] w-[90px] h-[90px] elegant-watercolor-fade"
             style={{
               background: 'radial-gradient(circle at 33% 42%, oklch(0.865 0.125 320 / 0.155), oklch(0.805 0.145 340 / 0.215), oklch(0.745 0.165 360 / 0.11), transparent 84.5%)',
               borderRadius: '43.5% 56.5% 36.5% 63.5%',
               animationDelay: '11.1s'
             }} />

        {/* Elegant liquid flows */}
        <div className="absolute top-0 right-[9%] w-[150px] h-[123px] elegant-corner-float"
             style={{
               background: 'conic-gradient(from 45deg at 50% 50%, oklch(0.865 0.145 320 / 0.11), oklch(0.815 0.165 340 / 0.165), oklch(0.765 0.185 360 / 0.11), oklch(0.865 0.145 320 / 0.11))',
               filter: 'blur(4.2px)'
             }} />
        <div className="absolute top-0 left-[11%] w-[140px] h-[113px] elegant-corner-float"
             style={{
               background: 'conic-gradient(from 120deg at 48% 58%, oklch(0.835 0.125 60 / 0.12), oklch(0.785 0.145 80 / 0.175), oklch(0.735 0.165 100 / 0.13), oklch(0.835 0.125 60 / 0.12))',
               filter: 'blur(3.8px)',
               animationDelay: '6.5s'
             }} />
        <div className="absolute bottom-0 right-[15%] w-[130px] h-[103px] elegant-corner-float"
             style={{
               background: 'conic-gradient(from 200deg at 58% 42%, oklch(0.805 0.175 180 / 0.11), oklch(0.755 0.195 200 / 0.165), oklch(0.705 0.215 220 / 0.12), oklch(0.805 0.175 180 / 0.11))',
               filter: 'blur(3.2px)',
               animationDelay: '13s'
             }} />
        <div className="absolute bottom-0 left-[13%] w-[120px] h-[93px] elegant-corner-float"
             style={{
               background: 'conic-gradient(from 300deg at 38% 68%, oklch(0.845 0.135 280 / 0.10), oklch(0.795 0.155 300 / 0.145), oklch(0.745 0.175 320 / 0.11), oklch(0.845 0.135 280 / 0.10))',
               filter: 'blur(2.8px)',
               animationDelay: '19.5s'
             }} />
      </div>

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
                  <Link href="/workspace">
                    <button className="btn-primary flex items-center justify-center text-lg px-6 py-4 relative w-full">
                      <Camera className="w-6 h-6 mr-3" />
                      <div className="text-left">
                        <div className="font-bold">Upload Photo</div>
                        <div className="text-sm opacity-90">Turn memories into art</div>
                      </div>
                    </button>
                  </Link>
                  <Link href="/workspace">
                    <button className="btn-secondary flex items-center justify-center text-lg px-6 py-4 relative w-full">
                      <Lightbulb className="w-6 h-6 mr-3" />
                      <div className="text-left">
                        <div className="font-bold">Imagine Ideas</div>
                        <div className="text-sm opacity-90">Describe your dreams</div>
                      </div>
                    </button>
                  </Link>
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
                    className="w-full rounded-2xl"
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
                  <button className="btn-primary text-lg px-8 py-4">
                    <Sparkles className="w-6 h-6 mr-2" />
                    Start Creating Now
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