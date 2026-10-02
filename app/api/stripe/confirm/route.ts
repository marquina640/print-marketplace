import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe }            from '@/lib/stripe'
import { notifyJobPaid }     from '@/app/actions/notifications'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId, jobId } = await req.json() as { paymentIntentId: string; jobId: string }
    if (!paymentIntentId || !jobId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (pi.status !== 'succeeded') {
      return NextResponse.json({ error: `Payment not completed: ${pi.status}` }, { status: 400 })
    }

    const admin = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    await admin.from('jobs').update({
      status:          'paid',
      paid_at:         new Date().toISOString(),
      paypal_order_id: paymentIntentId,
    } as any).eq('id', jobId)

    const { data: job }   = await admin.from('jobs').select('title, client_id').eq('id', jobId).single()
    const { data: quote } = await admin.from('quotes').select('printer_id, price').eq('job_id', jobId).eq('status', 'accepted').single()

    if (quote && job) {
      const { data: printerProfile } = await admin.from('profiles').select('email').eq('user_id', quote.printer_id).single()
      if (printerProfile?.email) {
        notifyJobPaid({
          jobId,
          jobTitle:     job.title,
          printerId:    quote.printer_id,
          printerEmail: printerProfile.email,
          price:        quote.price,
        }).catch(() => {})
      }
    }

    return NextResponse.json({ success: true, redirect: `${appUrl}/jobs/${jobId}?payment=success` })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Stripe confirm error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
