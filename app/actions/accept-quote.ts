'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyQuoteAccepted } from './notifications'
import { sendMessage } from './send-message'

export async function acceptQuote({
  jobId,
  quoteId,
  message,
  shippingAddress,
}: {
  jobId: string
  quoteId: string
  message?: string
  shippingAddress?: {
    name: string
    line1: string
    line2?: string
    city: string
    postalCode: string
    country: string
  }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify the caller owns the job
  const { data: job } = await supabase
    .from('jobs')
    .select('client_id, status, title')
    .eq('id', jobId)
    .single()

  if (!job) throw new Error('Job not found')
  if (job.client_id !== user.id) throw new Error('Forbidden')
  if (!['open', 'quoted'].includes(job.status)) throw new Error('Job is not open for acceptance')

  // Use admin client for the updates — bypasses RLS
  const admin = createAdminClient()

  // Fetch quote from DB to get authoritative printerId and price — never trust caller-supplied values
  const { data: quote } = await admin
    .from('quotes')
    .select('id, job_id, printer_id, price')
    .eq('id', quoteId)
    .eq('job_id', jobId)
    .single()

  if (!quote) throw new Error('Quote not found for this job')

  const { data: printerProfile } = await admin
    .from('profiles')
    .select('email')
    .eq('user_id', quote.printer_id)
    .single()

  await admin.from('quotes').update({ status: 'rejected' }).eq('job_id', jobId).neq('id', quoteId)
  await admin.from('quotes').update({ status: 'accepted' }).eq('id', quoteId)
  await admin.from('jobs').update({
    status: 'accepted',
    accepted_quote_id: quoteId,
    ...(shippingAddress ? { shipping_address: shippingAddress } : {}),
  } as any).eq('id', jobId)

  // Notifications and message are fire-and-forget
  if (printerProfile?.email && quote.price && job.title) {
    notifyQuoteAccepted({ jobId, jobTitle: job.title, printerId: quote.printer_id, printerEmail: printerProfile.email, price: quote.price }).catch(() => {})
  }
  if (message?.trim()) {
    sendMessage({ jobId, receiverId: quote.printer_id, content: message.trim() }).catch(() => {})
  }
}
