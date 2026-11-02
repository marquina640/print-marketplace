'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { sendEmail } from '@/lib/email'
import { createNotification } from './notifications'

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://printmarkethub.com'

export async function refundDispute(disputeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not admin')

  const admin = createAdminClient()

  const { data: dispute } = await admin
    .from('disputes')
    .select('*')
    .eq('id', disputeId)
    .single()
  if (!dispute) throw new Error('Dispute not found')
  if ((dispute as any).status !== 'open') throw new Error('Dispute is already resolved')

  const { data: job } = await admin
    .from('jobs')
    .select('id, title, client_id, stripe_session_id, status')
    .eq('id', (dispute as any).job_id)
    .single()
  if (!job) throw new Error('Job not found')

  if (!(job as any).stripe_session_id) {
    throw new Error('No Stripe session on this job. Issue the refund manually in the Stripe dashboard.')
  }

  // Retrieve session to get the payment intent
  const session = await stripe.checkout.sessions.retrieve((job as any).stripe_session_id)
  const paymentIntentId = session.payment_intent as string | null
  if (!paymentIntentId) throw new Error('No payment intent found on this Stripe session.')

  // Issue full refund
  await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: 'fraudulent', // closest Stripe reason for "item not received / dispute"
    metadata: { disputeId, jobId: (job as any).id },
  })

  // Mark job as cancelled and dispute as resolved
  await Promise.all([
    admin.from('jobs').update({ status: 'cancelled' } as any).eq('id', (job as any).id),
    admin.from('disputes').update({
      status:      'resolved',
      resolved_at: new Date().toISOString(),
    }).eq('id', disputeId),
  ])

  // Notify client
  const { data: clientProfile } = await admin
    .from('profiles')
    .select('email, display_name')
    .eq('user_id', (job as any).client_id)
    .single()

  if (clientProfile?.email) {
    await createNotification({
      userId: (job as any).client_id,
      type:   'refund_issued',
      title:  'Refund issued',
      body:   `Your refund for "${(job as any).title}" has been processed. It may take 5-10 business days to appear.`,
      link:   `/jobs/${(job as any).id}`,
    })

    await sendEmail({
      to:      clientProfile.email,
      subject: `Refund issued for "${(job as any).title}"`,
      html: `
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1625;">Your refund has been issued</h2>
        <p style="margin:0 0 16px;color:#6b6760;font-size:14px;line-height:1.6;">
          Hi ${clientProfile.display_name ?? 'there'}, we have processed a full refund for <strong>${(job as any).title}</strong>.
          It may take 5-10 business days to appear on your statement depending on your bank.
        </p>
        <p style="margin:0;color:#6b6760;font-size:14px;line-height:1.6;">
          If you have any questions, reply to this email and we will help.
        </p>
      `,
    })
  }

  // Notify maker
  const { data: acceptedQuote } = await admin
    .from('quotes')
    .select('printer_id, profiles(display_name, email)')
    .eq('job_id', (job as any).id)
    .eq('status', 'accepted')
    .maybeSingle()

  const makerId      = (acceptedQuote as any)?.printer_id as string | undefined
  const makerProfile = (acceptedQuote as any)?.profiles as { display_name: string | null; email: string } | null

  if (makerId) {
    await createNotification({
      userId: makerId,
      type:   'dispute_refunded',
      title:  'Dispute resolved: refund issued to client',
      body:   `After reviewing the dispute on "${(job as any).title}", a refund was issued to the client. No payment will be sent for this order.`,
      link:   `/jobs/${(job as any).id}`,
    })
  }

  if (makerProfile?.email) {
    await sendEmail({
      to:      makerProfile.email,
      subject: `Dispute resolved: refund issued for "${(job as any).title}"`,
      html: `
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1625;">Dispute resolved</h2>
        <p style="margin:0 0 16px;color:#6b6760;font-size:14px;line-height:1.6;">
          Hi ${makerProfile.display_name ?? 'there'}, after reviewing the dispute on <strong>${(job as any).title}</strong>,
          we issued a refund to the client. No payment will be sent for this order.
        </p>
        <p style="margin:0;color:#6b6760;font-size:14px;line-height:1.6;">
          If you believe this is incorrect, please reply to this email.
        </p>
      `,
    })
  }
}
