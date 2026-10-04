'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function relistJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not authorized')

  const admin = createAdminClient()
  const { error } = await admin
    .from('jobs')
    .update({ status: 'open', created_at: new Date().toISOString() })
    .eq('id', jobId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/jobs')
}
