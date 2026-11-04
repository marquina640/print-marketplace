'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailDisputeWarning } from '@/lib/email'

export async function sendDisputeWarning(disputeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not admin')

  const admin = createAdminClient()

  const { data: dispute } = await admin
    .from('disputes')
    .select('id, job_id, reason, details')
    .eq('id', disputeId)
    .single()
  if (!dispute) throw new Error('Dispute not found')

  const { data: job } = await admin
    .from('jobs')
    .select('id, title')
    .eq('id', (dispute as any).job_id)
    .single()
  if (!job) throw new Error('Job not found')

  const { data: quote } = await admin
    .from('quotes')
    .select('printer_id')
    .eq('job_id', (dispute as any).job_id)
    .eq('status', 'accepted')
    .single()
  if (!quote) throw new Error('No accepted quote found')

  const { data: makerProfile } = await admin
    .from('profiles')
    .select('email, display_name')
    .eq('user_id', (quote as any).printer_id)
    .single()
  if (!makerProfile?.email) throw new Error('Maker email not found')

  const disputeReason = [(dispute as any).reason, (dispute as any).details].filter(Boolean).join(': ')

  await emailDisputeWarning({
    to:            makerProfile.email,
    name:          (makerProfile as any).display_name ?? null,
    jobTitle:      job.title,
    jobUrl:        `/jobs/${job.id}`,
    disputeReason,
  })

  await admin
    .from('disputes')
    .update({ warning_sent_at: new Date().toISOString() } as any)
    .eq('id', disputeId)
}
