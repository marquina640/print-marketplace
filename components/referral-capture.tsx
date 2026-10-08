'use client'

import { useEffect } from 'react'

export function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      try { localStorage.setItem('pmh_ref', ref) } catch {}
    }
  }, [])

  return null
}
