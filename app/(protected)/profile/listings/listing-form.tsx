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

type PhotoItem =
  | { type: 'existing'; url: string }
  | { type: 'new'; file: File; preview: string }

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
  variation_type: string | null
  variation_options: string[]
}

interface Props {
  effectiveUserId: string
  listing?: Listing
  onSaved: () => void
  onCancel: () => void
}

export function ListingForm({ effectiveUserId, listing, onSaved, onCancel }: Props) {
  const isEdit = !!listing
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [photoItems, setPhotoItems] = useState<PhotoItem[]>(
    (listing?.photos ?? []).map(url => ({ type: 'existing', url }))
  )
  const dragIdx = useRef<number | null>(null)

  const [variationType, setVariationType]     = useState<string>(listing?.variation_type ?? '')
  const [variationOptions, setVariationOptions] = useState<string>(
    (listing?.variation_options ?? []).join(', ')
  )

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
    const toAdd: PhotoItem[] = valid.map(file => ({ type: 'new', file, preview: URL.createObjectURL(file) }))
    if (photoItems.length + toAdd.length > 8) {
      setError('Maximum 8 photos per listing.')
      return
    }
    setPhotoItems(prev => [...prev, ...toAdd])
    e.target.value = ''
  }

  function removePhoto(idx: number) {
    setPhotoItems(prev => prev.filter((_, i) => i !== idx))
  }

  function movePhoto(from: number, to: number) {
    if (to < 0 || to >= photoItems.length) return
    setPhotoItems(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  function onDragStart(idx: number) {
    dragIdx.current = idx
  }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragIdx.current === null || dragIdx.current === idx) return
    movePhoto(dragIdx.current, idx)
    dragIdx.current = idx
  }

  function onDragEnd() {
    dragIdx.current = null
  }

  async function save(status: string) {
    setError(null)

    if (!form.title.trim()) { setError('Title is required.'); return }
    const price = parseFloat(form.price)
    if (isNaN(price) || price <= 0) { setError('Enter a valid price.'); return }

    if (status === 'active') {
      if (!form.shipping_available && !form.pickup_available && !form.local_delivery_available) {
        setError('Select at least one delivery option.'); return
      }
      if (photoItems.length === 0) { setError('Add at least one photo.'); return }
    }

    setSaving(true)
    const supabase = createClient()

    // Upload any new photos (in order)
    const allPhotos: string[] = []
    for (const item of photoItems) {
      if (item.type === 'existing') {
        allPhotos.push(item.url)
      } else {
        const ext  = item.file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `${effectiveUserId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('listing-photos')
          .upload(path, item.file, { contentType: item.file.type })
        if (uploadErr) { setError(`Photo upload failed: ${uploadErr.message}`); setSaving(false); return }
        const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl(path)
        allPhotos.push(publicUrl)
      }
    }

    const parsedOptions = variationOptions
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const payload: Record<string, unknown> = {
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
      variation_type:           variationType || null,
      variation_options:        variationType ? parsedOptions : [],
      status,
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

  return (
    <form onSubmit={e => { e.preventDefault(); save('active') }} className="space-y-5">
      <h2 className="text-base font-bold text-ink-900">{isEdit ? 'Edit listing' : 'New listing'}</h2>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-warm-800 mb-1.5">
          Photos <span className="text-red-500">*</span>
          <span className="ml-1 text-xs font-normal text-warm-400">({photoItems.length}/8 — drag to reorder)</span>
        </label>
        {photoItems.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-2">
            {photoItems.map((item, i) => {
              const src = item.type === 'existing' ? item.url : item.preview
              return (
                <div
                  key={i}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={e => onDragOver(e, i)}
                  onDragEnd={onDragEnd}
                  className="relative aspect-square rounded-lg overflow-hidden border border-warm-200 cursor-grab active:cursor-grabbing select-none"
                >
                  <img src={src} alt="" className="w-full h-full object-cover pointer-events-none" />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded">Cover</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 rounded-full bg-black/60 text-white h-5 w-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >×</button>
                  {/* Arrow buttons for touch / non-drag */}
                  <div className="absolute bottom-1 right-1 flex gap-0.5">
                    {i > 0 && (
                      <button type="button" onClick={() => movePhoto(i, i - 1)}
                        className="rounded bg-black/60 text-white h-4 w-4 flex items-center justify-center text-[10px] hover:bg-ink-700">‹</button>
                    )}
                    {i < photoItems.length - 1 && (
                      <button type="button" onClick={() => movePhoto(i, i + 1)}
                        className="rounded bg-black/60 text-white h-4 w-4 flex items-center justify-center text-[10px] hover:bg-ink-700">›</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {photoItems.length < 8 && (
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

      {/* Variations (optional) */}
      <div>
        <p className="text-sm font-medium text-warm-800 mb-1">Variations <span className="text-xs font-normal text-warm-400">(optional)</span></p>
        <select
          value={variationType}
          onChange={e => { setVariationType(e.target.value); setVariationOptions('') }}
          className="w-full rounded-xl border border-warm-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-400 mb-2"
        >
          <option value="">No variations</option>
          <option value="size">Size</option>
          <option value="color">Color</option>
          <option value="material">Material</option>
        </select>
        {variationType && (
          <div>
            <label className="block text-xs font-medium text-warm-700 mb-1">
              Options <span className="text-warm-400">(comma-separated, e.g. Small, Medium, Large)</span>
            </label>
            <input
              type="text"
              value={variationOptions}
              onChange={e => setVariationOptions(e.target.value)}
              placeholder="e.g. Small, Medium, Large"
              className="w-full rounded-xl border border-warm-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-400"
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1 flex-wrap">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
          Cancel
        </Button>
        <Button type="button" variant="outline" loading={saving} onClick={() => save('draft')} className="flex-1">
          Save as draft
        </Button>
        <Button type="submit" variant="gold" loading={saving} className="flex-1">
          {isEdit ? 'Publish' : 'Publish listing'}
        </Button>
      </div>
    </form>
  )
}
