'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AddressAutocomplete, type AddressResult } from '@/components/ui/address-autocomplete'

interface ClientProfileFormProps {
  effectiveUserId: string
}

export function ClientProfileForm({ effectiveUserId }: ClientProfileFormProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    location: '',
    city: '',
    lat: null as number | null,
    lng: null as number | null,
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: profile }, { data: makerProfile }] = await Promise.all([
        supabase.from('profiles').select('display_name, city, address, bio, latitude, longitude').eq('user_id', effectiveUserId).single(),
        supabase.from('printer_profiles').select('city, location, latitude, longitude').eq('user_id', effectiveUserId).single(),
      ])

      if (profile) {
        // Fall back to maker profile address if client profile has none
        const city    = profile.city     ?? makerProfile?.city     ?? ''
        const address = profile.address  ?? makerProfile?.location ?? ''
        const lat     = profile.latitude ?? makerProfile?.latitude ?? null
        const lng     = profile.longitude ?? makerProfile?.longitude ?? null
        const savedLocation = address ? `${address}${city ? ', ' + city : ''}` : city
        setForm({
          display_name: profile.display_name ?? '',
          bio: profile.bio ?? '',
          location: savedLocation,
          city,
          lat,
          lng,
        })
      }
      setLoading(false)
    }
    load()
  }, [effectiveUserId])

  function handleAddressSelect(result: AddressResult) {
    setForm((prev) => ({
      ...prev,
      location: result.address,
      city: result.city ?? result.address.split(',')[0],
      lat: result.lat,
      lng: result.lng,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.display_name.trim()) { setError('Display name is required.'); return }

    setSaving(true)
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: form.display_name.trim(),
        city: form.city || null,
        address: form.location || null,
        bio: form.bio.trim() || null,
        latitude: form.lat,
        longitude: form.lng,
      })
      .eq('user_id', effectiveUserId)

    if (updateError) { setError(updateError.message); setSaving(false); return }

    // Sync location to maker profile if one exists
    if (form.city || form.lat) {
      await supabase.from('printer_profiles').update({
        city: form.city || null,
        location: form.location || null,
        latitude: form.lat,
        longitude: form.lng,
      }).eq('user_id', effectiveUserId)
    }

    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin h-8 w-8 rounded-full border-4 border-ink-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-7">
        <h1 className="section-heading">My Profile</h1>
        <p className="text-warm-500 text-sm mt-1">Update your name and location so makers know where to deliver.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Your Identity</h2>
          <Input
            label="Display name *"
            required
            value={form.display_name}
            onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
            placeholder="Jane Doe"
          />
          <Textarea
            label="Bio (optional)"
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            rows={3}
            placeholder="Tell makers a little about yourself or your project…"
          />
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Your Location</h2>
          <AddressAutocomplete
            label="Your area / address"
            placeholder="Start typing your city or address…"
            defaultValue={form.location}
            onSelect={handleAddressSelect}
            hint="Only your general area is shown publicly — exact address stays private"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}
        {saved && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
            Profile saved successfully.
          </div>
        )}

        <Button type="submit" loading={saving} className="w-full" size="lg" variant="gold">
          Save Profile
        </Button>
      </form>
    </div>
  )
}
