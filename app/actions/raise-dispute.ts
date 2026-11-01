'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { emailTemplate, ctaButton } from '@/lib/email'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function raiseDispute(jobId: string, reason: string, details: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, status, client_id')
    .eq('id', jobId)
    .single()

  if (!job) throw new Error('Job not found')
  if (job.client_id !== user.id) throw new Error('Not authorized')
  if (!['shipped', 'paid', 'in_progress'].includes(job.status)) throw new Error('Cannot raise a dispute for this job status')

  const adminClient = createAdminClient()

  // Check no open dispute already exists
  const { data: existing } = await adminClient
    .from('disputes')
    .select('id')
    .eq('job_id', jobId)
    .eq('status', 'open')
    .maybeSingle()

  if (existing) throw new Error('A dispute is already open for this job')

  const { error } = await adminClient.from('disputes').insert({
    job_id:    jobId,
    client_id: user.id,
    reason,
    details: details || null,
    status:  'open',
  })
  if (error) throw new Error(error.message)

  // Notify admin by email
  const { data: adminUsers } = await adminClient
    .from('profiles')
    .select('email')
    .eq('role', 'admin')

  const { data: clientProfile } = await adminClient
    .from('profiles')
    .select('display_name, email')
    .eq('user_id', user.id)
    .single()

  const adminEmails = (adminUsers ?? []).map((a) => a.email).filter(Boolean)

  if (adminEmails.length > 0) {
    const html = emailTemplate({
      previewText: `Dispute raised on job: ${job.title}`,
      heroLabel:   'Support ticket',
      heroTitle:   `Dispute raised on "${job.title}"`,
      heroSubtitle: 'A client needs your attention.',
      body: `
        <p style="margin:0 0 16px;color:#6b6760;font-size:14px;line-height:1.6;">
          <strong>${clientProfile?.display_name ?? clientProfile?.email ?? 'A client'}</strong> has raised a dispute.
        </p>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#c2410c;">Reason</p>
          <p style="margin:0 0 12px;font-size:14px;color:#1a1625;">${reason}</p>
          ${details ? `<p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#c2410c;">Details</p><p style="margin:0;font-size:14px;color:#1a1625;">${details}</p>` : ''}
        </div>
        ${ctaButton(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/admin/disputes`, 'View dispute')}
      `,
    })

    await resend.emails.send({
      from:    'PrintMarketHub <hello@printmarkethub.com>',
      to:      adminEmails as string[],
      subject: `Dispute raised: ${job.title}`,
      html,
    })
  }
}
