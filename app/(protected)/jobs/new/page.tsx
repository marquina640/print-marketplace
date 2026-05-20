import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { NewJobForm } from './job-form'

export const metadata = { title: 'Post a Request' }

export default async function NewJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()

  const cookieStore = await cookies()
  const previewUserId = profile?.role === 'admin'
    ? cookieStore.get('admin_preview_user_id')?.value
    : undefined

  // Use the previewed client's ID if admin is previewing, otherwise use real user ID
  const clientId = previewUserId ?? user.id

  return <NewJobForm clientId={clientId} />
}
