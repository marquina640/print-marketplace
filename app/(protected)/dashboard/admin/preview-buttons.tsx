'use client'

import { useTransition } from 'react'
import { setAdminPreview } from '@/app/actions/admin-preview'

interface PreviewUser {
  user_id: string
  display_name: string | null
  email: string
  role: string
}

interface AdminPreviewButtonsProps {
  clients: PreviewUser[]
  makers: PreviewUser[]
}

export function AdminPreviewButtons({ clients, makers }: AdminPreviewButtonsProps) {
  const [pending, startTransition] = useTransition()

  function preview(role: 'client' | 'printer_owner', userId?: string) {
    startTransition(async () => { await setAdminPreview(role, userId) })
  }

  return (
    <div className="rounded-2xl border-2 border-ink-300 bg-ink-900 text-white p-5 space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-ink-300 mb-1">Admin Tools</p>
        <h2 className="font-bold text-lg">Preview Mode</h2>
        <p className="text-sm text-ink-300 mt-1">
          Preview as a specific user to see their exact data. A banner appears — click &quot;Exit Preview&quot; to return.
        </p>
      </div>

      {/* Clients */}
      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-2">Customers (test)</p>
        <div className="flex flex-wrap gap-2">
          {clients.length === 0 && (
            <span className="text-xs text-ink-500">No client accounts found</span>
          )}
          {clients.map((u) => (
            <button
              key={u.user_id}
              onClick={() => preview('client', u.user_id)}
              disabled={pending}
              className="rounded-xl bg-gold-400 text-ink-900 font-semibold px-4 py-1.5 text-sm hover:bg-gold-300 disabled:opacity-50 transition-colors"
            >
              👤 {u.display_name ?? u.email.split('@')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Makers */}
      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-2">Makers (test)</p>
        <div className="flex flex-wrap gap-2">
          {makers.length === 0 && (
            <span className="text-xs text-ink-500">No maker accounts found</span>
          )}
          {makers.map((u) => (
            <button
              key={u.user_id}
              onClick={() => preview('printer_owner', u.user_id)}
              disabled={pending}
              className="rounded-xl bg-white/15 text-white font-semibold px-4 py-1.5 text-sm hover:bg-white/25 disabled:opacity-50 transition-colors border border-white/20"
            >
              🖨 {u.display_name ?? u.email.split('@')[0]}
            </button>
          ))}
        </div>
      </div>

      {pending && <p className="text-xs text-ink-400">Switching preview…</p>}
    </div>
  )
}
