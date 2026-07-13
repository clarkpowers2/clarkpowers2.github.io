import { FormEvent, useState } from 'react'
import { Storefront } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'sign-in' | 'register'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isRegister = mode === 'register'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedEmail = email.trim()
    const trimmedName = name.trim()

    if (!trimmedEmail || !password || (isRegister && !trimmedName)) {
      toast.error('Complete all required fields')
      return
    }

    setSubmitting(true)

    try {
      if (isRegister) {
        const { requiresVerification } = await signUp(trimmedEmail, password, trimmedName)
        if (requiresVerification) {
          toast.success('Account created. Check your email to verify it, then sign in.')
          setMode('sign-in')
        } else {
          toast.success('Account created')
        }
      } else {
        await signIn(trimmedEmail, password)
        toast.success('Signed in')
      }
    } catch (error) {
      console.error('Authentication failed:', error)
      toast.error(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Storefront size={28} weight="fill" className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">FreshSave Manager</h1>
            <p className="text-sm text-muted-foreground">
              {isRegister ? 'Create your manager account' : 'Sign in to manage your store'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-2">
              <Label htmlFor="manager-name">Manager name</Label>
              <Input
                id="manager-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={submitting}
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="manager-email">Email</Label>
            <Input
              id="manager-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager-password">Password</Label>
            <Input
              id="manager-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="link"
            onClick={() => setMode(isRegister ? 'sign-in' : 'register')}
            disabled={submitting}
          >
            {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
