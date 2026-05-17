'use client'

import { useState, useTransition } from 'react'
import { setMakerCertification } from '@/app/actions/certify-maker'
import { CertificationBadge } from '@/components/ui/badge'
import { CERTIFICATION_LEVELS } from '@/lib/utils'

interface Maker {
  user_id: string
  display_name: string
  city: string
  certification_level: number
  printer_models: string[]
  email?: string
}

export function CertificationPanel({ makers }: { makers: Maker[] }) {
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localLevels, setLocalLevels] = useState<Record<string, number>>(
    Object.fromEntries(makers.map((m) => [m.user_id, m.certification_level]))
  )

  function handleChange(makerId: string, level: number) {
    setLocalLevels((prev) => ({ ...prev, [makerId]: level }))
  }

  function handleSave(makerId: string) {
    setSaving(makerId)
    setError(null)
    startTransition(async () => {
      try {
        await setMakerCertification(makerId, localLevels[makerId])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update')
      } finally {
        setSaving(null)
      }
    })
  }

  if (makers.length === 0) {
    return (
      <p className="text-sm text-warm-400 py-4">No maker profiles yet.</p>
    )
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>
      )}
      <div className="card divide-y divide-warm-100 overflow-hidden">
        {makers.map((m) => {
          const currentLevel = localLevels[m.user_id] ?? 0
          const isSaving = saving === m.user_id
          const isDirty = currentLevel !== m.certification_level

          return (
            <div key={m.user_id} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900 text-sm">{m.display_name}</p>
                <p className="text-xs text-warm-400">{m.email ?? m.user_id.slice(0, 8)} · {m.city}</p>
                {m.printer_models?.length > 0 && (
                  <p className="text-xs text-warm-500 mt-0.5 truncate">{m.printer_models.join(', ')}</p>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <CertificationBadge level={m.certification_level} size="sm" />

                <select
                  value={currentLevel}
                  onChange={(e) => handleChange(m.user_id, parseInt(e.target.value))}
                  className="rounded-xl border border-warm-300 bg-warm-50 px-2 py-1.5 text-xs focus:outline-none focus:border-ink-500"
                >
                  {CERTIFICATION_LEVELS.map((c) => (
                    <option key={c.level} value={c.level}>L{c.level} — {c.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => handleSave(m.user_id)}
                  disabled={!isDirty || isSaving || pending}
                  className="rounded-xl bg-ink-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
