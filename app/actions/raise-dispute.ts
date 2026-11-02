'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { createNotification } from './notifications'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://printmarkethub.com'

function shell(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="padding-bottom:20px;text-align:center;">
  <span style="font-size:20px;font-weight:900;letter-spacing:-0.5px;color:#1a1625;">PrintMarket<span style="color:#D4A017;">Hub</span></span>
</td></tr>
<tr><td style="background:#ffffff;border-radius:16px;border:1px solid #e5e1d8;padding:36px 40px;">${content}</td></tr>
<tr><td style="padding-top:20px;text-align:center;font-size:11px;color:#9e9b94;">
  &copy; 2025 PrintMarketHub &middot; Switzerland
</td></tr>
</table></td></tr></table></body></html>`
}

function cta(label: string, url: string) {
  return `<p style="margin:24px 0 0;"><a href="${url}" style="display:inline-block;background:#D4A017;color:#1a1625;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">${label}</a></p>`
}

export async function raiseDispute(jobId: string, reason: string, details: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, status, client_id, shipping_carrier, tracking_number, shipped_date')
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

  const carrier        = (job as any).shipping_carrier as string | null
  const trackingNumber = (job as any).tracking_number  as string | null
  const shippedDate    = (job as any).shipped_date     as string | null
  const trackingBlock  = (carrier || trackingNumber) ? `
    <div style="background:#f9f8f5;border-radius:8px;padding:10px 14px;margin-top:10px;font-size:13px;color:#6b6760;line-height:1.8;">
      ${carrier        ? `<div><span style="font-weight:600;color:#1a1625;">Carrier:</span> ${carrier}</div>`                                                                            : ''}
      ${trackingNumber ? `<div><span style="font-weight:600;color:#1a1625;">Tracking:</span> <span style="font-family:monospace;">${trackingNumber}</span></div>`                       : ''}
      ${shippedDate    ? `<div><span style="font-weight:600;color:#1a1625;">Shipped on:</span> ${new Date(shippedDate).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</div>` : ''}
    </div>
  ` : ''

  const disputeBlock = `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#c2410c;">Reason</p>
      <p style="margin:0 0 12px;font-size:14px;color:#1a1625;">${reason}</p>
      ${details ? `<p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#c2410c;">Details</p><p style="margin:0;font-size:14px;color:#1a1625;">${details}</p>` : ''}
      ${trackingBlock}
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
    await resend.emails.send({
      from:    'PrintMarketHub <hello@printmarkethub.com>',
      to:      makerProfile.email,
      subject: `Dispute raised on your order: ${job.title}`,
      html: shell(`
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1625;">A dispute was raised on your order</h2>
        <p style="margin:0 0 16px;color:#6b6760;font-size:14px;line-height:1.6;">
          Hi ${makerProfile.display_name ?? 'there'}, the client has raised a dispute on <strong>${job.title}</strong>.
          No action is needed from you right now — our team will investigate and be in touch.
        </p>
        ${disputeBlock}
        ${cta('View order', `${APP_URL}${jobUrl}`)}
      `),
    })
  }

  // Notify admin by email
  const { data: adminUsers } = await adminClient.from('profiles').select('email').eq('role', 'admin')
  const adminEmails = (adminUsers ?? []).map((a) => a.email).filter(Boolean)

  if (adminEmails.length > 0) {
    await resend.emails.send({
      from:    'PrintMarketHub <hello@printmarkethub.com>',
      to:      adminEmails as string[],
      subject: `Dispute raised: ${job.title}`,
      html: shell(`
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1625;">Dispute raised: ${job.title}</h2>
        <p style="margin:0 0 16px;color:#6b6760;font-size:14px;line-height:1.6;">
          <strong>${clientName}</strong> has raised a dispute on this order.
        </p>
        ${disputeBlock}
        ${cta('View dispute', `${APP_URL}/dashboard/admin/disputes`)}
      `),
    })
  }
}
