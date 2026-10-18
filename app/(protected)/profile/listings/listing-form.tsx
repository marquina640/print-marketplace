'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const CATEGORIES = [
  'Functional parts', 'Home & living', 'Toys & games', 'Art & decor',
  'Electronics', 'Cosplay & props', 'Tools & fixtures', 'Jewelry', 'Other',
]

interface Listing {
  id: string
  title: string
  description: string | null
  price: number
  currency: string
  photos: string[]
  category: string | null
  shipping_available: boolean
  shipping_price: number
  pickup_available: boolean
  local_delivery_available: boolean
  status: string
}

interface Props {
  effectiveUserId: string
  listing?: Listing
  onSaved: () => void
  onCancel: () => void
}

export function ListingForm({ effectiveUserId, listing, onSaved, onCancel }: Props) {
  const isEdit = !!listing
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [photos, setPhotos]   = useState<string[]>(listing?.photos ?? [])
  const [newFiles, setNewFiles] = useState<{ file: File; preview: string }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title:                    listing?.title ?? '',
    description:              listing?.description ?? '',
    price:                    listing?.price?.toString() ?? '',
    currency:                 listing?.currency ?? 'CHF',
    category:                 listing?.category ?? '',
    shipping_available:       listing?.shipping_available ?? false,
    shipping_price:           listing?.shipping_price?.toString() ?? '0',
    pickup_available:         listing?.pickup_available ?? false,
    local_delivery_available: listing?.local_delivery_available ?? false,
  })

  function set(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const valid = files.filter(f => f.size <= 20 * 1024 * 1024)
    const combined = [...newFiles, ...valid.map(file => ({ file, preview: URL.createObjectURL(file) }))]
    if (combined.length + photos.length > 8) {
      setError('Maximum 8 photos per listing.')
      return
    }
    setNewFiles(combined)
    e.target.value = ''
  }

  function removeExistingPhoto(url: string) {
    setPhotos(prev => prev.filter(p => p !== url))
  }

  function removeNewFile(idx: number) {
    setNewFiles(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.title.trim()) { setError('Title is required.'); return }
    const price = parseFloat(form.price)
    if (isNaN(price) || price <= 0) { setError('Enter a valid price.'); return }
    if (!form.shipping_available && !form.pickup_available && !form.local_delivery_available) {
      setError('Select at least one delivery option.'); return
    }
    if (photos.length + newFiles.length === 0) { setError('Add at least one photo.'); return }

    setSaving(true)
    const supabase = createClient()

    // Upload new photos
    const uploadedUrls: string[] = []
    for (const { file } of newFiles) {
      const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${effectiveUserId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('listing-photos')
        .upload(path, file, { contentType: file.type })
      if (uploadErr) { setError(`Photo upload failed: ${uploadErr.message}`); setSaving(false); return }
      const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl(path)
      uploadedUrls.push(publicUrl)
    }

    const allPhotos = [...photos, ...uploadedUrls]

    const payload = {
      maker_id:                 effectiveUserId,
      title:                    form.title.trim(),
      description:              form.description.trim() || null,
      price,
      currency:                 form.currency,
      photos:                   allPhotos,
      category:                 form.category || null,
      shipping_available:       form.shipping_available,
      shipping_price:           form.shipping_available ? parseFloat(form.shipping_price) || 0 : 0,
      pickup_available:         form.pickup_available,
      local_delivery_available: form.local_delivery_available,
    }

    if (isEdit) {
      const { error: updateErr } = await supabase.from('listings').update(payload).eq('id', listing.id)
      if (updateErr) { setError(updateErr.message); setSaving(false); return }
    } else {
      const { error: insertErr } = await supabase.from('listings').insert(payload)
      if (insertErr) { setError(insertErr.message); setSaving(false); return }
    }

    setSaving(false)
    onSaved()
  }

  const totalPhotos = photos.length + newFiles.length

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-base font-bold text-ink-900">{isEdit ? 'Edit listing' : 'New listing'}</h2>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-warm-800 mb-1.5">
          Photos <span className="text-red-500">*</span>
          <span className="ml-1 text-xs font-normal text-warm-400">({totalPhotos}/8)</span>
        </label>
        {totalPhotos > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-2">
            {photos.map((url, i) => (
              <div key={`ex-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-warm-200">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeExistingPhoto(url)}
                  className="absolute top-1 right-1 rounded-full bg-black/60 text-white h-5 w-5 flex items-center justify-center text-xs hover:bg-red-600">×</button>
              </div>
            ))}
            {newFiles.map(({ preview }, i) => (
              <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-warm-200">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeNewFile(i)}
                  className="absolute top-1 right-1 rounded-full bg-black/60 text-white h-5 w-5 flex items-center justify-center text-xs hover:bg-red-600">×</button>
              </div>
            ))}
          </div>
        )}
        {totalPhotos < 8 && (
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-warm-300 rounded-xl p-4 text-center cursor-pointer hover:border-ink-400 hover:bg-warm-50 transition-colors">
            <p className="text-sm text-warm-600 font-medium">Click to add photos</p>
            <p className="text-xs text-warm-400 mt-0.5">JPG, PNG, WEBP (max 20 MB each)</p>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </div>
        )}
      </div>

      <Input label="Title *" value={form.title} onChange={e => set('title', e.target.value)}
        placeholder="e.g. Custom cable clip for desk setup" maxLength={120} />

      <Textarea label="Description" value={form.description}
        onChange={e => set('description', e.target.value)}
        rows={3} placeholder="Describe your print: material, size, use case…" />

      {/* Price */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-warm-800 mb-1">Price *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 text-sm">{form.currency}</span>
            <input
              type="number" step="0.01" min="0.01" value={form.price}
              onChange={e => set('price', e.target.value)}
              className="w-full rounded-xl border border-warm-300 bg-white pl-12 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-400"
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-800 mb-1">Currency</label>
          <select value={form.currency} onChange={e => set('currency', e.target.value)}
            className="w-full rounded-xl border border-warm-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-400">
            <option value="CHF">CHF</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-warm-800 mb-1">Category</label>
        <select value={form.category} onChange={e => set('category', e.target.value)}
          className="w-full rounded-xl border border-warm-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-400">
          <option value="">Select a category</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Delivery options */}
      <div>
        <p className="text-sm font-medium text-warm-800 mb-2">Delivery options <span className="text-red-500">*</span></p>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.shipping_available}
              onChange={e => set('shipping_available', e.target.checked)}
              className="rounded border-warm-300 text-ink-600" />
            <span className="text-sm text-warm-800">Shipping</span>
          </label>
          {form.shipping_available && (
            <div className="ml-7">
              <label className="block text-xs font-medium text-warm-700 mb-1">Shipping price ({form.currency})</label>
              <input type="number" step="0.01" min="0" value={form.shipping_price}
                onChange={e => set('shipping_price', e.target.value)}
                className="w-32 rounded-xl border border-warm-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-400"
                placeholder="0.00" />
              <p className="text-xs text-warm-400 mt-0.5">Set 0 for free shipping</p>
            </div>
          )}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.pickup_available}
              onChange={e => set('pickup_available', e.target.checked)}
              className="rounded border-warm-300 text-ink-600" />
            <span className="text-sm text-warm-800">Pickup</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.local_delivery_available}
              onChange={e => set('local_delivery_available', e.target.checked)}
              className="rounded border-warm-300 text-ink-600" />
            <span className="text-sm text-warm-800">Local delivery</span>
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" variant="gold" className="flex-1" loading={saving}>
          {isEdit ? 'Save changes' : 'Publish listing'}
        </Button>
      </div>
    </form>
  )
}
