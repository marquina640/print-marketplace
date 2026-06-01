'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  // Block deletion if they have active jobs as a client (paid / shipped)
  const { data: activeClientJobs } = await admin
    .from('jobs')
    .select('id')
    .eq('client_id', user.id)
    .in('status', ['paid', 'shipped'])

  if ((activeClientJobs?.length ?? 0) > 0) {
    return { error: 'You have active jobs in progress. Please wait until they are completed before deleting your account.' }
  }

  // Block deletion if they are the accepted maker on an active job
  const { data: activeMakerQuotes } = await admin
    .from('quotes')
    .select('job_id, jobs!inner(status)')
    .eq('printer_id', user.id)
    .eq('status', 'accepted')
    .in('jobs.status', ['paid', 'shipped'])

  if ((activeMakerQuotes?.length ?? 0) > 0) {
    return { error: 'You have active jobs in progress as a maker. Please wait until they are completed before deleting your account.' }
  }

  // Delete the Supabase auth user - cascades to profiles via DB foreign key
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }

  return {}
}
