'use client'

import { useTransition } from 'react'
import { setAdminPreview } from '@/app/actions/admin-preview'

export function PreviewBanner({ role, userName }: { role: string; userName?: string }) {
  const [pending, startTransition] = useTransition()
  const roleLabel = role === 'client' ? 'Customer' : 'Maker'
  const label = userName ? `${roleLabel} "${userName}"` : roleLabel

  function exitPreview() {
    startTransition(async () => { await setAdminPreview(null) })
  }

  return (
    <div className="sticky top-16 z-30 flex items-center justify-between bg-amber-400 px-4 py-2 text-sm font-medium text-amber-900">
      <span>Admin preview mode — viewing as <strong>{label}</strong></span>
      <button
        onClick={exitPreview}
        disabled={pending}
        className="rounded-lg bg-amber-900/15 px-3 py-1 text-xs font-semibold hover:bg-amber-900/25 disabled:opacity-50 transition-colors"
      >
        {pending ? '…' : 'Exit Preview'}
      </button>
    </div>
  )
}
