import { NextRequest, NextResponse } from 'next/server'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe }            from '@/lib/stripe'
import { notifyJobPaid }     from '@/app/actions/notifications'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { paymentIntentId, jobId } = await req.json() as { paymentIntentId: string; jobId: string }
    if (!paymentIntentId || !jobId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const admin = createAdminClient()

    // Verify the caller owns the job and it has an accepted quote
    const { data: job } = await admin.from('jobs').select('client_id, status, paypal_order_id').eq('id', jobId).single()
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    if (job.client_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (job.status !== 'accepted') return NextResponse.json({ error: 'Job not in accepted state' }, { status: 400 })

    // Verify the paymentIntentId was the one we issued for this job
    const storedIntentId = (job as any).paypal_order_id as string | null
    if (!storedIntentId || storedIntentId !== paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent does not match this job' }, { status: 400 })
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (pi.status !== 'succeeded') {
      return NextResponse.json({ error: `Payment not completed: ${pi.status}` }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    await admin.from('jobs').update({
      status:          'paid',
      paid_at:         new Date().toISOString(),
      paypal_order_id: paymentIntentId,
    } as any).eq('id', jobId)

    // Fetch job title and accepted quote for the notification email
    const { data: jobDetails } = await admin.from('jobs').select('title').eq('id', jobId).single()
    const { data: quote }      = await admin.from('quotes').select('printer_id, price').eq('job_id', jobId).eq('status', 'accepted').single()

    if (quote && jobDetails) {
      const { data: printerProfile } = await admin.from('profiles').select('email').eq('user_id', (quote as any).printer_id).single()
      if ((printerProfile as any)?.email) {
        notifyJobPaid({
          jobId,
          jobTitle:     (jobDetails as any).title,
          printerId:    (quote as any).printer_id,
          printerEmail: (printerProfile as any).email,
          price:        (quote as any).price,
        }).catch(() => {})
      }
    }

    return NextResponse.json({ success: true, redirect: `${appUrl}/jobs/${jobId}?payment=success` })
  } catch (err) {
    console.error('Stripe confirm error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Payment confirmation failed' }, { status: 500 })
  }
}
