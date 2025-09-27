'use client'

import React, { useState } from 'react'
import Lottie from 'lottie-react'
import { Progress } from '@/components/ui/progress'

export interface LottieLoaderProps {
  /** Animation theme - determines which animation to show */
  theme: 'generation' | 'upload' | 'editing' | 'success'

  /** Progress percentage (0-100) */
  progress?: number

  /** Loading message to display */
  message?: string

  /** Size of the animation */
  size?: 'sm' | 'md' | 'lg'

  /** Whether to show progress bar alongside animation */
  showProgress?: boolean

  /** Custom Lottie animation data (overrides theme) */
  animationData?: any

  /** Fallback content when animation fails to load */
  fallback?: React.ReactNode

  /** Additional CSS classes */
  className?: string
}

// Animation data placeholders - will be replaced with actual Lottie files
const animationThemes = {
  generation: null, // Magic wand creating coloring pages
  upload: null,     // Image being processed with sparkles
  editing: null,    // Pencil making changes to existing page
  success: null,    // Celebration with confetti
}

// Default loading messages by theme
const defaultMessages = {
  generation: 'Creating your magical coloring page...',
  upload: 'Processing your beautiful image...',
  editing: 'Applying your creative changes...',
  success: 'Your coloring page is ready!',
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
}

export function LottieLoader({
  theme,
  progress,
  message,
  size = 'md',
  showProgress = true,
  animationData,
  fallback,
  className = '',
}: LottieLoaderProps) {
  const [animationError, setAnimationError] = useState(false)
  // const [isLoading, setIsLoading] = useState(true) // Available for future loading state management

  // Auto-hide loading state after a reasonable time
  // useEffect(() => {
  //   const timer = setTimeout(() => setIsLoading(false), 500)
  //   return () => clearTimeout(timer)
  // }, [])

  // Use custom animation data or theme-based animation
  const currentAnimation = animationData || animationThemes[theme]

  // Get default message if none provided
  const displayMessage = message || defaultMessages[theme]

  // Fallback component when animation fails or isn't available
  const renderFallback = () => {
    if (fallback) return fallback

    // Enhanced animated fallbacks with CSS animations
    const animatedIcons = {
      generation: {
        icon: '🎨',
        animation: 'animate-bounce',
        gradient: 'from-purple-100 via-pink-100 to-yellow-100',
        pulseColors: 'from-purple-200 to-pink-200'
      },
      upload: {
        icon: '📸',
        animation: 'animate-pulse',
        gradient: 'from-blue-100 via-cyan-100 to-teal-100',
        pulseColors: 'from-blue-200 to-cyan-200'
      },
      editing: {
        icon: '✏️',
        animation: 'animate-ping',
        gradient: 'from-green-100 via-emerald-100 to-teal-100',
        pulseColors: 'from-green-200 to-emerald-200'
      },
      success: {
        icon: '✅',
        animation: 'animate-bounce',
        gradient: 'from-green-100 via-emerald-100 to-lime-100',
        pulseColors: 'from-green-200 to-emerald-200'
      },
    }

    const config = animatedIcons[theme]

    return (
      <div className="flex flex-col items-center space-y-4">
        {/* Animated Icon Container with Multiple Effects */}
        <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
          {/* Pulsing Background Ring */}
          <div className={`absolute inset-0 bg-gradient-to-br ${config.pulseColors} rounded-full opacity-30 animate-ping`} />

          {/* Main Icon Container */}
          <div className={`${sizeClasses[size]} flex items-center justify-center bg-gradient-to-br ${config.gradient} rounded-full border-2 border-white shadow-lg relative z-10`}>
            <span className={`text-2xl ${config.animation}`} style={{ animationDuration: '2s' }}>
              {config.icon}
            </span>
          </div>

          {/* Rotating Ring for Generation Theme */}
          {theme === 'generation' && (
            <div className="absolute inset-0 border-2 border-dashed border-purple-300 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
          )}

          {/* Floating Sparkles for Success Theme */}
          {theme === 'success' && (
            <>
              <div className="absolute -top-2 -right-2 text-yellow-400 animate-bounce" style={{ animationDelay: '0.5s' }}>✨</div>
              <div className="absolute -bottom-2 -left-2 text-yellow-400 animate-bounce" style={{ animationDelay: '1s' }}>⭐</div>
            </>
          )}
        </div>

        {showProgress && progress !== undefined && (
          <Progress value={progress} className="w-full max-w-xs" />
        )}
      </div>
    )
  }

  // Show fallback if animation failed to load or no animation available
  if (animationError || !currentAnimation) {
    return (
      <div className={`flex flex-col items-center space-y-4 ${className}`}>
        {renderFallback()}
        {displayMessage && (
          <p className="text-sm text-gray-600 text-center font-medium">
            {displayMessage}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Lottie Animation */}
      <div className={sizeClasses[size]}>
        <Lottie
          animationData={currentAnimation}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
          onError={() => setAnimationError(true)}
        />
      </div>

      {/* Progress Bar */}
      {showProgress && progress !== undefined && (
        <Progress value={progress} className="w-full max-w-xs" />
      )}

      {/* Loading Message */}
      {displayMessage && (
        <p className="text-sm text-gray-600 text-center font-medium">
          {displayMessage}
        </p>
      )}
    </div>
  )
}