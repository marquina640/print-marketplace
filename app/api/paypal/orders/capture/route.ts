import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient }   from '@/lib/supabase/admin'
import { capturePayPalOrder }  from '@/lib/paypal'
import { notifyJobPaid }       from '@/app/actions/notifications'

export const dynamic = 'force-dynamic'

/**
 * PayPal redirects here after the buyer approves the payment.
 * Query params from PayPal:
 *   token   — the PayPal Order ID
 *   PayerID — the buyer's PayPal Payer ID
 * We also append:
 *   jobId   — our internal job ID (set in the return_url when creating the order)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const orderId  = searchParams.get('token')
  const jobId    = searchParams.get('jobId')

  if (!orderId || !jobId) {
    return NextResponse.redirect(`${appUrl}/dashboard/client`)
  }

  try {
    const admin = createAdminClient()

    // Fetch the job to get the maker's merchant ID for the capture header
    const { data: job } = await admin
      .from('jobs')
      .select('id, title, client_id, paypal_order_id')
      .eq('id', jobId)
      .single()

    if (!job) return NextResponse.redirect(`${appUrl}/dashboard/client`)

    // Get the maker's merchant ID
    const { data: quote } = await admin
      .from('quotes')
      .select('printer_id, price')
      .eq('job_id', jobId)
      .eq('status', 'accepted')
      .single()

    let makerMerchantId: string | undefined
    if (quote) {
      const { data: pp } = await admin
        .from('printer_profiles')
        .select('paypal_merchant_id, paypal_onboarding_complete')
        .eq('user_id', quote.printer_id)
        .single()
      if ((pp as any)?.paypal_onboarding_complete) {
        makerMerchantId = (pp as any)?.paypal_merchant_id
      }
    }

    const result = await capturePayPalOrder(orderId, makerMerchantId)

    if (result.status === 'COMPLETED') {
      await admin
        .from('jobs')
        .update({
          status:          'paid',
          paid_at:         new Date().toISOString(),
          paypal_order_id: orderId,
        } as any)
        .eq('id', jobId)

      // Notify the maker
      if (quote) {
        const { data: printerProfile } = await admin
          .from('profiles')
          .select('email')
          .eq('user_id', quote.printer_id)
          .single()

        if (printerProfile?.email) {
          notifyJobPaid({
            jobId,
            jobTitle:     (job as any).title,
            printerId:    quote.printer_id,
            printerEmail: printerProfile.email,
            price:        quote.price,
          }).catch(() => {})
        }
      }

      return NextResponse.redirect(`${appUrl}/jobs/${jobId}?payment=success`)
    }

    // Non-completed status — send back to job page with pending message
    return NextResponse.redirect(`${appUrl}/jobs/${jobId}?payment=pending`)
  } catch (err) {
    console.error('PayPal capture error:', err)
    return NextResponse.redirect(`${appUrl}/jobs/${jobId}?payment=error`)
  }
}
