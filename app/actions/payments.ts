'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification, notifyJobShipped, notifyDeliveryConfirmed } from './notifications'
import { transferToMaker, PLATFORM_FEE_PERCENT } from '@/lib/stripe'

export interface ShippingDetails {
  inPerson: boolean
  carrier?: string
  trackingNumber?: string
  shippedDate?: string
}

export async function markJobShipped(jobId: string, details: ShippingDetails) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  const cookieStore = await cookies()
  const previewUserId = profile?.role === 'admin' ? cookieStore.get('admin_preview_user_id')?.value : undefined
  const effectiveUserId = previewUserId ?? user.id

  const admin = createAdminClient()

  const { data: job } = await admin.from('jobs').select('*').eq('id', jobId).single()
  if (!job || (job as any).status !== 'paid') throw new Error('Job not in paid state')

  const { data: acceptedQuote } = await admin
    .from('quotes').select('printer_id').eq('job_id', jobId).eq('status', 'accepted').single()
  if (!acceptedQuote || acceptedQuote.printer_id !== effectiveUserId) throw new Error('Not the accepted printer')

  const { error: updateError } = await admin.from('jobs').update({
    status:             'shipped',
    shipped_at:         new Date().toISOString(),
    in_person_delivery: details.inPerson,
    shipping_carrier:   details.inPerson ? null : (details.carrier ?? null),
    tracking_number:    details.inPerson ? null : (details.trackingNumber ?? null),
    shipped_date:       details.shippedDate ?? new Date().toISOString().slice(0, 10),
  } as any).eq('id', jobId)
  if (updateError) throw new Error(updateError.message)

  const { data: clientProfile } = await admin
    .from('profiles').select('email').eq('user_id', job.client_id).single()

  await notifyJobShipped({
    jobId,
    jobTitle:       job.title,
    clientId:       job.client_id,
    clientEmail:    clientProfile?.email ?? '',
    inPerson:       details.inPerson,
    carrier:        details.carrier,
    trackingNumber: details.trackingNumber,
  })

  revalidatePath(`/jobs/${jobId}`)
}

export async function confirmJobDelivery(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  const cookieStore = await cookies()
  const previewUserId = profile?.role === 'admin' ? cookieStore.get('admin_preview_user_id')?.value : undefined
  const effectiveUserId = previewUserId ?? user.id

  const adminClient = createAdminClient()

  const { data: job } = await adminClient.from('jobs').select('*').eq('id', jobId).single()
  if (!job || (job as any).status !== 'shipped') throw new Error('Job not in shipped state')
  if (job.client_id !== effectiveUserId) throw new Error('Not the job owner')

  const { error: deliveryError } = await adminClient.from('jobs').update({
    status:       'delivered',
    delivered_at: new Date().toISOString(),
  } as any).eq('id', jobId)
  if (deliveryError) throw new Error(deliveryError.message)

  const { data: acceptedQuote } = await adminClient
    .from('quotes').select('printer_id, price').eq('job_id', jobId).eq('status', 'accepted').single()

  if (acceptedQuote) {
    const { data: printerProfile } = await adminClient
      .from('profiles').select('email').eq('user_id', acceptedQuote.printer_id).single()

    await notifyDeliveryConfirmed({
      jobId,
      jobTitle:     job.title,
      printerId:    acceptedQuote.printer_id,
      printerEmail: printerProfile?.email ?? '',
    })

    const { data: printerPayoutProfile } = await adminClient
      .from('printer_profiles').select('stripe_account_id, fee_waiver_until').eq('user_id', acceptedQuote.printer_id).single()

    const stripeAccountId = (printerPayoutProfile as any)?.stripe_account_id as string | null

    if (acceptedQuote.price && stripeAccountId) {
      const feeWaiverUntil = (printerPayoutProfile as any)?.fee_waiver_until as string | null
      const hasWaiver = feeWaiverUntil && new Date(feeWaiverUntil) > new Date()
      const effectiveFee = hasWaiver ? 0 : PLATFORM_FEE_PERCENT
      const makerShareStr = (acceptedQuote.price * (1 - effectiveFee)).toFixed(2)
      try {
        await transferToMaker(acceptedQuote.price, stripeAccountId, jobId, job.title, effectiveFee)

        await adminClient.from('jobs').update({
          payout_at: new Date().toISOString(),
          status:    'completed',
        } as any).eq('id', jobId)

        await createNotification({
          userId: acceptedQuote.printer_id,
          type:   'payout_sent',
          title:  'Payment sent!',
          body:   `CHF ${makerShareStr} for "${job.title}" has been sent to your bank account.`,
          link:   `/jobs/${jobId}`,
        })
      } catch (err) {
        console.error('Auto-payout failed for job', jobId, err)
      }
    }
    // If no Stripe account, job stays at 'delivered' → visible in admin Pending Payouts
  }

  revalidatePath(`/jobs/${jobId}`)
}

export async function markPayoutSent(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not admin')

  const admin = createAdminClient()

  const { data: job } = await admin.from('jobs').select('*').eq('id', jobId).single()
  if (!job || !['delivered', 'completed'].includes((job as any).status)) throw new Error('Job not delivered')

  const { data: acceptedQuote } = await admin
    .from('quotes').select('printer_id, price').eq('job_id', jobId).eq('status', 'accepted').single()
  if (!acceptedQuote) throw new Error('No accepted quote found')

  const { data: printerPayoutProfile } = await admin
    .from('printer_profiles').select('stripe_account_id, fee_waiver_until').eq('user_id', acceptedQuote.printer_id).single()

  const stripeAccountId = (printerPayoutProfile as any)?.stripe_account_id as string | null
  if (!stripeAccountId) throw new Error('Maker has no Stripe account connected')

  const feeWaiverUntil = (printerPayoutProfile as any)?.fee_waiver_until as string | null
  const hasWaiver = feeWaiverUntil && new Date(feeWaiverUntil) > new Date()
  const effectiveFee = hasWaiver ? 0 : PLATFORM_FEE_PERCENT
  const makerShare = (acceptedQuote.price * (1 - effectiveFee)).toFixed(2)

  await transferToMaker(acceptedQuote.price, stripeAccountId, jobId, job.title, effectiveFee)

  await admin.from('jobs').update({
    payout_at: new Date().toISOString(),
    status:    'completed',
  } as any).eq('id', jobId)

  await createNotification({
    userId: acceptedQuote.printer_id,
    type:   'payout_sent',
    title:  'Payment sent!',
    body:   `CHF ${makerShare} for "${job.title}" has been sent to your bank account.`,
    link:   `/jobs/${jobId}`,
  })

  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/dashboard/admin')
}
