import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailDeadlinePassed } from '@/lib/email'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  // Find open jobs whose deadline passed, no quotes, email not yet sent
  const { data: expiredJobs } = await admin
    .from('jobs')
    .select('id, title, client_id')
    .eq('status', 'open')
    .not('deadline', 'is', null)
    .lt('deadline', today)
    .is('deadline_passed_email_sent_at', null)

  if (!expiredJobs || expiredJobs.length === 0) {
    return NextResponse.json({ checked: 0, emailed: 0 })
  }

  // Filter to jobs with zero quotes
  const jobIds = expiredJobs.map((j) => j.id)
  const { data: quotedJobRows } = await admin
    .from('quotes')
    .select('job_id')
    .in('job_id', jobIds)

  const jobsWithQuotes = new Set((quotedJobRows ?? []).map((q) => q.job_id))
  const noQuoteJobs = expiredJobs.filter((j) => !jobsWithQuotes.has(j.id))

  if (noQuoteJobs.length === 0) {
    return NextResponse.json({ checked: expiredJobs.length, emailed: 0 })
  }

  const clientIds = [...new Set(noQuoteJobs.map((j) => j.client_id))]
  const { data: profiles } = await admin
    .from('profiles')
    .select('user_id, email, display_name')
    .in('user_id', clientIds)

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]))

  let emailed = 0
  for (const job of noQuoteJobs) {
    const profile = profileMap[job.client_id]
    if (!profile?.email) continue

    try {
      await emailDeadlinePassed({
        to:       profile.email,
        name:     profile.display_name ?? null,
        jobTitle: job.title,
        jobUrl:   `/jobs/${job.id}`,
      })

      await admin
        .from('jobs')
        .update({ deadline_passed_email_sent_at: new Date().toISOString() } as any)
        .eq('id', job.id)

      emailed++
    } catch {
      // non-fatal — try again tomorrow
    }
  }

  return NextResponse.json({ checked: expiredJobs.length, emailed })
}
