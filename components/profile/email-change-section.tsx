'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function EmailChangeSection() {
  const [currentEmail, setCurrentEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setCurrentEmail(data.user.email)
    })
  }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim() || newEmail === currentEmail) return
    setStatus('sending')
    setErrorMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="card p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-ink-900">Email Address</h2>
        <p className="text-xs text-warm-500 mt-0.5">Used to log in and receive notifications.</p>
      </div>
      <div className="rounded-xl bg-warm-50 border border-warm-200 px-4 py-2.5 text-sm text-warm-700">
        Current: <span className="font-medium text-ink-900">{currentEmail || '…'}</span>
      </div>
      {status === 'sent' ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          Confirmation email sent to <strong>{newEmail}</strong>. Click the link in that email to complete the change.
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => { setNewEmail(e.target.value); setStatus('idle') }}
            placeholder="New email address"
            className="flex-1 rounded-xl border border-warm-200 px-3 py-2.5 text-sm text-ink-900 placeholder-warm-400 focus:border-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-200"
          />
          <Button type="submit" loading={status === 'sending'} variant="outline" size="sm">
            Send confirmation
          </Button>
        </form>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-600">{errorMsg}</p>
      )}
    </div>
  )
}
