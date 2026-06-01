'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MATERIALS, COLORS } from '@/lib/utils'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'

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

export function ProfileSetupForm({ effectiveUserId }: { effectiveUserId: string }) {
  const router = useRouter()
  const avatarFileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [form, setFormState] = useState({
    display_name: '',
    city: '',
    location: '',
    materials: [] as string[],
    colors: [] as string[],
    design_services: false,
    shipping: false,
    local_delivery: false,
    pickup: true,
    hourly_rate: '',
    description: '',
    lat: null as number | null,
    lng: null as number | null,
  })

  useEffect(() => {
    async function loadExisting() {
      setLoading(true)
      const supabase = createClient()
      const [{ data }, { data: clientProfile }] = await Promise.all([
        supabase.from('printer_profiles').select('*').eq('user_id', effectiveUserId).single(),
        supabase.from('profiles').select('display_name, city, address, latitude, longitude, avatar_url').eq('user_id', effectiveUserId).single(),
      ])

      if (clientProfile?.avatar_url) setAvatarPreview(clientProfile.avatar_url)

      if (data) {
        setFormState({
          display_name: data.display_name,
          city: data.city,
          location: data.location ?? '',
          materials: data.materials,
          colors: data.colors,
          design_services: data.design_services,
          shipping: data.shipping,
          local_delivery: data.local_delivery,
          pickup: data.pickup,
          hourly_rate: data.hourly_rate?.toString() ?? '',
          description: data.description ?? '',
          lat: data.latitude ?? null,
          lng: data.longitude ?? null,
        })
      } else if (clientProfile) {
        // Pre-fill from client profile if no maker profile yet
        setFormState((prev) => ({
          ...prev,
          display_name: clientProfile.display_name ?? '',
          city: clientProfile.city ?? '',
          location: clientProfile.address ?? '',
          lat: clientProfile.latitude ?? null,
          lng: clientProfile.longitude ?? null,
        }))
      }
      setLoading(false)
    }
    loadExisting()
  }, [effectiveUserId])

  function set(field: string, value: string | boolean | string[]) {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5 MB.'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.display_name.trim()) { setError('Display name is required.'); return }
    if (!form.city.trim()) { setError('City is required.'); return }
    if (form.materials.length === 0) { setError('Select at least one material.'); return }

    setSaving(true)
    const supabase = createClient()

    // Upload avatar if a new file was chosen
    let newAvatarUrl: string | undefined
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `avatars/${effectiveUserId}-${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      if (uploadErr) { setError(`Avatar upload failed: ${uploadErr.message}`); setSaving(false); return }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      newAvatarUrl = publicUrl
    }

    if (newAvatarUrl) {
      await supabase.from('profiles').update({ avatar_url: newAvatarUrl }).eq('user_id', effectiveUserId)
    }

    const payload = {
      user_id: effectiveUserId,
      display_name: form.display_name.trim(),
      city: form.city.trim(),
      location: form.location.trim() || null,
      materials: form.materials,
      colors: form.colors,
      design_services: form.design_services,
      shipping: form.shipping,
      local_delivery: form.local_delivery,
      pickup: form.pickup,
      hourly_rate: form.design_services && form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      description: form.description.trim() || null,
      latitude: form.lat,
      longitude: form.lng,
    }

    const { error: upsertError } = await supabase
      .from('printer_profiles').upsert(payload, { onConflict: 'user_id' })

    if (upsertError) { setError(upsertError.message); setSaving(false); return }

    // Sync location and display name back to shared profiles table
    await supabase.from('profiles')
      .update({
        onboarding_complete: true,
        display_name: form.display_name.trim(),
        city: form.city.trim() || null,
        address: form.location.trim() || null,
        latitude: form.lat,
        longitude: form.lng,
      })
      .eq('user_id', effectiveUserId)

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
        <h1 className="section-heading">My Profile</h1>
        <p className="text-warm-500 text-sm mt-1">Help clients in Zurich and beyond find you.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-warm-900">Your Identity</h2>

          {/* Avatar / profile picture */}
          <div>
            <p className="form-label mb-2">Profile picture</p>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => avatarFileRef.current?.click()}
                className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-dashed border-warm-300 hover:border-ink-400 transition-colors flex-shrink-0 bg-warm-50">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl text-warm-300 flex items-center justify-center h-full">+</span>
                )}
              </button>
              <div className="text-sm text-warm-500">
                <p>Upload a photo of yourself or your workspace.</p>
                <p className="text-xs text-warm-400 mt-0.5">JPG, PNG, WEBP - max 5 MB</p>
              </div>
              <input ref={avatarFileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
          </div>

          <Input label="Display name *" required value={form.display_name}
            onChange={(e) => set('display_name', e.target.value)} placeholder="Zurich Maker Studio" />
          <AddressAutocomplete
            label="Your location / area *"
            placeholder="Start typing your address or city…"
            hint="Only your general area is shown publicly - exact address stays private"
            defaultValue={form.location}
            onSelect={({ address, lat, lng, city }) => {
              setFormState((prev) => ({
                ...prev,
                location: address,
                city: city ?? prev.city,
                lat,
                lng,
              }))
            }}
          />
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-warm-900">Materials & Colors</h2>
          <MultiCheckbox label="Materials supported *" options={MATERIALS.filter((m) => m !== 'Suggest the best one')}
            selected={form.materials} onChange={(v) => set('materials', v)} />
          <MultiCheckbox label="Colors available" options={COLORS.filter((c) => c !== 'Multicolour')}
            selected={form.colors} onChange={(v) => set('colors', v)} />
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-warm-900">Services Offered</h2>
          <div className="grid grid-cols-2 gap-3">
            <Toggle label="Design / Engineering" checked={form.design_services} onChange={(v) => set('design_services', v)} />
            <Toggle label="Shipping" checked={form.shipping} onChange={(v) => set('shipping', v)} />
            <Toggle label="Local Delivery" checked={form.local_delivery} onChange={(v) => set('local_delivery', v)} />
            <Toggle label="Pickup" checked={form.pickup} onChange={(v) => set('pickup', v)} />
          </div>
        </div>

        {form.design_services && (
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-warm-900">Design / Engineering Pricing (optional)</h2>
            <Input label="Hourly rate (CHF/hr)" type="number" min="0" step="0.01"
              value={form.hourly_rate} onChange={(e) => set('hourly_rate', e.target.value)}
              placeholder="45.00" hint="Design and engineering labor rate" />
          </div>
        )}

        <div className="card p-6">
          <Textarea label="About your service" value={form.description}
            onChange={(e) => set('description', e.target.value)} rows={4}
            placeholder="Describe your setup, turnaround, specialties, and what makes you stand out…" />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}

        <Button type="submit" loading={saving} className="w-full" size="lg" variant="gold">
          Save Profile
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-warm-200 text-center">
        <a href="/profile/delete-account" className="text-xs text-warm-400 hover:text-red-500 transition-colors underline underline-offset-2">
          Delete my account
        </a>
      </div>
    </div>
  )
}
