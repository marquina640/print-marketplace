import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailShipReminder } from '@/lib/email'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Find paid jobs (not yet shipped) with an accepted quote that has a lead time
  const { data: paidJobs } = await admin
    .from('jobs')
    .select('id, title, client_id, paid_at, ship_reminder_2d_sent_at, ship_reminder_1d_sent_at, ship_overdue_sent_at')
    .eq('status', 'paid')
    .not('paid_at', 'is', null)

  if (!paidJobs || paidJobs.length === 0) {
    return NextResponse.json({ checked: 0, emailed: 0 })
  }

  // Fetch accepted quotes for these jobs to get lead_time_days and maker info
  const jobIds = paidJobs.map((j) => j.id)
  const { data: quotes } = await admin
    .from('quotes')
    .select('job_id, printer_id, lead_time_days')
    .in('job_id', jobIds)
    .eq('status', 'accepted')

  const quoteByJobId = Object.fromEntries((quotes ?? []).map((q) => [q.job_id, q]))

  // Fetch maker profiles for email/name
  const makerIds = [...new Set((quotes ?? []).map((q) => q.printer_id))]
  const { data: profiles } = await admin
    .from('profiles')
    .select('user_id, email, display_name')
    .in('user_id', makerIds)

  const profileByMakerId = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]))

  const now = Date.now()
  let emailed = 0

  for (const job of paidJobs) {
    const quote = quoteByJobId[job.id]
    if (!quote?.lead_time_days || !job.paid_at) continue

    const dueDate = new Date(job.paid_at).getTime() + quote.lead_time_days * 86400000
    const daysLeft = Math.ceil((dueDate - now) / 86400000)

    const profile = profileByMakerId[quote.printer_id]
    if (!profile?.email) continue

    const jobUrl = `/jobs/${job.id}`

    try {
      if (daysLeft <= 0 && !(job as any).ship_overdue_sent_at) {
        await emailShipReminder({ to: profile.email, name: profile.display_name ?? null, jobTitle: job.title, jobUrl, daysLeft })
        await admin.from('jobs').update({ ship_overdue_sent_at: new Date().toISOString() } as any).eq('id', job.id)
        emailed++
      } else if (daysLeft === 1 && !(job as any).ship_reminder_1d_sent_at) {
        await emailShipReminder({ to: profile.email, name: profile.display_name ?? null, jobTitle: job.title, jobUrl, daysLeft })
        await admin.from('jobs').update({ ship_reminder_1d_sent_at: new Date().toISOString() } as any).eq('id', job.id)
        emailed++
      } else if (daysLeft === 2 && !(job as any).ship_reminder_2d_sent_at) {
        await emailShipReminder({ to: profile.email, name: profile.display_name ?? null, jobTitle: job.title, jobUrl, daysLeft })
        await admin.from('jobs').update({ ship_reminder_2d_sent_at: new Date().toISOString() } as any).eq('id', job.id)
        emailed++
      }
    } catch {
      // non-fatal
    }
  }

  return NextResponse.json({ checked: paidJobs.length, emailed })
}
