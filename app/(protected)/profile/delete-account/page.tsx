'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { deleteAccount } from '@/app/actions/delete-account'

export default function DeleteAccountPage() {
  const router = useRouter()
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [done, setDone]         = useState(false)

  const confirmed = confirm.trim().toLowerCase() === 'delete my account'

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    if (!confirmed) return
    setLoading(true)
    setError(null)

    const result = await deleteAccount()

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Sign out client-side after server deletes the user
    const supabase = createClient()
    await supabase.auth.signOut()
    setDone(true)
    setTimeout(() => router.push('/'), 3000)
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="text-5xl mb-4">👋</div>
        <h2 className="text-2xl font-bold text-warm-900 mb-2">Account deleted</h2>
        <p className="text-warm-500 text-sm">Your account and all associated data have been permanently removed. Redirecting you to the homepage…</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-10 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-900">
        ← Back to dashboard
      </Link>

      <div className="card p-8 space-y-6">
        {/* Warning header */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-warm-900">Delete your account</h1>
            <p className="text-sm text-warm-500 mt-1">This is permanent and cannot be undone.</p>
          </div>
        </div>

        {/* What gets deleted */}
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-2">
          <p className="text-sm font-semibold text-red-800">The following will be permanently deleted:</p>
          <ul className="text-sm text-red-700 space-y-1 list-disc pl-4">
            <li>Your profile and all account information</li>
            <li>All job requests you posted</li>
            <li>All quotes you submitted</li>
            <li>All messages and reviews</li>
            <li>Your maker profile, machines, and portfolio</li>
          </ul>
        </div>

        {/* Blocker info */}
        <p className="text-sm text-warm-600 leading-relaxed">
          You <strong className="text-warm-900">cannot</strong> delete your account if you have jobs currently in progress (paid or shipped). Complete or resolve any active transactions first.
        </p>

        {/* Confirmation form */}
        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Type <span className="font-mono font-bold text-red-600">delete my account</span> to confirm
            </label>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="delete my account"
              className="w-full rounded-xl border border-warm-300 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Link
              href="/dashboard"
              className="flex-1 rounded-xl border border-warm-300 px-4 py-2.5 text-sm font-medium text-warm-700 hover:bg-warm-50 transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!confirmed || loading}
              className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Deleting…
                </>
              ) : 'Permanently delete account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
