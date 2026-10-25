import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = new Stripe(secret)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Webhook signature error:', msg)
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 })
  }

  // When Stripe approves or restricts a connected account, update onboarding status
  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    const complete = account.details_submitted && (account.charges_enabled || account.payouts_enabled)
    await createAdminClient()
      .from('printer_profiles')
      .update({ stripe_onboarding_complete: complete } as any)
      .eq('stripe_account_id', account.id)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const jobId = session.metadata?.jobId
    if (!jobId) {
      console.error('Webhook: no jobId in session metadata')
      return NextResponse.json({ ok: true })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('jobs')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_session_id: session.id,
      } as any)
      .eq('id', jobId)

    if (error) {
      console.error('Webhook DB update error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Job ${jobId} marked as paid`)
  }

  return NextResponse.json({ ok: true })
}
