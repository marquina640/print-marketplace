'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Returns the number of completed/delivered jobs where the user
 * was a participant (client or accepted maker) but hasn't left a review yet.
 */
export async function countUnreviewedJobs(userId: string): Promise<number> {
  const supabase = await createClient()

  // Jobs where user was the client
  const { data: clientJobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('client_id', userId)
    .in('status', ['completed', 'delivered'])

  // Jobs where user was the accepted maker
  const { data: makerQuotes } = await supabase
    .from('quotes')
    .select('job_id')
    .eq('printer_id', userId)
    .eq('status', 'accepted')

  let makerJobIds: string[] = []
  if (makerQuotes && makerQuotes.length > 0) {
    const allMakerJobIds = makerQuotes.map(q => q.job_id)
    const { data: makerJobs } = await supabase
      .from('jobs')
      .select('id')
      .in('id', allMakerJobIds)
      .in('status', ['completed', 'delivered'])
    makerJobIds = makerJobs?.map(j => j.id) ?? []
  }

  // Union unique job IDs
  const jobIdSet = new Set([
    ...(clientJobs?.map(j => j.id) ?? []),
    ...makerJobIds,
  ])

  if (jobIdSet.size === 0) return 0

  // Reviews already left by this user
  const { data: reviews } = await supabase
    .from('reviews')
    .select('job_id')
    .eq('reviewer_id', userId)
    .in('job_id', [...jobIdSet])

  const reviewedIds = new Set(reviews?.map(r => r.job_id) ?? [])
  return [...jobIdSet].filter(id => !reviewedIds.has(id)).length
}
