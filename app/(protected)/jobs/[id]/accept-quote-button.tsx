'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { notifyQuoteAccepted } from '@/app/actions/notifications'
import { sendMessage } from '@/app/actions/send-message'

interface Props {
  jobId: string
  quoteId: string
  printerId: string
  printerEmail?: string
  priceAmount?: number
  jobTitle?: string
}

export function AcceptQuoteButton({ jobId, quoteId, printerId, printerEmail, priceAmount, jobTitle }: Props) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleAccept() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()

      await supabase.from('quotes').update({ status: 'rejected' }).eq('job_id', jobId).neq('id', quoteId)
      await supabase.from('quotes').update({ status: 'accepted' }).eq('id', quoteId)
      await supabase.from('jobs').update({ status: 'accepted', accepted_quote_id: quoteId }).eq('id', jobId)

      if (printerEmail && priceAmount && jobTitle) {
        await notifyQuoteAccepted({ jobId, jobTitle, printerId, printerEmail, price: priceAmount })
      }

      if (message.trim()) {
        await sendMessage({ jobId, receiverId: printerId, content: message.trim() })
      }

      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Accept Quote
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !loading && setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <h2 className="text-lg font-bold text-ink-900 mb-1">Accept this quote?</h2>
            <p className="text-sm text-warm-500 mb-5">
              You can send the maker a message with any details about your order — dimensions, colors, delivery preferences, etc.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-800 mb-1">
                  Message to maker <span className="text-warm-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  placeholder="e.g. Please print in black PLA, I need it by Friday…"
                  className="w-full rounded-xl border border-warm-300 bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink-400"
                  autoFocus
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="button" variant="gold" className="flex-1" loading={loading} onClick={handleAccept}>
                  Accept & send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
