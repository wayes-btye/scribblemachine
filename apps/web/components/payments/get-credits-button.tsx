'use client'

import { CheckoutDialog } from './checkout-dialog'
import { Button } from '@/components/ui/button'
import { Coins, CreditCard } from 'lucide-react'

interface GetCreditsButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
  onCreditsUpdated?: () => void
  disabled?: boolean
}

export function GetCreditsButton({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  onCreditsUpdated,
  disabled = false
}: GetCreditsButtonProps) {
  const defaultContent = (
    <div className="flex items-center gap-2">
      <Coins className="h-4 w-4" />
      Get Credits
    </div>
  )

  return (
    <CheckoutDialog onCreditsUpdated={onCreditsUpdated}>
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
      >
        {children || defaultContent}
      </Button>
    </CheckoutDialog>
  )
}

// Specialized version for when user has insufficient credits
export function InsufficientCreditsButton({
  requiredCredits: _requiredCredits = 1,
  onCreditsUpdated,
  className = ''
}: {
  requiredCredits?: number
  onCreditsUpdated?: () => void
  className?: string
}) {
  return (
    <CheckoutDialog onCreditsUpdated={onCreditsUpdated}>
      <Button
        variant="default"
        size="lg"
        className={`w-full ${className}`}
      >
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Get Credits to Continue
        </div>
      </Button>
    </CheckoutDialog>
  )
}