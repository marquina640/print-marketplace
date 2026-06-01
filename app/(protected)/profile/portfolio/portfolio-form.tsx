'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { MATERIALS, MANUFACTURING_PROCESSES, JOB_TYPES } from '@/lib/utils'
import { JobTypeBadge } from '@/components/ui/badge'

interface PortfolioItem {
  id: string
  title: string
  description: string | null
  image_url: string
  material: string | null
  process: string
  job_type: string
  is_featured: boolean
  created_at: string
}

export function PortfolioForm({ effectiveUserId }: { effectiveUserId: string }) {
  const [items, setItems]         = useState<PortfolioItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview]     = useState<string | null>(null)
  const imageRef                  = useRef<HTMLInputElement>(null)

  const [form, setFormState] = useState({
    title: '',
    description: '',
    material: '',
    process: 'fdm',
    job_type: 'functional',
    is_featured: false,
  })

  useEffect(() => { loadItems() }, [effectiveUserId])

  async function loadItems() {
    const supabase = createClient()
    const { data } = await supabase
      .from('portfolio_items').select('*').eq('maker_id', effectiveUserId)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }

  function set(field: string, value: string | boolean) {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!imageFile) { setError('Upload a photo of the work.'); return }

    setSaving(true)
    const supabase = createClient()

    const path = `portfolio/${effectiveUserId}/${Date.now()}-${imageFile.name}`
    const { error: uploadError } = await supabase.storage
      .from('job-files').upload(path, imageFile, { contentType: imageFile.type })

    if (uploadError) { setError(uploadError.message); setSaving(false); return }

    const { data: { publicUrl } } = supabase.storage.from('job-files').getPublicUrl(path)

    const { error: insertError } = await supabase.from('portfolio_items').insert({
      maker_id:    effectiveUserId,
      title:       form.title.trim(),
      description: form.description.trim() || null,
      image_url:   publicUrl,
      material:    form.material || null,
      process:     form.process,
      job_type:    form.job_type,
      is_featured: form.is_featured,
    })

    if (insertError) { setError(insertError.message); setSaving(false); return }

    setFormState({ title: '', description: '', material: '', process: 'fdm', job_type: 'functional', is_featured: false })
    setImageFile(null)
    setPreview(null)
    setShowForm(false)
    setSaving(false)
    await loadItems()
  }

  async function toggleFeatured(item: PortfolioItem) {
    const supabase = createClient()
    await supabase.from('portfolio_items').update({ is_featured: !item.is_featured }).eq('id', item.id)
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_featured: !i.is_featured } : i))
  }

  async function deleteItem(id: string) {
    if (!confirm('Remove this portfolio item?')) return
    const supabase = createClient()
    await supabase.from('portfolio_items').delete().eq('id', id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const availableProcesses = MANUFACTURING_PROCESSES.filter((p) => p.available)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin h-8 w-8 rounded-full border-4 border-ink-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-heading">Portfolio</h1>
          <p className="text-warm-500 text-sm mt-1">
            Show clients what you can make. Photos of real work build trust faster than anything else.
          </p>
        </div>
        <Button variant="gold" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add work'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4 border-2 border-gold-300">
          <h2 className="font-semibold text-ink-900">Add portfolio item</h2>

          {preview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="w-full max-h-56 object-cover rounded-xl border border-warm-200" />
              <button type="button" onClick={() => { setImageFile(null); setPreview(null) }}
                className="absolute top-2 right-2 rounded-full bg-ink-900/80 text-white h-7 w-7 flex items-center justify-center text-sm hover:bg-red-600 transition-colors">
                ×
              </button>
            </div>
          ) : (
            <div onClick={() => imageRef.current?.click()}
              className="border-2 border-dashed border-warm-300 rounded-xl p-8 text-center cursor-pointer hover:border-gold-400 hover:bg-gold-50/30 transition-colors">
              <p className="text-sm text-warm-500 font-medium">Click to upload a photo of your work</p>
              <p className="text-xs text-warm-400 mt-1">JPG · PNG · WEBP - max 10 MB</p>
            </div>
          )}
          <input ref={imageRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageChange} className="hidden" />

          <Input label="Title *" required value={form.title}
            onChange={(e) => set('title', e.target.value)} placeholder="e.g. Robotics bracket - PETG, ±0.15mm" />

          <Textarea label="Description" value={form.description}
            onChange={(e) => set('description', e.target.value)} rows={2}
            placeholder="Materials used, challenges, tolerances achieved…" />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Material"
              options={MATERIALS.map((m) => ({ value: m, label: m }))}
              placeholder="Select material"
              value={form.material}
              onChange={(e) => set('material', e.target.value)} />
            <Select label="Job type"
              options={JOB_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              value={form.job_type}
              onChange={(e) => set('job_type', e.target.value)} />
          </div>

          <div>
            <p className="form-label mb-2">Process</p>
            <div className="flex flex-wrap gap-2">
              {availableProcesses.map((p) => (
                <button key={p.value} type="button" onClick={() => set('process', p.value)}
                  className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-all ${
                    form.process === p.value
                      ? 'bg-ink-900 text-white border-ink-900'
                      : 'bg-white text-warm-700 border-warm-300 hover:border-ink-400'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_featured}
              onChange={(e) => set('is_featured', e.target.checked)}
              className="h-4 w-4 rounded border-warm-300 text-gold-500 focus:ring-gold-400" />
            <span className="text-sm text-warm-700">Feature this on my profile (shown first)</span>
          </label>

          {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

          <Button type="submit" loading={saving} variant="gold">Upload</Button>
        </form>
      )}

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📷</p>
          <p className="font-semibold text-warm-900 mb-1">No portfolio items yet</p>
          <p className="text-sm text-warm-500">Upload photos of your best work to attract clients.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className="card overflow-hidden group">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />
                {item.is_featured && (
                  <span className="absolute top-2 left-2 rounded-full bg-gold-500 text-white px-2 py-0.5 text-xs font-bold">
                    ★ Featured
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="font-semibold text-ink-900 text-sm leading-snug">{item.title}</p>
                  <JobTypeBadge type={item.job_type} />
                </div>
                {item.description && <p className="text-xs text-warm-500 line-clamp-2 mb-2">{item.description}</p>}
                {item.material && <p className="text-xs text-warm-400">{item.material}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => toggleFeatured(item)}
                    className="rounded-xl border border-warm-300 px-3 py-1 text-xs text-warm-600 hover:bg-warm-100 transition-colors">
                    {item.is_featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button onClick={() => deleteItem(item.id)}
                    className="rounded-xl border border-red-200 px-3 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
