'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function setMakerCertification(makerId: string, level: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()

  if (profile?.role !== 'admin') throw new Error('Not authorized')

  if (level < 0 || level > 3) throw new Error('Invalid certification level')

  const { error } = await supabase
    .from('printer_profiles')
    .update({ certification_level: level })
    .eq('user_id', makerId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/admin')
}
