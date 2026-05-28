import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { PLATFORM_FEE_PERCENT } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key === 'sk_test_placeholder') {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = new Stripe(key)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Support admin preview mode
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  const cookieStore = await cookies()
  const previewUserId = profile?.role === 'admin' ? cookieStore.get('admin_preview_user_id')?.value : undefined
  const effectiveUserId = previewUserId ?? user.id

  const { jobId } = await req.json() as { jobId: string }
  if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, client_id')
    .eq('id', jobId)
    .eq('status', 'accepted')
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found or not in accepted state' }, { status: 404 })
  if (job.client_id !== effectiveUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Find the accepted quote (include printer_id for Connect payout)
  const { data: quote } = await supabase
    .from('quotes')
    .select('id, price, printer_id')
    .eq('job_id', jobId)
    .eq('status', 'accepted')
    .single()

  if (!quote) return NextResponse.json({ error: 'No accepted quote found' }, { status: 404 })

  // Look up the maker's Stripe Connect account
  const { data: printerProfile } = await supabase
    .from('printer_profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('user_id', quote.printer_id)
    .single()

  const makerAccountId      = (printerProfile as any)?.stripe_account_id as string | undefined
  const makerPayoutsEnabled = (printerProfile as any)?.stripe_onboarding_complete === true

  if (!makerAccountId || !makerPayoutsEnabled) {
    return NextResponse.json({
      error: 'The maker has not connected their Stripe account yet. Ask them to complete their payment setup before you can pay.',
    }, { status: 400 })
  }

  const appUrl        = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const totalCents    = Math.round(quote.price * 100)
  const feeCents      = Math.round(totalCents * PLATFORM_FEE_PERCENT)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'chf',
        product_data: { name: job.title },
        unit_amount: totalCents,
      },
      quantity: 1,
    }],
    payment_intent_data: {
      application_fee_amount: feeCents,
      transfer_data: { destination: makerAccountId },
    },
    metadata: { jobId: job.id },
    success_url: `${appUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}&jobId=${job.id}`,
    cancel_url:  `${appUrl}/jobs/${job.id}?payment=cancelled`,
  })

  await (supabase as any).from('jobs').update({ stripe_session_id: session.id }).eq('id', jobId)

  return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Stripe checkout error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
