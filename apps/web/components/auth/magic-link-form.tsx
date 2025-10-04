'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth/auth-provider'
import { Mail, Loader2 } from 'lucide-react'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type EmailFormData = z.infer<typeof emailSchema>

interface MagicLinkFormProps {
  onSuccess?: () => void
  redirectTo?: string
}

export function MagicLinkForm({ onSuccess }: MagicLinkFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { signInWithEmail, devBypassAuth } = useAuth()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })

  const onSubmit = async (data: EmailFormData) => {
    setIsSubmitting(true)

    try {
      const { error } = await signInWithEmail(data.email)

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error sending magic link',
          description: error.message || 'Something went wrong. Please try again.',
        })
      } else {
        setEmailSent(true)
        toast({
          title: 'Magic link sent!',
          description: 'Check your email for a link to sign in.',
        })
        onSuccess?.()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (emailSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a magic link to <span className="font-semibold">{getValues('email')}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Click the link in your email to sign in. You can close this tab.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => {
              setEmailSent(false)
            }}
          >
            Use a different email
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Sign in to Scribble Machine</CardTitle>
        <CardDescription>
          Enter your email to receive a magic link for secure sign-in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              disabled={isSubmitting}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending magic link...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send magic link
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            No password required. We&apos;ll email you a secure link to sign in.
          </p>
        </div>

        {/* Development bypass button - only shown in development mode */}
        {(process.env.NODE_ENV === 'development' ||
          process.env.NEXT_PUBLIC_ENABLE_DEV_BYPASS === 'true') && devBypassAuth && (
            <div className="mt-4 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full text-xs"
                onClick={async () => {
                  try {
                    await devBypassAuth()
                    toast({
                      title: 'Development bypass activated',
                      description: 'Signed in as test user for development.',
                    })
                    onSuccess?.()
                  } catch (error) {
                    toast({
                      title: 'Authentication failed',
                      description: 'Could not sign in test user. Check console for details.',
                      variant: 'destructive',
                    })
                  }
                }}
              >
                🧪 Dev Bypass (wayes.appsmate@gmail.com)
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Development/Preview only - bypasses magic link authentication
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  )
}