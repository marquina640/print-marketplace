'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_CITY, geocodeAddress } from '@/lib/utils'

export default function ClientProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    display_name: '',
    city: DEFAULT_CITY,
    address: '',
    bio: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, city, address, bio')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setForm({
          display_name: profile.display_name ?? '',
          city: profile.city ?? DEFAULT_CITY,
          address: profile.address ?? '',
          bio: profile.bio ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.display_name.trim()) { setError('Display name is required.'); return }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Geocode address for map visibility
    const locationStr = form.address.trim()
      ? `${form.address.trim()}, ${form.city.trim()}, Switzerland`
      : `${form.city.trim()}, Switzerland`
    const geo = await geocodeAddress(locationStr)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: form.display_name.trim(),
        city: form.city.trim() || null,
        address: form.address.trim() || null,
        bio: form.bio.trim() || null,
        latitude: geo?.lat ?? null,
        longitude: geo?.lng ?? null,
      })
      .eq('user_id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
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
        <p className="text-warm-500 text-sm mt-1">Update your name and address so makers know where to deliver.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Your Identity</h2>
          <Input
            label="Display name *"
            required
            value={form.display_name}
            onChange={(e) => set('display_name', e.target.value)}
            placeholder="Jane Doe"
          />
          <Textarea
            label="Bio (optional)"
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            rows={3}
            placeholder="Tell makers a little about yourself or your project…"
          />
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Your Location</h2>
          <p className="text-xs text-warm-400">
            Your address is used to show your jobs on the map and help nearby makers find you. Only your general area is shown publicly.
          </p>
          <Input
            label="City"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Zürich"
          />
          <Input
            label="Street address (optional)"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="e.g. Bahnhofstrasse 12"
            hint="Only used to pin your job to the map — not shown to other users"
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
