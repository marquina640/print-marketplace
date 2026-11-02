'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { emailTemplate, ctaButton } from '@/lib/email'
import { createNotification } from './notifications'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://printmarkethub.com'

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

  // Fetch client profile and accepted maker in parallel
  const [{ data: clientProfile }, { data: acceptedQuote }] = await Promise.all([
    adminClient.from('profiles').select('display_name, email').eq('user_id', user.id).single(),
    adminClient
      .from('quotes')
      .select('printer_id, profiles(display_name, email)')
      .eq('job_id', jobId)
      .eq('status', 'accepted')
      .maybeSingle(),
  ])

  const jobUrl   = `/jobs/${jobId}`
  const clientName = clientProfile?.display_name ?? clientProfile?.email ?? 'A client'

  const disputeBlock = `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#c2410c;">Reason</p>
      <p style="margin:0 0 12px;font-size:14px;color:#1a1625;">${reason}</p>
      ${details ? `<p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#c2410c;">Details</p><p style="margin:0;font-size:14px;color:#1a1625;">${details}</p>` : ''}
    </div>
  `

  // Notify the maker (in-app + email)
  const makerProfile = (acceptedQuote as any)?.profiles as { display_name: string | null; email: string } | null
  const makerId      = (acceptedQuote as any)?.printer_id as string | undefined

  if (makerId) {
    await createNotification({
      userId: makerId,
      type:   'dispute_raised',
      title:  'A dispute has been raised',
      body:   `The client raised a dispute on "${job.title}": ${reason}. Our team is looking into it.`,
      link:   jobUrl,
    })
  }

  if (makerProfile?.email) {
    const makerHtml = emailTemplate({
      previewText:  `Dispute raised on your order: ${job.title}`,
      heroLabel:    'Dispute notice',
      heroTitle:    `A dispute was raised on "${job.title}"`,
      heroSubtitle: 'Our team is reviewing the situation.',
      body: `
        <p style="margin:0 0 16px;color:#6b6760;font-size:14px;line-height:1.6;">
          Hi ${makerProfile.display_name ?? 'there'}, the client has raised a dispute on this order.
          No action is needed from you right now — our team will investigate and be in touch.
        </p>
        ${disputeBlock}
        ${ctaButton('View order', `${APP_URL}${jobUrl}`)}
      `,
    })
    await resend.emails.send({
      from:    'PrintMarketHub <hello@printmarkethub.com>',
      to:      makerProfile.email,
      subject: `Dispute raised on your order: ${job.title}`,
      html:    makerHtml,
    })
  }

  // Notify admin by email
  const { data: adminUsers } = await adminClient.from('profiles').select('email').eq('role', 'admin')
  const adminEmails = (adminUsers ?? []).map((a) => a.email).filter(Boolean)

  if (adminEmails.length > 0) {
    const adminHtml = emailTemplate({
      previewText:  `Dispute raised on job: ${job.title}`,
      heroLabel:    'Support ticket',
      heroTitle:    `Dispute raised on "${job.title}"`,
      heroSubtitle: 'A client needs your attention.',
      body: `
        <p style="margin:0 0 16px;color:#6b6760;font-size:14px;line-height:1.6;">
          <strong>${clientName}</strong> has raised a dispute.
        </p>
        ${disputeBlock}
        ${ctaButton('View dispute', `${APP_URL}/dashboard/admin/disputes`)}
      `,
    })
    await resend.emails.send({
      from:    'PrintMarketHub <hello@printmarkethub.com>',
      to:      adminEmails as string[],
      subject: `Dispute raised: ${job.title}`,
      html:    adminHtml,
    })
  }
}
