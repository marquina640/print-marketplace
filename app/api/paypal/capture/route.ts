import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { capturePayPalOrder } from '@/lib/paypal'
import { notifyJobPaid } from '@/app/actions/notifications'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  // PayPal uses 'token' as the order ID in the return URL
  const orderId = searchParams.get('token')
  const jobId   = searchParams.get('jobId')
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!orderId || !jobId) {
    return NextResponse.redirect(`${appUrl}/jobs/${jobId ?? ''}?payment=failed`)
  }

  try {
    const admin = createAdminClient()

    const { data: job } = await admin
      .from('jobs')
      .select('id, title, client_id, status, paypal_order_id')
      .eq('id', jobId)
      .single()

    if (!job) {
      return NextResponse.redirect(`${appUrl}/?payment=failed`)
    }

    // Idempotent: already paid
    if ((job as any).status === 'paid') {
      return NextResponse.redirect(`${appUrl}/jobs/${jobId}?payment=success`)
    }

    // Validate the order ID matches what we stored
    if ((job as any).paypal_order_id !== orderId) {
      console.error('PayPal order ID mismatch', { stored: (job as any).paypal_order_id, received: orderId })
      return NextResponse.redirect(`${appUrl}/jobs/${jobId}?payment=failed`)
    }

    if ((job as any).status !== 'accepted') {
      return NextResponse.redirect(`${appUrl}/jobs/${jobId}?payment=failed`)
    }

    const result = await capturePayPalOrder(orderId)
    if (result.status !== 'COMPLETED') {
      console.error('PayPal capture returned non-COMPLETED status:', result.status)
      return NextResponse.redirect(`${appUrl}/jobs/${jobId}?payment=failed`)
    }

    await admin.from('jobs').update({
      status:  'paid',
      paid_at: new Date().toISOString(),
    } as any).eq('id', jobId)

    // Notify the maker
    const { data: quote } = await admin
      .from('quotes')
      .select('printer_id, price')
      .eq('job_id', jobId)
      .eq('status', 'accepted')
      .single()

    if (quote) {
      const { data: printerProfile } = await admin
        .from('profiles').select('email').eq('user_id', (quote as any).printer_id).single()
      if ((printerProfile as any)?.email) {
        notifyJobPaid({
          jobId,
          jobTitle:     (job as any).title,
          printerId:    (quote as any).printer_id,
          printerEmail: (printerProfile as any).email,
          price:        (quote as any).price,
        }).catch(() => {})
      }
    }

    return NextResponse.redirect(`${appUrl}/jobs/${jobId}?payment=success`)
  } catch (err) {
    console.error('PayPal capture error:', err instanceof Error ? err.message : String(err))
    return NextResponse.redirect(`${appUrl}/jobs/${jobId}?payment=failed`)
  }
}
