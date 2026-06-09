'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification, notifyJobShipped, notifyDeliveryConfirmed } from './notifications'

export interface ShippingDetails {
  inPerson: boolean
  carrier?: string
  trackingNumber?: string
  shippedDate?: string // ISO date string YYYY-MM-DD
}

export async function markJobShipped(jobId: string, details: ShippingDetails) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  const cookieStore = await cookies()
  const previewUserId = profile?.role === 'admin' ? cookieStore.get('admin_preview_user_id')?.value : undefined
  const effectiveUserId = previewUserId ?? user.id

  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single()
  if (!job || (job as any).status !== 'paid') throw new Error('Job not in paid state')

  const { data: acceptedQuote } = await supabase
    .from('quotes').select('printer_id').eq('job_id', jobId).eq('status', 'accepted').single()
  if (!acceptedQuote || acceptedQuote.printer_id !== effectiveUserId) throw new Error('Not the accepted printer')

  await supabase.from('jobs').update({
    status: 'shipped',
    shipped_at: new Date().toISOString(),
    in_person_delivery: details.inPerson,
    shipping_carrier:   details.inPerson ? null : (details.carrier ?? null),
    tracking_number:    details.inPerson ? null : (details.trackingNumber ?? null),
    shipped_date:       details.shippedDate ?? new Date().toISOString().slice(0, 10),
  } as any).eq('id', jobId)

  // Look up client email for the email notification
  const admin = createAdminClient()
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

  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single()
  if (!job || (job as any).status !== 'shipped') throw new Error('Job not in shipped state')
  if (job.client_id !== effectiveUserId) throw new Error('Not the job owner')

  await supabase.from('jobs').update({
    status: 'delivered',
    delivered_at: new Date().toISOString(),
  } as any).eq('id', jobId)

  const { data: acceptedQuote } = await supabase
    .from('quotes').select('printer_id, price').eq('job_id', jobId).eq('status', 'accepted').single()

  if (acceptedQuote) {
    const adminClient = createAdminClient()
    const { data: printerProfile } = await adminClient
      .from('profiles').select('email').eq('user_id', acceptedQuote.printer_id).single()

    await notifyDeliveryConfirmed({
      jobId,
      jobTitle:     job.title,
      printerId:    acceptedQuote.printer_id,
      printerEmail: printerProfile?.email ?? '',
    })
  }

  revalidatePath(`/jobs/${jobId}`)
}

export async function markPayoutSent(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not admin')

  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single()
  if (!job || !['delivered', 'completed'].includes((job as any).status)) throw new Error('Job not delivered')

  await supabase.from('jobs').update({
    payout_at: new Date().toISOString(),
    status: 'completed',
  } as any).eq('id', jobId)

  const { data: acceptedQuote } = await supabase
    .from('quotes').select('printer_id, price').eq('job_id', jobId).eq('status', 'accepted').single()

  if (acceptedQuote) {
    await createNotification({
      userId: acceptedQuote.printer_id,
      type: 'payout_sent',
      title: 'Payment sent!',
      body: `Your payment for "${job.title}" has been transferred to you.`,
      link: `/jobs/${jobId}`,
    })
  }

  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/dashboard/admin')
}
