'use client'

import { useState, useTransition } from 'react'
import { createReferralCode, activateReferralWaiver } from '@/app/actions/referrals'

interface ReferralCode {
  id: string
  code: string
  influencer_name: string
  influencer_email: string | null
  instagram_handle: string | null
  tier: string | null
  fee_waiver_months: number | null
  uses: number
  waiver_activated: boolean
  active: boolean
}

const TIER_MONTHS: Record<string, number> = { story: 1, post: 2, reel: 4 }

export function ReferralPanel({ codes, appUrl }: { codes: ReferralCode[]; appUrl: string }) {
  const [, startTransition] = useTransition()
  const [localCodes, setLocalCodes] = useState<ReferralCode[]>(codes)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [newCode, setNewCode] = useState({ code: '', name: '', email: '', instagram: '' })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newCode.code.trim() || !newCode.name.trim()) { setError('Code and name are required.'); return }
    setCreating(true)
    setError(null)
    startTransition(async () => {
      const result = await createReferralCode({
        code: newCode.code.trim().toLowerCase().replace(/\s+/g, '-'),
        influencer_name: newCode.name.trim(),
        influencer_email: newCode.email.trim() || null,
        instagram_handle: newCode.instagram.trim() || null,
      })
      if (result.error) { setError(result.error) }
      else {
        setLocalCodes((prev) => [result.code!, ...prev])
        setNewCode({ code: '', name: '', email: '', instagram: '' })
        setSuccess(`Code "${result.code!.code}" created.`)
        setTimeout(() => setSuccess(null), 3000)
      }
      setCreating(false)
    })
  }

  function handleActivate(codeId: string, codeName: string, tier: string) {
    setError(null)
    startTransition(async () => {
      const result = await activateReferralWaiver(codeId, tier)
      if (result.error) { setError(result.error) }
      else {
        setLocalCodes((prev) => prev.map((c) =>
          c.id === codeId ? { ...c, tier, fee_waiver_months: TIER_MONTHS[tier], waiver_activated: true } : c
        ))
        setSuccess(`Waiver activated for ${codeName} (${tier} — ${TIER_MONTHS[tier]} month${TIER_MONTHS[tier] > 1 ? 's' : ''}).`)
        setTimeout(() => setSuccess(null), 4000)
      }
    })
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{success}</p>}

      {/* Create new code */}
      <form onSubmit={handleCreate} className="bg-warm-50 border border-warm-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-ink-800">Create referral code</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Code *</label>
            <input
              className="mt-1 block w-full rounded-xl border border-warm-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              placeholder="e.g. marieta3d"
              value={newCode.code}
              onChange={(e) => setNewCode((p) => ({ ...p, code: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Influencer name *</label>
            <input
              className="mt-1 block w-full rounded-xl border border-warm-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              placeholder="e.g. Marieta 3D"
              value={newCode.name}
              onChange={(e) => setNewCode((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Instagram handle</label>
            <input
              className="mt-1 block w-full rounded-xl border border-warm-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              placeholder="@marieta.3d"
              value={newCode.instagram}
              onChange={(e) => setNewCode((p) => ({ ...p, instagram: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="mt-1 block w-full rounded-xl border border-warm-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              placeholder="influencer@email.com"
              value={newCode.email}
              onChange={(e) => setNewCode((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 rounded-xl bg-ink-800 text-white text-sm font-medium hover:bg-ink-700 disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Create code'}
        </button>
      </form>

      {/* Codes table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-warm-200 text-left text-xs uppercase tracking-wider text-warm-400">
              <th className="pb-2 pr-4">Code / Link</th>
              <th className="pb-2 pr-4">Influencer</th>
              <th className="pb-2 pr-4">Uses</th>
              <th className="pb-2 pr-4">Waiver</th>
              <th className="pb-2">Activate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {localCodes.map((rc) => (
              <tr key={rc.id} className="py-2">
                <td className="py-3 pr-4">
                  <p className="font-mono font-semibold text-ink-800">{rc.code}</p>
                  <p className="text-xs text-warm-400 break-all">{appUrl}/?ref={rc.code}</p>
                </td>
                <td className="py-3 pr-4">
                  <p className="font-medium text-ink-800">{rc.influencer_name}</p>
                  {rc.instagram_handle && <p className="text-xs text-warm-400">{rc.instagram_handle}</p>}
                  {rc.influencer_email && <p className="text-xs text-warm-400">{rc.influencer_email}</p>}
                </td>
                <td className="py-3 pr-4">
                  <span className="font-semibold text-ink-800">{rc.uses}</span>
                  <span className="text-warm-400 ml-1">signups</span>
                </td>
                <td className="py-3 pr-4">
                  {rc.waiver_activated ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      Active · {rc.tier} · {rc.fee_waiver_months}mo
                    </span>
                  ) : (
                    <span className="text-xs text-warm-400">Not activated</span>
                  )}
                </td>
                <td className="py-3">
                  {!rc.waiver_activated && (
                    <div className="flex gap-1">
                      {(['story', 'post', 'reel'] as const).map((tier) => (
                        <button
                          key={tier}
                          onClick={() => handleActivate(rc.id, rc.influencer_name, tier)}
                          className="px-2 py-1 rounded-lg border border-warm-300 text-xs hover:bg-warm-100 capitalize"
                        >
                          {tier} ({TIER_MONTHS[tier]}mo)
                        </button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {localCodes.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-warm-400">No referral codes yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
