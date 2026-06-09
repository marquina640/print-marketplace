'use client'

import { useState, useRef, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { confirmJobDelivery } from '@/app/actions/payments'
import { createClient } from '@/lib/supabase/client'

export function ConfirmReceiptButton({ jobId }: { jobId: string }) {
  const [open, setOpen]              = useState(false)
  const [photos, setPhotos]          = useState<File[]>([])
  const [photoPreviews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading]    = useState(false)
  const [error, setError]            = useState<string | null>(null)
  const [pending, startTransition]   = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const valid = selected.filter((f) => f.size <= 20 * 1024 * 1024)
    if (valid.length !== selected.length) setError('Some photos exceeded 20 MB and were skipped.')
    setPhotos((prev) => [...prev, ...valid])
    setPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))])
    e.target.value = ''
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, j) => j !== i))
    setPreviews((prev) => prev.filter((_, j) => j !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (photos.length === 0) {
      setError('Please upload at least one photo of your received order.')
      return
    }

    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in.'); setUploading(false); return }

    // Upload delivery photos
    for (const photo of photos) {
      const ext = photo.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `delivery-photos/${jobId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('job-files')
        .upload(path, photo, { contentType: photo.type })
      if (uploadErr) { setError(`Photo upload failed: ${uploadErr.message}`); setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('job-files').getPublicUrl(path)
      await supabase.from('job_files').insert({
        job_id:      jobId,
        uploaded_by: user.id,
        file_name:   'Delivery photo',
        file_url:    publicUrl,
        file_size:   0,
        file_type:   'delivery_photo',
      })
    }

    setUploading(false)

    startTransition(async () => {
      try {
        await confirmJobDelivery(jobId)
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
        Confirm Receipt
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isLoading && setOpen(false)} />

          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-warm-900 mb-1">Confirm you received your order</h2>
            <p className="text-sm text-warm-500 mb-5">
              Upload a photo of what arrived. This protects both you and the maker if any dispute arises.
              The maker gets paid once you confirm.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-warm-800 mb-1.5">
                  Photo of received order <span className="text-red-500">*</span>
                  <span className="ml-1 font-normal text-warm-400 text-xs">(required)</span>
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
                          ×
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
                    {photoPreviews.length === 0 ? 'Click to upload a photo' : 'Add more photos'}
                  </p>
                  <p className="text-xs text-warm-400 mt-0.5">JPG, PNG, WEBP — max 20 MB each</p>
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

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setOpen(false); setError(null) }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gold" className="flex-1" loading={isLoading}>
                  {uploading ? 'Uploading...' : 'Confirm & Release Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
