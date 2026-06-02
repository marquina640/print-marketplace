'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { inviteMakerToJob, getClientOpenJobs } from '@/app/actions/invitations'
import { formatCurrency } from '@/lib/utils'
import { Send, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react'

interface Job { id: string; title: string; material: string; budget: number | null; currency: string | null }

export function InviteToJobButton({ makerId, makerName }: { makerId: string; makerName: string }) {
  const [open, setOpen]         = useState(false)
  const [jobs, setJobs]         = useState<Job[]>([])
  const [loading, setLoading]   = useState(false)
  const [sending, setSending]   = useState<string | null>(null)
  const [sent, setSent]         = useState<Set<string>>(new Set())
  const [error, setError]       = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleOpen() {
    if (!open && jobs.length === 0) {
      setLoading(true)
      const result = await getClientOpenJobs()
      setJobs(result as Job[])
      setLoading(false)
    }
    setOpen((v) => !v)
    setError(null)
  }

  async function handleInvite(jobId: string) {
    setSending(jobId)
    setError(null)
    const result = await inviteMakerToJob(jobId, makerId)
    if (result.error) {
      setError(result.error)
    } else {
      setSent((prev) => new Set([...prev, jobId]))
    }
    setSending(null)
  }

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <Button
        variant="outline"
        className="w-full sm:w-auto flex items-center gap-2"
        onClick={handleOpen}
      >
        <Send className="h-4 w-4" />
        Invite to existing request
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-warm-200 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-warm-100">
            <p className="text-sm font-semibold text-ink-900">Invite {makerName} to quote</p>
            <p className="text-xs text-warm-500 mt-0.5">Select one of your open requests</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-warm-400" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-warm-500 mb-3">You have no open requests.</p>
              <a href="/jobs/new"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gold-500 px-4 py-2 text-xs font-bold text-ink-950 hover:bg-gold-600 transition-colors">
                Post a request first
              </a>
            </div>
          ) : (
            <ul className="divide-y divide-warm-100 max-h-72 overflow-y-auto">
              {jobs.map((job) => {
                const alreadySent = sent.has(job.id)
                const isSending   = sending === job.id
                return (
                  <li key={job.id}>
                    <button
                      onClick={() => !alreadySent && handleInvite(job.id)}
                      disabled={alreadySent || isSending}
                      className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between gap-3 ${
                        alreadySent ? 'bg-emerald-50 cursor-default' : 'hover:bg-warm-50 cursor-pointer'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-900 truncate">{job.title}</p>
                        <p className="text-xs text-warm-400 mt-0.5">
                          {job.material}
                          {job.budget ? ` · ${formatCurrency(job.budget, job.currency ?? 'CHF')}` : ''}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {alreadySent ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" /> Sent
                          </span>
                        ) : isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin text-warm-400" />
                        ) : (
                          <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                            Invite
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-100">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
