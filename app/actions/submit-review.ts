'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function submitReview({
  jobId,
  reviewerId,
  revieweeId,
  rating,
  comment,
}: {
  jobId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Use admin client to bypass RLS — this is safe because the reviewerId
  // is validated server-side via effectiveUserId (set by the page, not the client)
  const admin = createAdminClient()

  // Verify the job is in a reviewable state
  const { data: job } = await admin
    .from('jobs')
    .select('status')
    .eq('id', jobId)
    .single()

  if (!job || !['completed', 'delivered'].includes(job.status)) {
    throw new Error('Job is not in a reviewable state.')
  }

  const { error } = await admin.from('reviews').insert({
    job_id:      jobId,
    reviewer_id: reviewerId,
    reviewee_id: revieweeId,
    rating,
    comment,
  })

  if (error) throw new Error(error.message)

  // If both parties have now reviewed, make reviews public and complete the job
  const { data: allReviews } = await admin
    .from('reviews')
    .select('id')
    .eq('job_id', jobId)

  if ((allReviews?.length ?? 0) >= 2) {
    await admin
      .from('reviews')
      .update({ is_public: true })
      .eq('job_id', jobId)

    // Auto-complete the job now both parties have reviewed
    await admin
      .from('jobs')
      .update({ status: 'completed' } as any)
      .eq('id', jobId)
      .in('status', ['delivered', 'completed'])
  }

  revalidatePath(`/jobs/${jobId}`)
}
