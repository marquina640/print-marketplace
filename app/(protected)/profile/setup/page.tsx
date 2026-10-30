import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ProfileSetupForm } from './setup-form'

export default async function ProfileSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  const cookieStore = await cookies()
  const previewUserId = profile?.role === 'admin' ? cookieStore.get('admin_preview_user_id')?.value : undefined
  const effectiveUserId = previewUserId ?? user.id

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-ink-600 border-t-transparent" />
      </div>
    }>
      <ProfileSetupForm effectiveUserId={effectiveUserId} isPreview={!!previewUserId} />
    </Suspense>
  )
}
