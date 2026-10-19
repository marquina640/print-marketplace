'use client'

import { useTransition } from 'react'
import { setAdminPreview } from '@/app/actions/admin-preview'

export function PreviewAsButton({ userId, role }: { userId: string; role: 'client' | 'printer_owner' }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await setAdminPreview(role, userId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm disabled:opacity-50 whitespace-nowrap"
    >
      {pending ? 'Loading…' : 'Preview as →'}
    </button>
  )
}
