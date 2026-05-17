'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function completeJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: job } = await supabase
    .from('jobs').select('client_id, status').eq('id', jobId).single()

  if (!job) throw new Error('Job not found')
  if (job.client_id !== user.id) throw new Error('Only the client can mark a job complete')
  if (!['accepted', 'in_progress'].includes(job.status)) throw new Error('Job is not in progress')

  const { error } = await supabase
    .from('jobs').update({ status: 'completed' }).eq('id', jobId)

  if (error) throw new Error(error.message)

  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/dashboard/client')
}
