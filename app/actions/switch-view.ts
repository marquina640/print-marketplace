'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function switchToClient() {
  const cookieStore = await cookies()
  cookieStore.set('view_mode', 'client', { path: '/', maxAge: 86400 * 30 })
  redirect('/dashboard/client')
}

export async function switchToMaker() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: makerProfile } = await supabase
    .from('printer_profiles').select('user_id').eq('user_id', user.id).single()

  const cookieStore = await cookies()
  cookieStore.set('view_mode', 'maker', { path: '/', maxAge: 86400 * 30 })

  if (!makerProfile) {
    redirect('/profile/setup')
  } else {
    redirect('/dashboard/printer')
  }
}
