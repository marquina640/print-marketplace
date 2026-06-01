'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PRINTER_BRANDS, ALL_PRINTER_BRAND_NAMES, MANUFACTURING_PROCESSES } from '@/lib/utils'

interface Machine {
  id: string
  brand: string
  model: string
  process: string
  build_volume_x: number | null
  build_volume_y: number | null
  build_volume_z: number | null
  nozzle_diameters: number[]
  is_active: boolean
  notes: string | null
  photo_url: string | null
}

const NOZZLE_SIZES = [0.2, 0.4, 0.6, 0.8, 1.0]

const EMPTY_FORM = {
  brand: '',
  model: '',
  process: 'fdm',
  build_volume_x: '',
  build_volume_y: '',
  build_volume_z: '',
  nozzle_diameters: [] as number[],
  notes: '',
  photo_url: null as string | null,
}

export function MachinesForm({ effectiveUserId }: { effectiveUserId: string }) {
  const photoFileRef = useRef<HTMLInputElement>(null)
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const modelOptions = selectedBrand ? (PRINTER_BRANDS[selectedBrand] ?? []) : []
  const availableProcesses = MANUFACTURING_PROCESSES.filter((p) => p.available)

  useEffect(() => { loadMachines() }, [effectiveUserId])

  async function loadMachines() {
    const supabase = createClient()
    const { data } = await supabase
      .from('machines').select('*').eq('maker_id', effectiveUserId).order('created_at', { ascending: false })
    setMachines(data ?? [])
    setLoading(false)
  }

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleNozzle(size: number) {
    setForm((prev) => ({
      ...prev,
      nozzle_diameters: prev.nozzle_diameters.includes(size)
        ? prev.nozzle_diameters.filter((n) => n !== size)
        : [...prev.nozzle_diameters, size].sort((a, b) => a - b),
    }))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Photo must be under 10 MB.'); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setSelectedBrand('')
    setPhotoFile(null)
    setPhotoPreview(null)
    setError(null)
    setShowForm(true)
  }

  function openEdit(m: Machine) {
    setEditingId(m.id)
    setSelectedBrand(m.brand)
    setForm({
      brand: m.brand,
      model: m.model,
      process: m.process,
      build_volume_x: m.build_volume_x?.toString() ?? '',
      build_volume_y: m.build_volume_y?.toString() ?? '',
      build_volume_z: m.build_volume_z?.toString() ?? '',
      nozzle_diameters: m.nozzle_diameters ?? [],
      notes: m.notes ?? '',
      photo_url: m.photo_url,
    })
    setPhotoFile(null)
    setPhotoPreview(m.photo_url)
    setError(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setSelectedBrand('')
    setPhotoFile(null)
    setPhotoPreview(null)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.brand) { setError('Select a brand.'); return }
    if (!form.model.trim()) { setError('Enter a model name.'); return }

    setSaving(true)
    const supabase = createClient()

    // Upload machine photo if provided
    let photoUrl = form.photo_url
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const machineKey = editingId ?? `new-${Date.now()}`
      const path = `machines/${effectiveUserId}/${machineKey}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('machine-photos').upload(path, photoFile, { upsert: true })
      if (uploadErr) { setError(`Photo upload failed: ${uploadErr.message}`); setSaving(false); return }
      const { data: { publicUrl } } = supabase.storage.from('machine-photos').getPublicUrl(path)
      photoUrl = publicUrl
    }

    const payload = {
      brand:           form.brand,
      model:           form.model.trim(),
      process:         form.process,
      build_volume_x:  form.build_volume_x ? parseFloat(form.build_volume_x) : null,
      build_volume_y:  form.build_volume_y ? parseFloat(form.build_volume_y) : null,
      build_volume_z:  form.build_volume_z ? parseFloat(form.build_volume_z) : null,
      nozzle_diameters: form.nozzle_diameters,
      notes:           form.notes.trim() || null,
      photo_url:       photoUrl,
    }

    if (editingId) {
      const { error: updateError } = await supabase
        .from('machines').update(payload).eq('id', editingId)
      if (updateError) { setError(updateError.message); setSaving(false); return }
    } else {
      const { error: insertError } = await supabase
        .from('machines').insert({ ...payload, maker_id: effectiveUserId })
      if (insertError) { setError(insertError.message); setSaving(false); return }
    }

    cancelForm()
    setSaving(false)
    await loadMachines()
  }

  async function toggleActive(machine: Machine) {
    const supabase = createClient()
    await supabase.from('machines').update({ is_active: !machine.is_active }).eq('id', machine.id)
    setMachines((prev) => prev.map((m) => m.id === machine.id ? { ...m, is_active: !m.is_active } : m))
  }

  async function deleteMachine(id: string) {
    if (!confirm('Remove this machine?')) return
    const supabase = createClient()
    await supabase.from('machines').delete().eq('id', id)
    setMachines((prev) => prev.filter((m) => m.id !== id))
    if (editingId === id) cancelForm()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin h-8 w-8 rounded-full border-4 border-ink-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-heading">My Machines</h1>
          <p className="text-warm-500 text-sm mt-1">
            List your equipment so customers know exactly what you can produce.
          </p>
        </div>
        {!showForm && (
          <Button variant="gold" onClick={openAdd}>+ Add machine</Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-5 border-2 border-gold-300">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">
              {editingId ? 'Edit machine' : 'Add a machine'}
            </h2>
            <button type="button" onClick={cancelForm} className="text-xs text-warm-400 hover:text-warm-700">
              Cancel
            </button>
          </div>

          <div>
            <p className="form-label mb-2">Brand *</p>
            <div className="flex flex-wrap gap-2">
              {ALL_PRINTER_BRAND_NAMES.map((brand) => (
                <button key={brand} type="button"
                  onClick={() => { setSelectedBrand(brand); set('brand', brand); set('model', '') }}
                  className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-all ${
                    selectedBrand === brand
                      ? 'bg-ink-900 text-white border-ink-900'
                      : 'bg-white text-warm-700 border-warm-300 hover:border-ink-400'}`}>
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {selectedBrand && modelOptions.length > 0 ? (
            <div>
              <p className="form-label mb-2">Model *</p>
              <div className="flex flex-wrap gap-2">
                {modelOptions.map((m) => (
                  <button key={m} type="button"
                    onClick={() => set('model', m)}
                    className={`rounded-xl border px-3 py-1.5 text-sm transition-all ${
                      form.model === m
                        ? 'bg-gold-500 text-white border-gold-500'
                        : 'bg-white text-warm-600 border-warm-300 hover:border-gold-400'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          ) : selectedBrand && (
            <Input label="Model *" required value={form.model}
              onChange={(e) => set('model', e.target.value)} placeholder="Custom / enter model name" />
          )}

          <div>
            <p className="form-label mb-2">Process *</p>
            <div className="flex flex-wrap gap-2">
              {availableProcesses.map((p) => (
                <button key={p.value} type="button"
                  onClick={() => set('process', p.value)}
                  className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-all ${
                    form.process === p.value
                      ? 'bg-ink-900 text-white border-ink-900'
                      : 'bg-white text-warm-700 border-warm-300 hover:border-ink-400'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="form-label mb-2">Build Volume (mm)</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="X (Width)"  type="number" min="0" value={form.build_volume_x} onChange={(e) => set('build_volume_x', e.target.value)} placeholder="220" />
              <Input label="Y (Depth)"  type="number" min="0" value={form.build_volume_y} onChange={(e) => set('build_volume_y', e.target.value)} placeholder="220" />
              <Input label="Z (Height)" type="number" min="0" value={form.build_volume_z} onChange={(e) => set('build_volume_z', e.target.value)} placeholder="250" />
            </div>
          </div>

          <div>
            <p className="form-label mb-2">Available nozzle sizes (mm)</p>
            <div className="flex gap-2">
              {NOZZLE_SIZES.map((size) => {
                const active = form.nozzle_diameters.includes(size)
                return (
                  <button key={size} type="button" onClick={() => toggleNozzle(size)}
                    className={`rounded-xl border px-4 py-2 text-sm font-mono font-semibold transition-all ${
                      active
                        ? 'bg-ink-900 text-white border-ink-900'
                        : 'bg-white text-warm-700 border-warm-300 hover:border-ink-400'}`}>
                    {size}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-warm-400 mt-1.5">Select all sizes you have available for this printer</p>
          </div>

          {/* Machine photo - required for verification */}
          <div>
            <p className="form-label mb-1">
              Machine photo <span className="text-red-500">*</span>
              <span className="ml-1 font-normal text-warm-400 text-xs">Hold a paper with your name next to the machine</span>
            </p>
            <div onClick={() => photoFileRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors overflow-hidden
                ${photoPreview ? 'border-ink-300' : 'border-warm-300 hover:border-ink-400'}`}>
              {photoPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Machine" className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Click to change</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-8 w-8 text-warm-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-warm-500">Upload a photo of your machine</p>
                  <p className="text-xs text-warm-400 mt-1">PNG, JPG, WEBP - max 10 MB</p>
                </div>
              )}
              <input ref={photoFileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </div>
          </div>

          <Input label="Notes (optional)" value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="e.g. Enclosed, heated chamber, dual extruder…" />

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={saving} variant="gold">
              {editingId ? 'Save changes' : 'Save machine'}
            </Button>
            <Button type="button" variant="outline" onClick={cancelForm}>Cancel</Button>
          </div>
        </form>
      )}

      {machines.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🖨️</p>
          <p className="font-semibold text-warm-900 mb-1">No machines yet</p>
          <p className="text-sm text-warm-500">Add your printers so customers can see your capabilities.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {machines.map((m) => (
            <div key={m.id} className={`card overflow-hidden transition-all ${m.is_active ? '' : 'opacity-60'} ${editingId === m.id ? 'border-2 border-gold-300' : ''}`}>
              {m.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.photo_url} alt={`${m.brand} ${m.model}`} className="w-full h-32 object-cover" />
              )}
              <div className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-ink-900">{m.brand} {m.model}</h3>
                    <span className="rounded-full bg-ink-100 text-ink-700 border border-ink-200 px-2 py-0.5 text-xs font-medium">
                      {MANUFACTURING_PROCESSES.find((p) => p.value === m.process)?.label ?? m.process}
                    </span>
                    {!m.is_active && (
                      <span className="rounded-full bg-warm-100 text-warm-500 border border-warm-200 px-2 py-0.5 text-xs">Inactive</span>
                    )}
                    {editingId === m.id && (
                      <span className="rounded-full bg-gold-100 text-gold-700 border border-gold-300 px-2 py-0.5 text-xs font-medium">Editing…</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-warm-500">
                    {m.build_volume_x && m.build_volume_y && m.build_volume_z && (
                      <span>📦 {m.build_volume_x}×{m.build_volume_y}×{m.build_volume_z} mm</span>
                    )}
                    {m.nozzle_diameters?.length > 0 && (
                      <span>⌀ {m.nozzle_diameters.join(', ')} mm nozzle{m.nozzle_diameters.length > 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {m.notes && <p className="mt-1.5 text-xs text-warm-400">{m.notes}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(m)}
                    className="rounded-xl border border-ink-200 px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-50 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => toggleActive(m)}
                    className="rounded-xl border border-warm-300 px-3 py-1.5 text-xs text-warm-600 hover:bg-warm-100 transition-colors">
                    {m.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => deleteMachine(m.id)}
                    className="rounded-xl border border-red-200 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors">
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
