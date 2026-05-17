import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key === 'sk_test_placeholder') {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = new Stripe(key)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { jobId } = await req.json() as { jobId: string }
  if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })

  const { data: job } = await (supabase as any)
    .from('jobs')
    .select('id, title, client_id, accepted_quote_id')
    .eq('id', jobId)
    .eq('status', 'accepted')
    .single() as { data: { id: string; title: string; client_id: string; accepted_quote_id: string } | null }

  if (!job) return NextResponse.json({ error: 'Job not found or not accepted' }, { status: 404 })
  if (job.client_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: quote } = await (supabase as any)
    .from('quotes')
    .select('price')
    .eq('id', job.accepted_quote_id)
    .single() as { data: { price: number } | null }

  if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'chf',
        product_data: { name: job.title },
        unit_amount: Math.round(quote.price * 100),
      },
      quantity: 1,
    }],
    metadata: { jobId: job.id },
    success_url: `${appUrl}/jobs/${job.id}?payment=success`,
    cancel_url: `${appUrl}/jobs/${job.id}?payment=cancelled`,
  })

  await (supabase as any).from('jobs').update({ stripe_session_id: session.id }).eq('id', jobId)

  return NextResponse.json({ url: session.url })
}
