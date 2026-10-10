'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyNewQuote, notifyMakerQuoteSubmitted } from './notifications'

export async function notifyClientOfNewQuote(jobId: string, price: number, currency: string = 'CHF') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const admin = createAdminClient()

  // Get maker display name + email for confirmation
  const { data: makerProfile } = await supabase
    .from('profiles').select('display_name, email').eq('user_id', user.id).single()
  const makerName  = makerProfile?.display_name ?? makerProfile?.email?.split('@')[0] ?? 'A maker'
  const makerEmail = makerProfile?.email

  // Get job and client info
  const { data: job } = await admin
    .from('jobs').select('title, client_id').eq('id', jobId).single()
  if (!job) return

  const { data: clientProfile } = await admin
    .from('profiles').select('email').eq('user_id', job.client_id).single()

  // Notify client of new quote
  if (clientProfile?.email) {
    await notifyNewQuote({
      jobId,
      jobTitle:    job.title,
      makerName,
      clientId:    job.client_id,
      clientEmail: clientProfile.email,
      price,
      currency,
    }).catch((err) => console.error('[notify] client new-quote failed:', err))
  }

  // Confirm to the maker that their quote was submitted
  if (makerEmail) {
    await notifyMakerQuoteSubmitted({
      jobId,
      jobTitle:   job.title,
      makerId:    user.id,
      makerEmail,
      price,
      currency,
    }).catch((err) => console.error('[notify] maker quote-submitted failed:', err))
  }
}
