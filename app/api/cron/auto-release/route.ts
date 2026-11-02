import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailDeliveryReminder, emailAutoReleased } from '@/lib/email'

// Called daily by Vercel Cron. Protected by CRON_SECRET.
export async function GET(req: NextRequest) {
  const secret   = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
  const expected = process.env.CRON_SECRET ?? ''
  const match =
    secret.length > 0 &&
    expected.length > 0 &&
    secret.length === expected.length &&
    timingSafeEqual(Buffer.from(secret), Buffer.from(expected))
  if (!match) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin    = createAdminClient()
  const now      = new Date()
  const APP_URL  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://printmarkethub.com'

  // Fetch all shipped jobs with their shipped_at timestamp
  const { data: shippedJobs } = await admin
    .from('jobs')
    .select('id, title, client_id, shipped_at, delivery_reminder_1_sent_at, delivery_reminder_2_sent_at')
    .eq('status', 'shipped')
    .not('shipped_at', 'is', null)

  // Fetch IDs of shipped jobs that have an open dispute — skip auto-release for these
  const shippedIds = (shippedJobs ?? []).map((j) => (j as any).id)
  const { data: openDisputeRows } = shippedIds.length > 0
    ? await admin.from('disputes').select('job_id').eq('status', 'open').in('job_id', shippedIds)
    : { data: [] }
  const jobsWithOpenDispute = new Set((openDisputeRows ?? []).map((d) => (d as any).job_id))

  const results = { reminder1: 0, reminder2: 0, released: 0, skipped_dispute: 0, errors: [] as string[] }

  for (const job of shippedJobs ?? []) {
    try {
      // Never auto-release if there is an open dispute — wait for admin to resolve it
      if (jobsWithOpenDispute.has((job as any).id)) {
        results.skipped_dispute++
        continue
      }

      const shippedAt = new Date((job as any).shipped_at)
      const daysSinceShip = (now.getTime() - shippedAt.getTime()) / (1000 * 60 * 60 * 24)

      // Fetch client profile for email
      const { data: profile } = await admin
        .from('profiles')
        .select('email, display_name')
        .eq('user_id', (job as any).client_id)
        .single()

      if (!profile?.email) continue

      const jobUrl       = `/jobs/${(job as any).id}`
      const autoRelDate  = new Date(shippedAt.getTime() + 14 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

      // Auto-release at 14 days if reminder 2 was sent
      if (daysSinceShip >= 14 && (job as any).delivery_reminder_2_sent_at) {
        // Mark as delivered (auto-confirm) — triggers normal payout flow
        const { error } = await admin
          .from('jobs')
          .update({ status: 'delivered', delivered_at: now.toISOString() })
          .eq('id', (job as any).id)
          .eq('status', 'shipped')
        if (error) { results.errors.push(`auto-release ${(job as any).id}: ${error.message}`); continue }

        await emailAutoReleased({
          to:       profile.email,
          name:     profile.display_name,
          jobTitle: (job as any).title,
          jobUrl,
        })
        results.released++
        continue
      }

      // Second reminder at 10 days if first was sent but not second
      if (daysSinceShip >= 10 && (job as any).delivery_reminder_1_sent_at && !(job as any).delivery_reminder_2_sent_at) {
        await emailDeliveryReminder({
          to:               profile.email,
          name:             profile.display_name,
          jobTitle:         (job as any).title,
          jobUrl,
          isSecondReminder: true,
          autoReleaseDate:  autoRelDate,
        })
        await admin.from('jobs').update({ delivery_reminder_2_sent_at: now.toISOString() }).eq('id', (job as any).id)
        results.reminder2++
        continue
      }

      // First reminder at 7 days if not yet sent
      if (daysSinceShip >= 7 && !(job as any).delivery_reminder_1_sent_at) {
        await emailDeliveryReminder({
          to:               profile.email,
          name:             profile.display_name,
          jobTitle:         (job as any).title,
          jobUrl,
          isSecondReminder: false,
          autoReleaseDate:  autoRelDate,
        })
        await admin.from('jobs').update({ delivery_reminder_1_sent_at: now.toISOString() }).eq('id', (job as any).id)
        results.reminder1++
      }
    } catch (e) {
      results.errors.push(`job ${(job as any).id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return NextResponse.json(results)
}
