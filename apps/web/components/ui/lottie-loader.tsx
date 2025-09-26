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

  // Use custom animation data or theme-based animation
  const currentAnimation = animationData || animationThemes[theme]

  // Get default message if none provided
  const displayMessage = message || defaultMessages[theme]

  // Fallback component when animation fails or isn't available
  const renderFallback = () => {
    if (fallback) return fallback

    // Default fallback with appropriate icon and progress bar
    const icons = {
      generation: '🎨',
      upload: '📸',
      editing: '✏️',
      success: '✅',
    }

    return (
      <div className="flex flex-col items-center space-y-4">
        <div className={`${sizeClasses[size]} flex items-center justify-center bg-gradient-to-br from-brand-soft-blue/10 to-brand-soft-pink/10 rounded-full`}>
          <span className="text-2xl">{icons[theme]}</span>
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