'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function setAdminPreview(role: 'client' | 'printer_owner' | null, userId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') return

  const cookieStore = await cookies()
  if (role) {
    cookieStore.set('admin_preview_as', role, { path: '/', maxAge: 3600, httpOnly: true })
    if (userId) {
      cookieStore.set('admin_preview_user_id', userId, { path: '/', maxAge: 3600, httpOnly: true })
    } else {
      cookieStore.delete('admin_preview_user_id')
    }
    redirect(role === 'client' ? '/dashboard/client' : '/dashboard/printer')
  } else {
    cookieStore.delete('admin_preview_as')
    cookieStore.delete('admin_preview_user_id')
    redirect('/dashboard/admin')
  }
}
