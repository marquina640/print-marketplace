import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

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
    }
  } catch (err) {
    console.error('Stripe success handler error:', err)
  }

  // Always redirect to the job page regardless
  return NextResponse.redirect(`${appUrl}/jobs/${jobId}?payment=success`)
}
