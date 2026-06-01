'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://printmarkethub.com'

export async function cancelJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()

  const cookieStore = await cookies()
  const previewUserId = (profile as any)?.role === 'admin'
    ? cookieStore.get('admin_preview_user_id')?.value
    : undefined
  const effectiveUserId = previewUserId ?? user.id

  const admin = createAdminClient()

  const { data: job } = await admin.from('jobs').select('*').eq('id', jobId).single()
  if (!job) throw new Error('Job not found')

  // Only open or quoted jobs can be cancelled (not paid/shipped/etc.)
  if (!['open', 'quoted'].includes((job as any).status)) {
    throw new Error('This job cannot be cancelled — it is already in progress.')
  }

  // Only the job owner (or an admin) can cancel
  if ((job as any).client_id !== effectiveUserId && (profile as any)?.role !== 'admin') {
    throw new Error('Not authorised')
  }

  // Mark job as cancelled
  await admin.from('jobs').update({ status: 'cancelled' } as any).eq('id', jobId)

  // Reject all pending quotes
  await admin
    .from('quotes')
    .update({ status: 'rejected' } as any)
    .eq('job_id', jobId)
    .eq('status', 'pending')

  // Notify makers who had quoted (fire-and-forget)
  notifyQuoters({ job, jobId }).catch(() => {})

  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/dashboard/client')
}

async function notifyQuoters({ job, jobId }: { job: any; jobId: string }) {
  const admin = createAdminClient()

  const { data: quotes } = await admin
    .from('quotes')
    .select('printer_id')
    .eq('job_id', jobId)

  if (!quotes || quotes.length === 0) return

  const printerIds = quotes.map((q: any) => q.printer_id)

  const { data: printers } = await admin
    .from('profiles')
    .select('user_id, email, display_name')
    .in('user_id', printerIds)

  await Promise.all(
    (printers ?? []).map((p: any) =>
      sendEmail({
        to: p.email,
        subject: `Job cancelled — "${(job as any).title}"`,
        html: `
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1625;">Job cancelled</h2>
          <p style="margin:0 0 20px;color:#6b6760;font-size:14px;line-height:1.6;">
            The client has cancelled the job <em>${(job as any).title}</em> that you quoted on.
            Your quote has been automatically withdrawn.
          </p>
          <p style="margin:0;color:#6b6760;font-size:14px;">
            Browse other open requests on PrintMarketHub.
          </p>
          <p style="margin:24px 0 0;">
            <a href="${APP_URL}/jobs" style="display:inline-block;background:#D4A017;color:#1a1625;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
              Browse Requests &rarr;
            </a>
          </p>
        `,
      })
    )
  )
}
