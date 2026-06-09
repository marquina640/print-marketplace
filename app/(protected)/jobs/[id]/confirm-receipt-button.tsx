'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { confirmJobDelivery } from '@/app/actions/payments'

export function ConfirmReceiptButton({ jobId }: { jobId: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Confirm that you have received the order and are happy with it?')) return
    startTransition(async () => {
      try {
        await confirmJobDelivery(jobId)
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  return (
    <Button onClick={handleClick} loading={pending} variant="gold">
      Confirm Receipt
    </Button>
  )
}
