'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, CreditCard, LogOut, Coins } from 'lucide-react'
import { GetCreditsButton } from '@/components/payments'

interface Credits {
  balance: number
  updated_at?: string
}

export function UserProfile() {
  const { user, signOut, loading } = useAuth()
  const [credits, setCredits] = useState<Credits | null>(null)
  const [creditsLoading, setCreditsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCredits()
    }
  }, [user])

  const fetchCredits = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/credits', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCredits(data)
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    } finally {
      setCreditsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase()
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Credits Display */}
      <div className="hidden sm:flex items-center space-x-1">
        {creditsLoading ? (
          <Skeleton className="h-6 w-16" />
        ) : (
          <Badge variant="secondary" className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 text-orange-600 border-orange-500/20">
            <Coins className="w-3 h-3 mr-1" />
            {credits?.balance ?? 0} credits
          </Badge>
        )}
      </div>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full hover:bg-white/20"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                {getInitials(user.email || 'U')}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 bg-white border border-gray-200 shadow-2xl" align="end" forceMount>
          <DropdownMenuLabel className="font-normal text-gray-900">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-gray-900">
                {user.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs leading-none text-gray-500">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Credits (mobile) */}
          <div className="sm:hidden">
            <DropdownMenuItem className="focus:bg-gray-100 text-gray-900 hover:bg-gray-50">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Credits: {credits?.balance ?? 0}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </div>

          <DropdownMenuItem className="focus:bg-gray-100 text-gray-900 hover:bg-gray-50">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>

          <GetCreditsButton
            variant="ghost"
            className="w-full justify-start p-2 h-auto font-normal text-gray-900 hover:bg-gray-100"
            onCreditsUpdated={fetchCredits}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Get Credits</span>
          </GetCreditsButton>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="focus:bg-red-50 focus:text-red-600 cursor-pointer text-gray-900 hover:bg-red-50"
            onSelect={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}