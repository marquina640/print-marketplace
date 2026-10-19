'use client'

import { useState } from 'react'

const PRESETS = [100, 250, 500, 1000]

export function FundAccount() {
  const [amount,   setAmount]   = useState('')
  const [currency, setCurrency] = useState('CHF')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleFund() {
    const parsed = parseFloat(amount)
    if (!parsed || parsed < 1) { setError('Enter an amount of at least 1'); return }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/admin-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed, currency }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create session')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-warm-200 bg-white p-5 space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-warm-400 mb-1">Platform Balance</p>
        <h2 className="font-bold text-lg text-ink-900">Add funds</h2>
        <p className="text-sm text-warm-500 mt-1">
          Top up the platform Stripe account. Funds are used to pay out makers on delivery.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(String(p))}
            className="rounded-xl border border-warm-200 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-warm-50 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex rounded-xl border border-warm-300 overflow-hidden flex-1">
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="bg-warm-50 border-r border-warm-300 px-3 text-sm font-medium text-ink-700 focus:outline-none"
          >
            <option value="CHF">CHF</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
          />
        </div>
        <button
          onClick={handleFund}
          disabled={loading}
          className="rounded-xl bg-ink-900 text-white font-semibold px-5 py-2.5 text-sm hover:bg-ink-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? 'Loading…' : 'Pay →'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
