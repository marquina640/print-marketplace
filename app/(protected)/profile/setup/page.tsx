'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MATERIALS, COLORS, DEFAULT_CITY, DEFAULT_LOCATION, geocodeAddress } from '@/lib/utils'

function MultiCheckbox({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void
}) {
  return (
    <div>
      <p className="form-label">{label}</p>
      <div className="flex flex-wrap gap-2 mt-1">
        {options.map((opt) => {
          const active = selected.includes(opt)
          return (
            <button key={opt} type="button" onClick={() => onChange(
              active ? selected.filter((v) => v !== opt) : [...selected, opt]
            )}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${active
                ? 'bg-ink-800 text-white border-ink-800'
                : 'bg-white text-warm-600 border-warm-300 hover:border-ink-400'}`}>
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-ink-700' : 'bg-warm-300'}`}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm text-warm-700">{label}</span>
    </label>
  )
}

export default function ProfileSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    display_name: '',
    city: DEFAULT_CITY,
    location: DEFAULT_LOCATION,
    materials: [] as string[],
    colors: [] as string[],
    design_services: false,
    shipping: false,
    local_delivery: false,
    pickup: true,
    hourly_rate: '',
    price_per_gram: '',
    description: '',
  })

  useEffect(() => {
    async function loadExisting() {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('printer_profiles').select('*').eq('user_id', user.id).single()

      if (data) {
        setForm({
          display_name: data.display_name,
          city: data.city,
          location: data.location ?? DEFAULT_LOCATION,
          materials: data.materials,
          colors: data.colors,
          design_services: data.design_services,
          shipping: data.shipping,
          local_delivery: data.local_delivery,
          pickup: data.pickup,
          hourly_rate: data.hourly_rate?.toString() ?? '',
          price_per_gram: data.price_per_gram?.toString() ?? '',
          description: data.description ?? '',
        })
      }
      setLoading(false)
    }
    loadExisting()
  }, [])

  function set(field: string, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.display_name.trim()) { setError('Display name is required.'); return }
    if (!form.city.trim()) { setError('City is required.'); return }
    if (form.materials.length === 0) { setError('Select at least one material.'); return }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Geocode location
    const locationStr = `${form.city}, Switzerland`
    const geo = await geocodeAddress(locationStr)

    const payload = {
      user_id: user.id,
      display_name: form.display_name.trim(),
      city: form.city.trim(),
      location: form.location.trim() || null,
      materials: form.materials,
      colors: form.colors,
      design_services: form.design_services,
      shipping: form.shipping,
      local_delivery: form.local_delivery,
      pickup: form.pickup,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      price_per_gram: form.price_per_gram ? parseFloat(form.price_per_gram) : null,
      description: form.description.trim() || null,
      latitude: geo?.lat ?? null,
      longitude: geo?.lng ?? null,
    }

    const { error: upsertError } = await supabase
      .from('printer_profiles').upsert(payload, { onConflict: 'user_id' })

    if (upsertError) { setError(upsertError.message); setSaving(false); return }

    await supabase.from('profiles')
      .update({ onboarding_complete: true, display_name: form.display_name.trim() })
      .eq('user_id', user.id)

    router.push('/dashboard/printer')
    router.refresh()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin h-8 w-8 rounded-full border-4 border-ink-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-7">
        <h1 className="section-heading">Set Up Your Printer Profile</h1>
        <p className="text-warm-500 text-sm mt-1">Help clients in Zurich and beyond find you.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Identity */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-warm-900">Your Identity</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Display name *" required value={form.display_name}
              onChange={(e) => set('display_name', e.target.value)} placeholder="Zurich Maker Studio" />
            <Input label="City *" required value={form.city}
              onChange={(e) => set('city', e.target.value)} placeholder={DEFAULT_CITY} />
          </div>
          <Input label="Full address / area" value={form.location}
            onChange={(e) => set('location', e.target.value)} placeholder={DEFAULT_LOCATION}
            hint="Used for the map — only your general area is shown publicly" />
        </div>

        {/* Materials & Colors */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-warm-900">Materials & Colors</h2>
          <MultiCheckbox label="Materials supported *" options={MATERIALS}
            selected={form.materials} onChange={(v) => set('materials', v)} />
          <MultiCheckbox label="Colors available" options={COLORS}
            selected={form.colors} onChange={(v) => set('colors', v)} />
        </div>

        {/* Services */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-warm-900">Services Offered</h2>
          <div className="grid grid-cols-2 gap-3">
            <Toggle label="Design / Engineering" checked={form.design_services} onChange={(v) => set('design_services', v)} />
            <Toggle label="Shipping" checked={form.shipping} onChange={(v) => set('shipping', v)} />
            <Toggle label="Local Delivery" checked={form.local_delivery} onChange={(v) => set('local_delivery', v)} />
            <Toggle label="Pickup" checked={form.pickup} onChange={(v) => set('pickup', v)} />
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-warm-900">Pricing (optional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Hourly rate (CHF/hr)" type="number" min="0" step="0.01"
              value={form.hourly_rate} onChange={(e) => set('hourly_rate', e.target.value)}
              placeholder="45.00" hint="Design / setup labor" />
            <Input label="Price per gram (CHF/g)" type="number" min="0" step="0.0001"
              value={form.price_per_gram} onChange={(e) => set('price_per_gram', e.target.value)}
              placeholder="0.09" hint="Material + machine estimate" />
          </div>
        </div>

        {/* Bio */}
        <div className="card p-6">
          <Textarea label="About your service" value={form.description}
            onChange={(e) => set('description', e.target.value)} rows={4}
            placeholder="Describe your setup, turnaround, specialties, and what makes you stand out…" />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}

        <Button type="submit" loading={saving} className="w-full" size="lg" variant="gold">
          Save Profile & Go to Dashboard
        </Button>
      </form>
    </div>
  )
}
