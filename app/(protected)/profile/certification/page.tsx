import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CertificationForm } from './certification-form'

export default async function CertificationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()

  const cookieStore = await cookies()
  const previewUserId = profile?.role === 'admin'
    ? cookieStore.get('admin_preview_user_id')?.value
    : undefined

  const effectiveUserId = previewUserId ?? user.id

  return <CertificationForm effectiveUserId={effectiveUserId} />
}
