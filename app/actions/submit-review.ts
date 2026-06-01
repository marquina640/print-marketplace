'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyReviewsPublished } from './notifications'

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

  const admin = createAdminClient()

  const { data: job } = await admin
    .from('jobs')
    .select('status, title, client_id')
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
    .select('id, reviewer_id, reviewee_id, rating, comment')
    .eq('job_id', jobId)

  if ((allReviews?.length ?? 0) >= 2) {
    await admin
      .from('reviews')
      .update({ is_public: true })
      .eq('job_id', jobId)

    await admin
      .from('jobs')
      .update({ status: 'completed' } as any)
      .eq('id', jobId)
      .in('status', ['delivered', 'completed'])

    // Notify both parties with each other's review content
    publishReviewEmails({ jobId, jobTitle: job.title, reviews: allReviews }).catch(() => {})
  }

  revalidatePath(`/jobs/${jobId}`)
}

async function publishReviewEmails({
  jobId,
  jobTitle,
  reviews,
}: {
  jobId: string
  jobTitle: string
  reviews: Array<{ reviewer_id: string; reviewee_id: string; rating: number; comment: string | null }>
}) {
  try {
    const admin = createAdminClient()

    const r1 = reviews[0]
    const r2 = reviews[1]
    if (!r1 || !r2) return

    // Get emails + display names for both reviewers
    const [{ data: p1 }, { data: p2 }] = await Promise.all([
      admin.from('profiles').select('email, display_name').eq('user_id', r1.reviewer_id).single(),
      admin.from('profiles').select('email, display_name').eq('user_id', r2.reviewer_id).single(),
    ])

    if (!p1?.email || !p2?.email) return

    await notifyReviewsPublished({
      jobId,
      jobTitle,
      party1: {
        userId:       r1.reviewer_id,
        email:        p1.email,
        reviewerName: p1.display_name ?? p1.email.split('@')[0],
        rating:       r1.rating,
        comment:      r1.comment,
      },
      party2: {
        userId:       r2.reviewer_id,
        email:        p2.email,
        reviewerName: p2.display_name ?? p2.email.split('@')[0],
        rating:       r2.rating,
        comment:      r2.comment,
      },
    })
  } catch {
    // non-critical
  }
}
