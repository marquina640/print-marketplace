'use client'

import { useRouter } from 'next/navigation'

export function MessageUserButton({ userId, name }: { userId: string; name: string }) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(`/messages/direct/${userId}`)}
      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm whitespace-nowrap"
    >
      Message
    </button>
  )
}
