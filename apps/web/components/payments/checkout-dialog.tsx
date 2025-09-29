'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coins, CreditCard, Check, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CreditPack {
  id: string
  name: string
  credits: number
  price: number
  currency: string
  description: string
  popular?: boolean
  priceId: string
}

const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 15,
    price: 2,
    currency: 'GBP',
    description: 'Perfect for getting started',
    priceId: 'price_1SAmkQAQe8UyOioCz7ktbUUT'
  },
  {
    id: 'value',
    name: 'Value Pack',
    credits: 50,
    price: 5,
    currency: 'GBP',
    description: 'Best value for regular users',
    popular: true,
    priceId: 'price_1SAmkgAQe8UyOioCLohnPXpX'
  }
]

interface CheckoutDialogProps {
  children: React.ReactNode
  onCreditsUpdated?: () => void
}

export function CheckoutDialog({ children, onCreditsUpdated: _onCreditsUpdated }: CheckoutDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const handleCheckout = async (pack: CreditPack) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to purchase credits.",
        variant: "destructive",
      })
      return
    }

    setLoading(pack.id)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: pack.priceId,
          credits: pack.credits,
          pack: pack.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = url

    } catch (error) {
      console.error('Checkout error:', error)
      toast({
        title: "Checkout failed",
        description: "Unable to start checkout process. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-brand-warm-orange" />
            Get Credits
          </DialogTitle>
          <DialogDescription>
            Choose a credit pack to continue generating coloring pages
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {CREDIT_PACKS.map((pack) => (
            <Card
              key={pack.id}
              className={`relative cursor-pointer transition-all hover:shadow-md ${pack.popular ? 'ring-2 ring-brand-warm-orange ring-opacity-50' : ''
                }`}
            >
              {pack.popular && (
                <Badge className="absolute -top-2 left-4 bg-brand-warm-orange text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{pack.name}</CardTitle>
                  <div className="text-right">
                    <div className="text-2xl font-bold">£{pack.price}</div>
                    <div className="text-sm text-muted-foreground">
                      £{(pack.price / pack.credits).toFixed(2)} per credit
                    </div>
                  </div>
                </div>
                <CardDescription>{pack.description}</CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-brand-warm-orange" />
                    <span className="font-medium">{pack.credits} credits</span>
                  </div>
                  {pack.popular && (
                    <Badge variant="outline" className="text-brand-warm-orange border-brand-warm-orange">
                      Best Value
                    </Badge>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleCheckout(pack)}
                  disabled={loading !== null}
                  variant={pack.popular ? "default" : "outline"}
                >
                  {loading === pack.id ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Purchase Credits
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            Secure payment processing via Stripe
          </div>
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            Credits never expire
          </div>
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            Instant credit top-up after payment
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}