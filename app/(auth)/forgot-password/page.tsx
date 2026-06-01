'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    // Always show the success state — don't reveal whether an account exists
    if (authError) console.error('[forgot-password]', authError.message)
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm">
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-ink-900 mb-2">Check your email</h2>
          <p className="text-sm text-warm-500">
            If <strong>{email}</strong> is registered, we&apos;ve sent a password reset link.
            It expires in 1 hour.
          </p>
          <p className="mt-4 text-xs text-warm-400">Didn&apos;t receive it? Check your spam folder.</p>
          <Link href="/login" className="mt-6 block text-sm font-medium text-ink-700 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-ink-900">Reset your password</h1>
          <p className="mt-1 text-sm text-warm-500">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Send reset link
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-warm-500">
          Remembered it?{' '}
          <Link href="/login" className="font-medium text-ink-700 hover:text-ink-900">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
