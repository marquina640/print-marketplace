import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileSetupForm } from './setup-form'

export default async function ProfileSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Always edit the logged-in user's own profile, never the admin preview target
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-ink-600 border-t-transparent" />
      </div>
    }>
      <ProfileSetupForm effectiveUserId={user.id} />
    </Suspense>
  )
}
