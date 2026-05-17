'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CertificationBadge } from '@/components/ui/badge'
import { getCertificationLevel, CERTIFICATION_LEVELS, BENCHMARK_REQUIREMENTS } from '@/lib/utils'
import { submitCertificationRequest } from '@/app/actions/request-certification'
import { formatDate } from '@/lib/utils'

interface CertRequest {
  id: string
  requested_level: number
  status: string
  notes: string | null
  admin_notes: string | null
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Under Review',   color: 'bg-amber-50 border-amber-200 text-amber-800'  },
  approved:  { label: 'Approved ✓',     color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  rejected:  { label: 'Not Approved',   color: 'bg-red-50 border-red-200 text-red-700'        },
  more_info: { label: 'Info Requested', color: 'bg-ink-50 border-ink-200 text-ink-700'        },
}

export default function CertificationPage() {
  const [certLevel, setCertLevel]     = useState(0)
  const [requests, setRequests]       = useState<CertRequest[]>([])
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [success, setSuccess]         = useState(false)
  const [openLevel, setOpenLevel]     = useState<number | null>(null)
  const [photos, setPhotos]           = useState<File[]>([])
  const [photoUrls, setPhotoUrls]     = useState<string[]>([])
  const [notes, setNotes]             = useState('')
  const photoRef                      = useRef<HTMLInputElement>(null)

  const hasPending = requests.some((r) => r.status === 'pending')
  const nextLevel  = certLevel < 3 ? certLevel + 1 : null
  const cert       = getCertificationLevel(certLevel)
  const benchmarks = nextLevel ? BENCHMARK_REQUIREMENTS[nextLevel] : null

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: pp }, { data: reqs }] = await Promise.all([
      supabase.from('printer_profiles').select('certification_level').eq('user_id', user.id).single(),
      supabase.from('certification_requests').select('*').eq('maker_id', user.id)
        .order('created_at', { ascending: false }).limit(5),
    ])

    setCertLevel(pp?.certification_level ?? 0)
    setRequests(reqs ?? [])
    setLoading(false)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (photos.length + files.length > 8) { setError('Maximum 8 photos.'); return }
    const previews = files.map((f) => URL.createObjectURL(f))
    setPhotos((prev) => [...prev, ...files])
    setPhotoUrls((prev) => [...prev, ...previews])
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, j) => j !== i))
    setPhotoUrls((prev) => prev.filter((_, j) => j !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nextLevel) return
    setError(null)
    if (photos.length === 0) { setError('Upload at least one benchmark photo.'); return }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload photos
      const uploadedUrls: string[] = []
      for (const photo of photos) {
        const path = `certification/${user.id}/${Date.now()}-${photo.name}`
        const { error: uploadErr } = await supabase.storage
          .from('job-files').upload(path, photo, { contentType: photo.type })
        if (uploadErr) throw new Error(`Photo upload failed: ${uploadErr.message}`)
        const { data: { publicUrl } } = supabase.storage.from('job-files').getPublicUrl(path)
        uploadedUrls.push(publicUrl)
      }

      await submitCertificationRequest(nextLevel, notes, uploadedUrls, certLevel)
      setSuccess(true)
      setPhotos([])
      setPhotoUrls([])
      setNotes('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin h-8 w-8 rounded-full border-4 border-ink-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-7">
      <div>
        <h1 className="section-heading">Certification</h1>
        <p className="text-warm-500 text-sm mt-1">
          PrintMarket certification is your proof of manufacturing quality. Higher levels unlock more jobs and build client trust.
        </p>
      </div>

      {/* Current level */}
      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-warm-400 mb-2">Current Level</p>
            <CertificationBadge level={certLevel} size="lg" />
            <p className="text-sm text-warm-500 mt-2 max-w-md">{cert.description}</p>
          </div>
          <div className="flex gap-1.5">
            {CERTIFICATION_LEVELS.map((c) => (
              <div key={c.level} className="text-center">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg font-mono border-2 transition-all ${
                  c.level <= certLevel
                    ? 'bg-ink-900 border-ink-900 text-gold-400'
                    : 'bg-warm-50 border-warm-200 text-warm-300'
                }`}>
                  {c.icon}
                </div>
                <p className="text-[9px] text-warm-400 mt-1">L{c.level}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Past requests */}
      {requests.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-ink-900 mb-3">Request History</h2>
          <div className="space-y-2">
            {requests.map((r) => {
              const cfg = STATUS_CONFIG[r.status] ?? { label: r.status, color: 'bg-warm-50 border-warm-200 text-warm-700' }
              return (
                <div key={r.id} className={`rounded-xl border p-4 ${cfg.color}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-semibold text-sm">Level {r.requested_level} — {CERTIFICATION_LEVELS[r.requested_level]?.name}</span>
                      <span className="ml-3 rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium border border-current/20">{cfg.label}</span>
                    </div>
                    <span className="text-xs opacity-70">{formatDate(r.created_at)}</span>
                  </div>
                  {r.admin_notes && (
                    <div className="mt-2 text-sm opacity-90">
                      <span className="font-medium">Admin: </span>{r.admin_notes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Max level */}
      {certLevel === 3 && (
        <div className="card p-6 text-center">
          <p className="text-2xl mb-2">★</p>
          <p className="font-bold text-ink-900">Production Partner — Maximum Level</p>
          <p className="text-sm text-warm-500 mt-1">You have achieved the highest PrintMarket certification.</p>
        </div>
      )}

      {/* Next level requirements */}
      {nextLevel && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-ink-900">
              Path to Level {nextLevel} — {CERTIFICATION_LEVELS[nextLevel].name}
            </h2>
            <button
              onClick={() => setOpenLevel(openLevel === nextLevel ? null : nextLevel)}
              className="text-xs text-ink-600 hover:text-ink-900 font-medium"
            >
              {openLevel === nextLevel ? 'Hide requirements' : 'View requirements'}
            </button>
          </div>

          {openLevel === nextLevel && benchmarks && (
            <div className="card p-5 space-y-5">
              <p className="text-sm text-warm-500">{benchmarks.extras.map((e, i) => (
                <span key={i} className="block mb-1">• {e}</span>
              ))}</p>

              <div className="space-y-4">
                {benchmarks.parts.map((part, i) => (
                  <div key={i} className="rounded-xl border border-warm-200 p-4">
                    <div className="flex items-start gap-3">
                      <span className="h-6 w-6 rounded-full bg-ink-900 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-ink-900 text-sm">{part.name}</p>
                        <p className="text-xs text-warm-500 mt-0.5 mb-2">{part.purpose}</p>
                        <ul className="space-y-1">
                          {part.criteria.map((c, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-warm-600">
                              <span className="text-gold-500 flex-shrink-0 mt-0.5">✓</span>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Apply form */}
      {nextLevel && !hasPending && (
        <section>
          <div className="mb-3">
            <h2 className="text-base font-bold text-ink-900">Apply for Level {nextLevel}</h2>
            <p className="text-xs text-warm-500 mt-0.5">
              Print the benchmark parts above, photograph them, and submit. Our team reviews within 3–5 business days.
            </p>
          </div>

          {success && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 mb-4 text-sm text-emerald-800">
              ✓ Request submitted! We'll review your benchmark photos and respond within 3–5 business days.
            </div>
          )}

          <form onSubmit={handleSubmit} className="card p-6 space-y-5">
            {/* Photo grid */}
            <div>
              <p className="form-label mb-2">Benchmark Photos * <span className="text-warm-400 font-normal">(1–8 photos)</span></p>
              <div className="grid grid-cols-4 gap-2">
                {photoUrls.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt={`Photo ${i + 1}`}
                      className="w-full h-20 object-cover rounded-xl border border-warm-200" />
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-ink-900 text-white text-xs flex items-center justify-center hover:bg-red-600">
                      ×
                    </button>
                  </div>
                ))}
                {photos.length < 8 && (
                  <button type="button" onClick={() => photoRef.current?.click()}
                    className="h-20 rounded-xl border-2 border-dashed border-warm-300 text-warm-400 hover:border-gold-400 hover:text-gold-500 transition-colors flex items-center justify-center text-2xl">
                    +
                  </button>
                )}
              </div>
              <input ref={photoRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp"
                onChange={handlePhotoChange} className="hidden" />
              <p className="text-xs text-warm-400 mt-1.5">
                Include all benchmark test prints. Add a ruler or coin for scale. Clear, well-lit photos.
              </p>
            </div>

            <div>
              <p className="form-label mb-1.5">Notes (optional)</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-warm-300 bg-warm-50 px-3 py-2 text-sm focus:border-ink-500 focus:outline-none focus:ring-2 focus:ring-ink-500/20 resize-none"
                placeholder="Tell us about your setup — material brand, slicer settings, any special considerations…"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
            )}

            <Button type="submit" loading={submitting} variant="gold" size="lg" className="w-full">
              Submit for Level {nextLevel} Review
            </Button>
          </form>
        </section>
      )}

      {nextLevel && hasPending && !success && (
        <div className="card p-6 text-center bg-amber-50 border border-amber-200">
          <p className="text-2xl mb-2">⏳</p>
          <p className="font-semibold text-amber-900">Review in progress</p>
          <p className="text-sm text-amber-700 mt-1">
            Your Level {nextLevel} application is being reviewed. We'll update you within 3–5 business days.
          </p>
        </div>
      )}
    </div>
  )
}
