import { FormEvent, useEffect, useMemo, useState } from 'react'
import { EnvelopeSimple, Storefront } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { isEmailVerificationRequiredError, useAuth } from '@/lib/auth'

const PENDING_VERIFICATION_EMAIL_KEY = 'freshsave-pending-verification-email'
const VERIFICATION_RESEND_AT_KEY = 'freshsave-verification-resend-at'
const RESEND_COOLDOWN_SECONDS = 45

export function AuthScreen() {
  const { signIn, signUp, verifyEmail, resendVerificationEmail } = useAuth()
  const [mode, setMode] = useState<'sign-in' | 'register' | 'verify'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [resendAvailableAt, setResendAvailableAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  const isRegister = mode === 'register'
  const isVerifying = mode === 'verify'
  const resendSecondsRemaining = useMemo(() => {
    return Math.max(0, Math.ceil((resendAvailableAt - now) / 1000))
  }, [now, resendAvailableAt])

  useEffect(() => {
    const pendingEmail = window.localStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY)
    const resendAt = Number(window.localStorage.getItem(VERIFICATION_RESEND_AT_KEY) || '0')

    if (pendingEmail) {
      setVerificationEmail(pendingEmail)
      setEmail(pendingEmail)
      setMode('verify')
    }

    if (Number.isFinite(resendAt)) {
      setResendAvailableAt(resendAt)
    }
  }, [])

  useEffect(() => {
    if (resendSecondsRemaining <= 0) return

    const intervalId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [resendSecondsRemaining])

  function startVerificationFlow(nextEmail: string) {
    const normalizedEmail = nextEmail.trim()
    const nextResendAt = Date.now() + RESEND_COOLDOWN_SECONDS * 1000

    setVerificationEmail(normalizedEmail)
    setEmail(normalizedEmail)
    setVerificationCode('')
    setMode('verify')
    setResendAvailableAt(nextResendAt)
    setNow(Date.now())
    window.localStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, normalizedEmail)
    window.localStorage.setItem(VERIFICATION_RESEND_AT_KEY, String(nextResendAt))
  }

  function clearVerificationFlow() {
    setVerificationEmail('')
    setVerificationCode('')
    setResendAvailableAt(0)
    window.localStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY)
    window.localStorage.removeItem(VERIFICATION_RESEND_AT_KEY)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedEmail = email.trim()
    const trimmedName = name.trim()

    if (isVerifying && !verificationEmail) {
      toast.error('Start again with your email address')
      clearVerificationFlow()
      setMode('sign-in')
      return
    }

    if (!isVerifying && (!trimmedEmail || !password || (isRegister && !trimmedName))) {
      toast.error('Complete all required fields')
      return
    }

    setSubmitting(true)

    try {
      if (isVerifying) {
        const trimmedCode = verificationCode.trim()

        if (trimmedCode.length !== 6) {
          toast.error('Enter the 6-digit code from your email')
          return
        }

        await verifyEmail(verificationEmail, trimmedCode)
        clearVerificationFlow()
        toast.success('Email verified. You are signed in.')
      } else if (isRegister) {
        const { requiresVerification } = await signUp(trimmedEmail, password, trimmedName)
        if (requiresVerification) {
          startVerificationFlow(trimmedEmail)
          toast.success('Account created. Check your email for the code.')
        } else {
          toast.success('Account created')
        }
      } else {
        await signIn(trimmedEmail, password)
        clearVerificationFlow()
        toast.success('Signed in')
      }
    } catch (error) {
      console.error('Authentication failed:', error)

      if (!isRegister && !isVerifying && isEmailVerificationRequiredError(error)) {
        startVerificationFlow(trimmedEmail)
      }

      toast.error(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendCode() {
    if (!verificationEmail || resendSecondsRemaining > 0) return

    setResending(true)

    try {
      await resendVerificationEmail(verificationEmail)
      const nextResendAt = Date.now() + RESEND_COOLDOWN_SECONDS * 1000
      setResendAvailableAt(nextResendAt)
      setNow(Date.now())
      window.localStorage.setItem(VERIFICATION_RESEND_AT_KEY, String(nextResendAt))
      toast.success('A new code was sent.')
    } catch (error) {
      console.error('Resend verification failed:', error)
      toast.error(error instanceof Error ? error.message : 'Could not send a new code')
    } finally {
      setResending(false)
    }
  }

  function handleUseDifferentEmail() {
    clearVerificationFlow()
    setMode('sign-in')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            {isVerifying ? (
              <EnvelopeSimple size={28} weight="fill" className="text-primary" />
            ) : (
              <Storefront size={28} weight="fill" className="text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {isVerifying ? 'Verify your email' : 'FreshSave Manager'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isVerifying
                ? `Code sent to ${verificationEmail}`
                : isRegister
                  ? 'Create your manager account'
                  : 'Sign in to manage your store'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isVerifying ? (
            <div className="space-y-3">
              <Label htmlFor="verification-code">Verification code</Label>
              <InputOTP
                id="verification-code"
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                value={verificationCode}
                onChange={(value) => setVerificationCode(value.replace(/\D/g, ''))}
                disabled={submitting}
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} className="h-11 w-11 text-base" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your FreshSave Pro email.
              </p>
            </div>
          ) : isRegister && (
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

          {!isVerifying && (
            <>
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
            </>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting
              ? 'Please wait...'
              : isVerifying
                ? 'Verify Email'
                : isRegister
                  ? 'Create Account'
                  : 'Sign In'}
          </Button>
        </form>

        {isVerifying ? (
          <div className="mt-4 grid gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResendCode}
              disabled={submitting || resending || resendSecondsRemaining > 0}
            >
              {resending
                ? 'Sending...'
                : resendSecondsRemaining > 0
                  ? `Resend Code in ${resendSecondsRemaining}s`
                  : 'Resend Code'}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={handleUseDifferentEmail}
              disabled={submitting || resending}
            >
              Use a different email
            </Button>
          </div>
        ) : (
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
        )}
      </Card>
    </div>
  )
}
