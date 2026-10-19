'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyQuoteAccepted } from './notifications'
import { sendMessage } from './send-message'

export async function acceptQuote({
  jobId,
  quoteId,
  printerId,
  printerEmail,
  priceAmount,
  jobTitle,
  message,
  shippingAddress,
}: {
  jobId: string
  quoteId: string
  printerId: string
  printerEmail?: string
  priceAmount?: number
  jobTitle?: string
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
    .select('client_id, status')
    .eq('id', jobId)
    .single()

  if (!job) throw new Error('Job not found')
  if (job.client_id !== user.id) throw new Error('Forbidden')
  if (!['open', 'quoted'].includes(job.status)) throw new Error('Job is not open for acceptance')

  // Use admin client for the updates — bypasses RLS
  const admin = createAdminClient()

  await admin.from('quotes').update({ status: 'rejected' }).eq('job_id', jobId).neq('id', quoteId)
  await admin.from('quotes').update({ status: 'accepted' }).eq('id', quoteId)
  await admin.from('jobs').update({
    status: 'accepted',
    accepted_quote_id: quoteId,
    ...(shippingAddress ? { shipping_address: shippingAddress } : {}),
  } as any).eq('id', jobId)

  // Notifications and message are fire-and-forget
  if (printerEmail && priceAmount && jobTitle) {
    notifyQuoteAccepted({ jobId, jobTitle, printerId, printerEmail, price: priceAmount }).catch(() => {})
  }
  if (message?.trim()) {
    sendMessage({ jobId, receiverId: printerId, content: message.trim() }).catch(() => {})
  }
}
