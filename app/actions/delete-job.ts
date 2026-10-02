'use server'

import { revalidatePath } from 'next/cache'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function deleteJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not authorised')

  const admin = createAdminClient()

  const { error } = await admin.from('jobs').delete().eq('id', jobId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/admin/jobs')
}
