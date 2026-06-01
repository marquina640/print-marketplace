'use client'

import { useState, useRef, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { markJobShipped } from '@/app/actions/escrow'
import { createClient } from '@/lib/supabase/client'

const CARRIERS = [
  'Swiss Post',
  'DHL',
  'FedEx',
  'UPS',
  'DPD',
  'GLS',
  'TNT',
  'Other',
]

export function MarkShippedButton({ jobId }: { jobId: string }) {
  const [open, setOpen]             = useState(false)
  const [inPerson, setInPerson]     = useState(false)
  const [carrier, setCarrier]       = useState('')
  const [tracking, setTracking]     = useState('')
  const [shippedDate, setDate]      = useState(() => new Date().toISOString().slice(0, 10))
  const [photos, setPhotos]         = useState<File[]>([])
  const [photoPreviews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [pending, startTransition]  = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const valid = selected.filter((f) => f.size <= 20 * 1024 * 1024)
    if (valid.length !== selected.length) setError('Some photos exceeded 20 MB and were skipped.')
    setPhotos((prev) => [...prev, ...valid])
    setPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))])
    // reset input so the same file can be re-added
    e.target.value = ''
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, j) => j !== i))
    setPreviews((prev) => prev.filter((_, j) => j !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!inPerson && !carrier.trim()) { setError('Please select a shipping company.'); return }
    if (photos.length === 0) { setError('Please upload at least one photo of the finished part.'); return }

    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in.'); setUploading(false); return }

    // Upload photos to storage and record in job_files
    const uploadedUrls: string[] = []
    for (const photo of photos) {
      const ext = photo.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `shipping-photos/${jobId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('job-files')
        .upload(path, photo, { contentType: photo.type })
      if (uploadErr) { setError(`Photo upload failed: ${uploadErr.message}`); setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('job-files').getPublicUrl(path)
      uploadedUrls.push(publicUrl)
    }

    // Save photo references in job_files table
    for (const url of uploadedUrls) {
      await supabase.from('job_files').insert({
        job_id: jobId,
        uploaded_by: user.id,
        file_name: 'Pre-shipment photo',
        file_url: url,
        file_size: 0,
        file_type: 'pre_ship_photo',
      })
    }

    setUploading(false)

    startTransition(async () => {
      try {
        await markJobShipped(jobId, {
          inPerson,
          carrier: inPerson ? undefined : carrier,
          trackingNumber: inPerson ? undefined : tracking || undefined,
          shippedDate,
        })
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    })
  }

  const isLoading = uploading || pending

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="gold">
        Mark as Shipped
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isLoading && setOpen(false)} />

          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-warm-900 mb-1">Confirm Shipment</h2>
            <p className="text-sm text-warm-500 mb-5">Upload photos of the finished part before marking as shipped.</p>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Photos - required */}
              <div>
                <label className="block text-sm font-medium text-warm-800 mb-1.5">
                  Photos of the finished part <span className="text-red-500">*</span>
                  <span className="ml-1 font-normal text-warm-400 text-xs">(required for traceability)</span>
                </label>

                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {photoPreviews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-warm-200">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 rounded-full bg-black/60 text-white h-5 w-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-warm-300 rounded-xl p-4 text-center cursor-pointer hover:border-ink-400 hover:bg-warm-50 transition-colors"
                >
                  <p className="text-sm text-warm-600 font-medium">
                    {photoPreviews.length === 0 ? 'Click to upload photos' : 'Add more photos'}
                  </p>
                  <p className="text-xs text-warm-400 mt-0.5">JPG, PNG, WEBP - max 20 MB each</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Delivery method toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setInPerson(false)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${!inPerson ? 'border-ink-600 bg-ink-50 text-ink-900' : 'border-warm-200 text-warm-500 hover:border-warm-300'}`}>
                  📦 Shipped by carrier
                </button>
                <button type="button" onClick={() => setInPerson(true)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${inPerson ? 'border-ink-600 bg-ink-50 text-ink-900' : 'border-warm-200 text-warm-500 hover:border-warm-300'}`}>
                  🤝 Handed over in person
                </button>
              </div>

              {!inPerson && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-warm-800 mb-1.5">
                      Shipping company <span className="text-red-500">*</span>
                    </label>
                    <select value={carrier} onChange={e => setCarrier(e.target.value)}
                      className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-ink-400"
                      required={!inPerson}>
                      <option value="">Select carrier...</option>
                      {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-warm-800 mb-1.5">
                      Tracking number <span className="text-warm-400 font-normal">(optional)</span>
                    </label>
                    <input type="text" value={tracking} onChange={e => setTracking(e.target.value)}
                      placeholder="e.g. 99 00 123456 789"
                      className="w-full rounded-xl border border-warm-200 px-3 py-2.5 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-ink-400" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-warm-800 mb-1.5">
                  {inPerson ? 'Date of handover' : 'Date shipped'}
                </label>
                <input type="date" value={shippedDate} onChange={e => setDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-xl border border-warm-200 px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-ink-400"
                  required />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold" className="flex-1" loading={isLoading}>
                  {uploading ? 'Uploading...' : inPerson ? 'Confirm Handover' : 'Confirm Shipment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
