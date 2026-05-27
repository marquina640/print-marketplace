import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientProfileForm } from './profile-form'

interface PageProps {
  searchParams: Promise<{ incomplete?: string }>
}

export default async function ClientProfilePage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const cookieStore = await cookies()
  const previewUserId = profile?.role === 'admin'
    ? cookieStore.get('admin_preview_user_id')?.value
    : undefined

  const effectiveUserId = previewUserId ?? user.id
  const { incomplete } = await searchParams

  return (
    <>
      {incomplete && (
        <div className="max-w-xl mx-auto mb-4 rounded-xl bg-amber-50 border border-amber-300 px-4 py-3 text-sm text-amber-800 font-medium">
          Please fill in your name and location before posting a request.
        </div>
      )}
      <ClientProfileForm effectiveUserId={effectiveUserId} />
    </>
  )
}
