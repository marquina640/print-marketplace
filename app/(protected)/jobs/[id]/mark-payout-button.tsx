'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { markPayoutSent } from '@/app/actions/payments'

export function MarkPayoutButton({ jobId, makerName, amount }: { jobId: string; makerName: string; amount: number }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(`Confirm that you have sent CHF ${amount.toFixed(2)} to ${makerName}?`)) return
    startTransition(async () => {
      try {
        await markPayoutSent(jobId)
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  return (
    <Button onClick={handleClick} loading={pending} variant="gold" size="sm">
      Mark Payout Sent
    </Button>
  )
}
