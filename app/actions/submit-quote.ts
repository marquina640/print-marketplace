'use server'

import { createClient } from '@/lib/supabase/server'
import { notifyNewQuote } from './notifications'

export async function notifyClientOfNewQuote(jobId: string, price: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Get maker display name
  const { data: makerProfile } = await supabase
    .from('profiles').select('display_name, email').eq('user_id', user.id).single()
  const makerName = makerProfile?.display_name ?? makerProfile?.email?.split('@')[0] ?? 'A maker'

  // Get job owner
  const { data: job } = await supabase
    .from('jobs').select('title, client_id').eq('id', jobId).single()
  if (!job) return

  const { data: clientProfile } = await supabase
    .from('profiles').select('email').eq('user_id', job.client_id).single()
  if (!clientProfile) return

  await notifyNewQuote({
    jobId,
    jobTitle: job.title,
    makerName,
    clientId: job.client_id,
    clientEmail: clientProfile.email,
    price,
  })
}
