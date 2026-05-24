import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewJobForm } from './job-form'

export const metadata = { title: 'Post a Request' }

export default async function NewJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isGuest = !user

  let clientId = ''
  let clientLocation = { address: '', lat: null as number | null, lng: null as number | null }

  if (user) {
    const cookieStore = await cookies()
    const viewMode = cookieStore.get('view_mode')?.value

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('user_id', user.id).single()

    const effectiveRole = viewMode === 'client' ? 'client'
      : viewMode === 'maker' ? 'printer_owner'
      : profile?.role

    // Makers in maker mode cannot post requests, send them to their client dashboard
    if (effectiveRole === 'printer_owner') {
      redirect('/dashboard/client')
    }

    const previewUserId = profile?.role === 'admin'
      ? cookieStore.get('admin_preview_user_id')?.value
      : undefined

    clientId = previewUserId ?? user.id

    const { data: clientProfile } = await supabase
      .from('profiles').select('address, city, latitude, longitude')
      .eq('user_id', clientId).single()

    clientLocation = {
      address: clientProfile?.address ?? clientProfile?.city ?? '',
      lat: clientProfile?.latitude ?? null,
      lng: clientProfile?.longitude ?? null,
    }
  }

  return <NewJobForm clientId={clientId} clientLocation={clientLocation} isGuest={isGuest} />
}
