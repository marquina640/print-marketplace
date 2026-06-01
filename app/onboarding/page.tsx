'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Layers, Cpu, CheckCircle2, Box } from 'lucide-react'

type Role = 'client' | 'printer_owner'

const ROLE_REDIRECT: Record<string, string> = {
  admin:         '/dashboard/admin',
  client:        '/dashboard/client',
  printer_owner: '/profile/setup',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkExistingRole() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setChecking(false); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('user_id', user.id).single()

      if (profile?.role) {
        router.replace(ROLE_REDIRECT[profile.role] ?? '/dashboard')
        return
      }
      setChecking(false)
    }
    checkExistingRole()
  }, [router])

  if (checking) return null

  async function handleContinue() {
    if (!selectedRole) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Never overwrite an existing role (e.g. admin)
    const { data: existing } = await supabase
      .from('profiles').select('role').eq('user_id', user.id).single()

    if (existing?.role && existing.role !== selectedRole) {
      // Already has a role - just redirect to their dashboard
      const map: Record<string, string> = {
        admin: '/dashboard/admin',
        client: '/dashboard/client',
        printer_owner: '/profile/setup',
      }
      router.push(map[existing.role] ?? '/dashboard')
      return
    }

    // Only update if role is currently NULL - never overwrite an existing role
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        role: selectedRole,
        onboarding_complete: selectedRole === 'client',
      })
      .eq('user_id', user.id)
      .is('role', null)

    if (dbError) {
      setError(dbError.message)
      setLoading(false)
      return
    }

    if (selectedRole === 'client') {
      router.push('/dashboard/client')
    } else {
      router.push('/profile/setup')
    }
  }

  const roles: { id: Role; title: string; description: string; Icon: React.ComponentType<{ className?: string }>; accent: string; features: string[] }[] = [
    {
      id: 'client',
      title: 'I need something printed',
      description: 'Post requests, receive quotes from skilled makers, and track your orders.',
      Icon: Layers,
      accent: 'indigo',
      features: ['Post unlimited requests', 'Receive competitive quotes', 'Direct messaging', 'File uploads (STL, STEP, 3MF)'],
    },
    {
      id: 'printer_owner',
      title: 'I own a 3D printer',
      description: 'List your services, browse open requests, and submit quotes to grow your business.',
      Icon: Cpu,
      accent: 'violet',
      features: ['Browse open requests', 'Submit unlimited quotes', 'Customer messaging', 'Profile & portfolio'],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 font-bold text-indigo-600 text-xl mb-5">
            <Box className="h-6 w-6" />
            PrintMarketHub
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">How will you use PrintMarketHub?</h1>
          <p className="text-gray-500">Both are available to you - just pick where you want to start. You can always access the other side later.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {roles.map(({ id, title, description, Icon, features }) => {
            const isSelected = selectedRole === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedRole(id)}
                className={`text-left rounded-2xl border-2 p-6 transition-all duration-150 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100'
                    : 'border-gray-200 bg-white hover:border-indigo-200 hover:shadow-md'
                }`}
              >
                {/* Icon badge */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                  isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>

                <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
                <p className="text-sm text-gray-500 mb-4">{description}</p>

                <ul className="space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-indigo-500' : 'text-gray-400'}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Selected
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          onClick={handleContinue}
          loading={loading}
          disabled={!selectedRole}
          className="w-full"
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
