'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from './notifications'

async function getEffectiveUserId(user: { id: string }) {
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  const cookieStore = await cookies()
  const previewUserId = (profile as any)?.role === 'admin'
    ? cookieStore.get('admin_preview_user_id')?.value
    : undefined
  return previewUserId ?? user.id
}

export async function inviteMakerToJob(jobId: string, makerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const effectiveUserId = await getEffectiveUserId(user)
  const admin = createAdminClient()

  // Verify job belongs to this client and is open
  const { data: job } = await admin
    .from('jobs')
    .select('id, title, client_id, status')
    .eq('id', jobId)
    .single()

  if (!job || job.client_id !== effectiveUserId) return { error: 'Job not found' }
  if (job.status !== 'open')                     return { error: 'Job is no longer open' }

  // Upsert - silently succeeds if already invited
  const { error } = await admin
    .from('job_invitations')
    .upsert(
      { job_id: jobId, maker_id: makerId, client_id: effectiveUserId },
      { onConflict: 'job_id,maker_id' }
    )

  if (error) return { error: error.message }

  // Notify the maker
  await createNotification({
    userId: makerId,
    type:   'job_invitation',
    title:  `You were invited to quote on "${job.title}"`,
    body:   'A client browsed your profile and wants you specifically to quote on their request.',
    link:   `/jobs/${jobId}`,
  })

  return { success: true }
}

export async function getClientOpenJobs() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const effectiveUserId = await getEffectiveUserId(user)
  const admin = createAdminClient()

  const { data } = await admin
    .from('jobs')
    .select('id, title, material, budget, currency')
    .eq('client_id', effectiveUserId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getJobInvitation(jobId: string, makerId: string) {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('job_invitations')
    .select('id')
    .eq('job_id', jobId)
    .eq('maker_id', makerId)
    .maybeSingle()
  return !!data
}
