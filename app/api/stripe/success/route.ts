import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyJobPaid } from '@/app/actions/notifications'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')
  const jobId     = searchParams.get('jobId')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!sessionId || !jobId) {
    return NextResponse.redirect(`${appUrl}/dashboard/client`)
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === 'paid') {
      const admin = createAdminClient()
      await admin
        .from('jobs')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_session_id: sessionId,
        } as any)
        .eq('id', jobId)

      // Notify the maker that payment came in
      const { data: job } = await admin
        .from('jobs')
        .select('title')
        .eq('id', jobId)
        .single()

      const { data: acceptedQuote } = await admin
        .from('quotes')
        .select('printer_id, price')
        .eq('job_id', jobId)
        .eq('status', 'accepted')
        .single()

      if (job && acceptedQuote) {
        const { data: printerProfile } = await admin
          .from('profiles')
          .select('email')
          .eq('user_id', acceptedQuote.printer_id)
          .single()

        if (printerProfile?.email) {
          notifyJobPaid({
            jobId,
            jobTitle:     job.title,
            printerId:    acceptedQuote.printer_id,
            printerEmail: printerProfile.email,
            price:        acceptedQuote.price,
          }).catch(() => {})
        }
      }
    }
  } catch (err) {
    console.error('Stripe success handler error:', err)
  }

  // Always redirect to the job page regardless
  return NextResponse.redirect(`${appUrl}/jobs/${jobId}?payment=success`)
}
