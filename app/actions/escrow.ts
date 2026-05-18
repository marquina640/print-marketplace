'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from './notifications'

export async function markJobShipped(jobId: string) {
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
  } as any).eq('id', jobId)

  await createNotification({
    userId: job.client_id,
    type: 'job_shipped',
    title: 'Your order has shipped!',
    body: `"${job.title}" is on its way. Confirm receipt when it arrives.`,
    link: `/jobs/${jobId}`,
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
    await createNotification({
      userId: acceptedQuote.printer_id,
      type: 'job_delivered',
      title: 'Delivery confirmed!',
      body: `The client confirmed receipt of "${job.title}". Your payment is being processed.`,
      link: `/jobs/${jobId}`,
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
  if (!job || (job as any).status !== 'delivered') throw new Error('Job not delivered')

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
