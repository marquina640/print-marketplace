'use client'

import { useState, useEffect } from 'react'
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
  nozzle_diameter: number | null
  min_layer_height: number | null
  max_layer_height: number | null
  tolerance_mm: number | null
  is_active: boolean
  notes: string | null
}

const EMPTY_FORM = {
  brand: '',
  model: '',
  process: 'fdm',
  build_volume_x: '',
  build_volume_y: '',
  build_volume_z: '',
  nozzle_diameter: '',
  min_layer_height: '',
  max_layer_height: '',
  tolerance_mm: '',
  notes: '',
}

export function MachinesForm({ effectiveUserId }: { effectiveUserId: string }) {
  const [machines, setMachines]   = useState<Machine[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [form, setForm]           = useState(EMPTY_FORM)

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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.brand) { setError('Select a brand.'); return }
    if (!form.model.trim()) { setError('Enter a model name.'); return }

    setSaving(true)
    const supabase = createClient()

    const { error: insertError } = await supabase.from('machines').insert({
      maker_id:         effectiveUserId,
      brand:            form.brand,
      model:            form.model.trim(),
      process:          form.process,
      build_volume_x:   form.build_volume_x  ? parseFloat(form.build_volume_x)  : null,
      build_volume_y:   form.build_volume_y  ? parseFloat(form.build_volume_y)  : null,
      build_volume_z:   form.build_volume_z  ? parseFloat(form.build_volume_z)  : null,
      nozzle_diameter:  form.nozzle_diameter ? parseFloat(form.nozzle_diameter) : null,
      min_layer_height: form.min_layer_height ? parseFloat(form.min_layer_height) : null,
      max_layer_height: form.max_layer_height ? parseFloat(form.max_layer_height) : null,
      tolerance_mm:     form.tolerance_mm    ? parseFloat(form.tolerance_mm)    : null,
      notes:            form.notes.trim() || null,
    })

    if (insertError) { setError(insertError.message); setSaving(false); return }

    setForm(EMPTY_FORM)
    setSelectedBrand('')
    setShowForm(false)
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
            List your equipment so clients know exactly what you can produce.
          </p>
        </div>
        <Button variant="gold" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add machine'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card p-6 space-y-5 border-2 border-gold-300">
          <h2 className="font-semibold text-ink-900">Add a machine</h2>

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
              <Input label="X (Width)"  type="number" min="0" value={form.build_volume_x}  onChange={(e) => set('build_volume_x', e.target.value)}  placeholder="220" />
              <Input label="Y (Depth)"  type="number" min="0" value={form.build_volume_y}  onChange={(e) => set('build_volume_y', e.target.value)}  placeholder="220" />
              <Input label="Z (Height)" type="number" min="0" value={form.build_volume_z}  onChange={(e) => set('build_volume_z', e.target.value)}  placeholder="250" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Nozzle diameter (mm)" type="number" step="0.01" min="0"
              value={form.nozzle_diameter} onChange={(e) => set('nozzle_diameter', e.target.value)}
              placeholder="0.4" hint="e.g. 0.4" />
            <Input label="Tolerance ±(mm)" type="number" step="0.01" min="0"
              value={form.tolerance_mm} onChange={(e) => set('tolerance_mm', e.target.value)}
              placeholder="0.2" hint="Best achievable" />
            <Input label="Min layer height (mm)" type="number" step="0.001" min="0"
              value={form.min_layer_height} onChange={(e) => set('min_layer_height', e.target.value)}
              placeholder="0.05" />
            <Input label="Max layer height (mm)" type="number" step="0.001" min="0"
              value={form.max_layer_height} onChange={(e) => set('max_layer_height', e.target.value)}
              placeholder="0.3" />
          </div>

          <Input label="Notes (optional)" value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="e.g. Enclosed, heated chamber, dual extruder…" />

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          <Button type="submit" loading={saving} variant="gold">Save machine</Button>
        </form>
      )}

      {machines.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🖨️</p>
          <p className="font-semibold text-warm-900 mb-1">No machines yet</p>
          <p className="text-sm text-warm-500">Add your printers so clients can see your capabilities.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {machines.map((m) => (
            <div key={m.id} className={`card p-5 ${m.is_active ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-ink-900">{m.brand} {m.model}</h3>
                    <span className="rounded-full bg-ink-100 text-ink-700 border border-ink-200 px-2 py-0.5 text-xs font-medium">
                      {MANUFACTURING_PROCESSES.find((p) => p.value === m.process)?.label ?? m.process}
                    </span>
                    {!m.is_active && (
                      <span className="rounded-full bg-warm-100 text-warm-500 border border-warm-200 px-2 py-0.5 text-xs">Inactive</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-warm-500">
                    {m.build_volume_x && m.build_volume_y && m.build_volume_z && (
                      <span>📦 {m.build_volume_x}×{m.build_volume_y}×{m.build_volume_z} mm</span>
                    )}
                    {m.nozzle_diameter && <span>⌀ {m.nozzle_diameter} mm nozzle</span>}
                    {m.tolerance_mm && <span>±{m.tolerance_mm} mm tolerance</span>}
                    {m.min_layer_height && m.max_layer_height && (
                      <span>Layer: {m.min_layer_height}–{m.max_layer_height} mm</span>
                    )}
                  </div>
                  {m.notes && <p className="mt-1.5 text-xs text-warm-400">{m.notes}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
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
