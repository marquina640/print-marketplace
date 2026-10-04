'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ShareMakerButton({ makerId, makerName }: { makerId: string; makerName: string }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/makers/${makerId}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // fallback: select a temp input
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="w-full sm:w-auto">
      {copied ? '✓ Link copied!' : `Share ${makerName.split(' ')[0]}'s profile`}
    </Button>
  )
}
