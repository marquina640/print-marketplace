'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { markJobShipped } from '@/app/actions/escrow'

export function MarkShippedButton({ jobId }: { jobId: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Confirm that you have shipped the order to the client?')) return
    startTransition(async () => {
      try {
        await markJobShipped(jobId)
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  return (
    <Button onClick={handleClick} loading={pending} variant="gold">
      Mark as Shipped
    </Button>
  )
}
