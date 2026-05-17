import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyQuoteAccepted } from '@/app/actions/notifications'

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || secret === 'sk_test_placeholder') {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = new Stripe(secret)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret ?? '')
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const jobId = session.metadata?.jobId
    if (!jobId) return NextResponse.json({ ok: true })

    const admin = createAdminClient()

    const { data: job } = await admin
      .from('jobs')
      .select('id, title, accepted_quote_id, accepted_printer_id: quotes(printer_id, price, profiles:printer_id(email, display_name))')
      .eq('id', jobId)
      .single()

    await (admin as any)
      .from('jobs')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', jobId)

    // Notify the maker
    if (job) {
      const quoteData = (job as any).accepted_printer_id?.[0]
      if (quoteData) {
        const printer = quoteData.profiles
        await notifyQuoteAccepted({
          jobId,
          jobTitle: (job as any).title,
          printerId: quoteData.printer_id,
          printerEmail: printer?.email ?? '',
          price: quoteData.price,
        })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
