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

  const clientId = previewUserId ?? user.id

  // Load the customer's saved location so the form can use it without asking again
  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('address, city, latitude, longitude')
    .eq('user_id', clientId)
    .single()

  const clientLocation = {
    address: clientProfile?.address ?? clientProfile?.city ?? '',
    lat: clientProfile?.latitude ?? null,
    lng: clientProfile?.longitude ?? null,
  }

  return <NewJobForm clientId={clientId} clientLocation={clientLocation} />
}
