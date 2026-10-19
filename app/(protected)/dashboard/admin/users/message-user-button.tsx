'use client'

import { useState } from 'react'
import { sendAdminMessage } from '@/app/actions/admin-message'

export function MessageUserButton({ email, name }: { email: string; name: string }) {
  const [open,    setOpen]    = useState(false)
  const [subject, setSubject] = useState('')
  const [body,    setBody]    = useState('')
  const [sending, setSending] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  function handleOpen() {
    setSubject('')
    setBody('')
    setDone(false)
    setError(null)
    setOpen(true)
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) { setError('Subject and message are required.'); return }
    setSending(true)
    setError(null)
    try {
      await sendAdminMessage({ toEmail: email, toName: name, subject, body })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm whitespace-nowrap"
      >
        Message
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !sending && setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-ink-900">Message {name}</h2>
              <p className="text-sm text-warm-500">{email}</p>
            </div>

            {done ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 font-medium">
                ✓ Email sent to {email}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-warm-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Your account on PrintMarketHub"
                    className="w-full rounded-xl border border-warm-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-warm-700 mb-1">Message</label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={5}
                    placeholder="Write your message…"
                    className="w-full rounded-xl border border-warm-300 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink-400"
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={sending}
                className="flex-1 rounded-xl border border-warm-300 py-2.5 text-sm font-medium text-ink-700 hover:bg-warm-50 disabled:opacity-50"
              >
                {done ? 'Close' : 'Cancel'}
              </button>
              {!done && (
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-1 rounded-xl bg-ink-900 text-white py-2.5 text-sm font-semibold hover:bg-ink-700 disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send email'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
