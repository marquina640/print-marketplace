'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createUserProfile } from '@/app/actions/create-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CreateUserForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'client' as 'client' | 'printer_owner',
    display_name: '',
    city: 'Zurich',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!form.email.trim()) { setError('Email is required.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!form.display_name.trim()) { setError('Display name is required.'); return }

    startTransition(async () => {
      const result = await createUserProfile({
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        display_name: form.display_name.trim(),
        city: form.city.trim() || 'Zurich',
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`✓ ${form.role === 'client' ? 'Customer' : 'Maker'} "${form.display_name}" created successfully`)
        setForm({ email: '', password: '', role: 'client', display_name: '', city: 'Zurich' })
        router.refresh()
      }
    })
  }

  return (
    <div className="rounded-2xl border border-warm-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
        <div>
          <h2 className="font-semibold text-ink-900">Create User Profile</h2>
          <p className="text-xs text-warm-400 mt-0.5">Create a customer or maker account directly — no email confirmation required</p>
        </div>
        <Button variant="gold" size="sm" onClick={() => { setOpen((v) => !v); setError(null); setSuccess(null) }}>
          {open ? 'Cancel' : '+ Create User'}
        </Button>
      </div>

      {success && !open && (
        <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-100 text-sm text-emerald-700 font-medium">
          {success}
        </div>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Role selector */}
          <div>
            <p className="form-label mb-2">Account type</p>
            <div className="flex gap-3">
              {[
                { value: 'client', label: '👤 Customer', desc: 'Posts requests and hires makers' },
                { value: 'printer_owner', label: '🖨 Maker', desc: 'Takes jobs and prints parts' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('role', opt.value)}
                  className={`flex-1 text-left rounded-xl border-2 p-4 transition-all ${
                    form.role === opt.value
                      ? 'border-ink-700 bg-ink-50'
                      : 'border-warm-200 hover:border-warm-400'
                  }`}
                >
                  <p className="font-semibold text-ink-900 text-sm">{opt.label}</p>
                  <p className="text-xs text-warm-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Display name *"
              required
              value={form.display_name}
              onChange={(e) => set('display_name', e.target.value)}
              placeholder={form.role === 'client' ? 'e.g. Marc Müller' : 'e.g. Zurich Maker Studio'}
            />
            {form.role === 'printer_owner' && (
              <Input
                label="City"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="e.g. Zurich"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email address *"
              type="email"
              required
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="user@example.com"
            />
            <Input
              label="Password *"
              type="password"
              required
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="Min. 8 characters"
              hint="Share this with the user so they can log in"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          {success && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">{success}</div>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={pending} variant="gold">
              Create {form.role === 'client' ? 'Customer' : 'Maker'} Account
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
