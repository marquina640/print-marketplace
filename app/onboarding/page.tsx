'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

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
      // Already has a role — just redirect to their dashboard
      const map: Record<string, string> = {
        admin: '/dashboard/admin',
        client: '/dashboard/client',
        printer_owner: '/profile/setup',
      }
      router.push(map[existing.role] ?? '/dashboard')
      return
    }

    // Only update if role is currently NULL — never overwrite an existing role
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

  const roles: { id: Role; title: string; description: string; icon: string; features: string[] }[] = [
    {
      id: 'client',
      title: 'I need something printed',
      description: "Post jobs, receive quotes from skilled printer owners, and track your orders.",
      icon: '📐',
      features: ['Post unlimited jobs', 'Receive competitive quotes', 'Direct messaging', 'File uploads (STL, STEP, 3MF)'],
    },
    {
      id: 'printer_owner',
      title: 'I own a 3D printer',
      description: 'List your services, browse open jobs, and submit quotes to grow your business.',
      icon: '🖨️',
      features: ['Browse open jobs', 'Submit unlimited quotes', 'Client messaging', 'Profile & portfolio'],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-bold text-indigo-600 text-xl mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            PrintMarket
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">How will you use PrintMarket?</h1>
          <p className="text-gray-500">Choose your role. You can always contact support to change it.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id)}
              className={`text-left rounded-2xl border-2 p-6 transition-all ${
                selectedRole === role.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-indigo-200 hover:shadow-sm'
              }`}
            >
              <div className="text-4xl mb-3">{role.icon}</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{role.title}</h2>
              <p className="text-sm text-gray-500 mb-4">{role.description}</p>
              <ul className="space-y-1">
                {role.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="h-4 w-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {selectedRole === role.id && (
                <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Selected
                </div>
              )}
            </button>
          ))}
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
