import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient }   from '@/lib/supabase/admin'
import { capturePayPalOrder }  from '@/lib/paypal'
import { notifyJobPaid }       from '@/app/actions/notifications'

export const dynamic = 'force-dynamic'

// Called by the PayPal JS SDK after buyer approves (inline buttons flow)
export async function POST(req: NextRequest) {
  try {
    const { orderId, jobId } = await req.json() as { orderId: string; jobId: string }
    if (!orderId || !jobId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    return captureAndRespond(orderId, jobId, req)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

async function captureAndRespond(orderId: string, jobId: string, _req: NextRequest): Promise<NextResponse> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const admin  = createAdminClient()

  const { data: job } = await admin.from('jobs').select('id, title, client_id').eq('id', jobId).single()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const { data: quote } = await admin.from('quotes').select('printer_id, price').eq('job_id', jobId).eq('status', 'accepted').single()

  let makerMerchantId: string | undefined
  if (quote) {
    const { data: pp } = await admin.from('printer_profiles').select('paypal_merchant_id, paypal_onboarding_complete').eq('user_id', quote.printer_id).single()
    if ((pp as any)?.paypal_onboarding_complete) makerMerchantId = (pp as any)?.paypal_merchant_id
  }

  const result = await capturePayPalOrder(orderId, makerMerchantId)

  if (result.status === 'COMPLETED') {
    await admin.from('jobs').update({ status: 'paid', paid_at: new Date().toISOString(), paypal_order_id: orderId } as any).eq('id', jobId)

    if (quote) {
      const { data: printerProfile } = await admin.from('profiles').select('email').eq('user_id', quote.printer_id).single()
      if (printerProfile?.email) {
        notifyJobPaid({ jobId, jobTitle: (job as any).title, printerId: quote.printer_id, printerEmail: printerProfile.email, price: quote.price }).catch(() => {})
      }
    }
    return NextResponse.json({ success: true, redirect: `${appUrl}/jobs/${jobId}?payment=success` })
  }
  return NextResponse.json({ success: false, redirect: `${appUrl}/jobs/${jobId}?payment=pending` })
}

// Called by PayPal redirect (fallback)
export async function GET(req: NextRequest) {
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('token')
  const jobId   = searchParams.get('jobId')
  if (!orderId || !jobId) return NextResponse.redirect(`${appUrl}/dashboard/client`)
  try {
    const result = await captureAndRespond(orderId, jobId, req)
    const body = await result.json()
    return NextResponse.redirect(body.redirect ?? `${appUrl}/dashboard/client`)
  } catch (err) {
    console.error('PayPal capture error:', err)
    return NextResponse.redirect(`${appUrl}/jobs/${jobId}?payment=error`)
  }
}
