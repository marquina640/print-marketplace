'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { notifyClientOfNewQuote } from '@/app/actions/submit-quote'

interface QuoteFormProps {
  jobId: string
  printerId?: string
  shippingRequired?: boolean
  existingQuote?: {
    id: string
    price: number
    lead_time_days: number
    message: string | null
    image_url: string | null
  } | null
}

export function QuoteForm({ jobId, printerId: printerIdProp, shippingRequired, existingQuote }: QuoteFormProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [price, setPrice] = useState(existingQuote?.price?.toString() ?? '')
  const [leadTime, setLeadTime] = useState(existingQuote?.lead_time_days?.toString() ?? '')
  const [message, setMessage] = useState(existingQuote?.message ?? '')
  const [justification, setJustification] = useState((existingQuote as any)?.price_justification ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(existingQuote?.image_url ?? null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB.'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!imageFile && !existingQuote?.image_url) {
      setError('Please upload a photo of the model or your print preview.')
      return
    }
    if (!price || parseFloat(price) <= 0) {
      setError('Please enter a valid price.')
      return
    }
    if (!leadTime || parseInt(leadTime) < 1) {
      setError('Please enter a valid lead time.')
      return
    }
    if (!message.trim()) {
      setError('Please add a message describing your approach, materials, and timeline.')
      return
    }
    if (!justification.trim()) {
      setError('Please explain why you quoted this price.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in.'); setLoading(false); return }

    const effectivePrinterId = printerIdProp ?? user.id

    // Prevent quoting your own job
    const { data: jobCheck } = await supabase.from('jobs').select('client_id').eq('id', jobId).single()
    if (jobCheck?.client_id === effectivePrinterId) {
      setError('You cannot quote your own request.')
      setLoading(false)
      return
    }

    let image_url = existingQuote?.image_url ?? null

    // Upload new image if provided
    if (imageFile) {
      const path = `quotes/${jobId}/${user.id}-${Date.now()}.${imageFile.name.split('.').pop()}`
      const { error: uploadErr } = await supabase.storage
        .from('quote-images')
        .upload(path, imageFile, { upsert: true })

      if (uploadErr) {
        setError(`Image upload failed: ${uploadErr.message}`)
        setLoading(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('quote-images').getPublicUrl(path)
      image_url = publicUrl
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const payload = {
      job_id: jobId,
      printer_id: effectivePrinterId,
      price: parseFloat(price),
      lead_time_days: parseInt(leadTime),
      message: message.trim() || null,
      price_justification: justification.trim() || null,
      image_url,
      expires_at: expiresAt,
    }

    const { error: dbError } = await supabase
      .from('quotes')
      .upsert({ ...payload }, { onConflict: 'job_id,printer_id' })

    if (dbError) { setError(dbError.message) }
    else {
      if (!existingQuote) {
        await notifyClientOfNewQuote(jobId, parseFloat(price))
      }
      setSuccess(true)
      router.refresh()
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
        Quote {existingQuote ? 'updated' : 'submitted'} - the client will be notified.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-warm-900">
        {existingQuote ? 'Update your quote' : 'Submit a quote'}
      </h3>

      {/* Model image - required */}
      <div>
        <p className="form-label">
          Model photo <span className="text-red-500">*</span>
          <span className="ml-1 font-normal text-warm-400">(required)</span>
        </p>
        <div
          onClick={() => fileRef.current?.click()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors overflow-hidden
            ${imagePreview ? 'border-ink-300' : 'border-warm-300 hover:border-ink-400'}`}
        >
          {imagePreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Model preview"
                className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium">Click to change</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <svg className="mx-auto h-8 w-8 text-warm-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-warm-500">Upload a photo of the model or your slicer preview</p>
              <p className="text-xs text-warm-400 mt-1">PNG, JPG, WEBP - max 10 MB</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </div>
      </div>

      {shippingRequired && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="text-lg flex-shrink-0">📦</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Include shipping in your price</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              This client requires shipping. Add the estimated shipping cost to your total price - there is no separate shipping field.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={shippingRequired ? 'Your price incl. shipping (CHF)' : 'Your price (CHF)'}
          type="number" min="0" step="0.01" required
          value={price} onChange={(e) => setPrice(e.target.value)} placeholder="49.00"
        />
        <Input label="Lead time (days)" type="number" min="1" required
          value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder="7" />
      </div>

      <Textarea label="Message to client *" value={message}
        onChange={(e) => setMessage(e.target.value)} rows={3}
        placeholder="Describe your approach, materials, timeline, and any questions…" />

      <Textarea label="Why did you quote this price? *" value={justification}
        onChange={(e) => setJustification(e.target.value)} rows={2}
        placeholder="e.g. Material cost, print time, post-processing…" />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}

      <Button type="submit" loading={loading} variant="gold" className="w-full">
        {existingQuote ? 'Update Quote' : 'Submit Quote'}
      </Button>
    </form>
  )
}
