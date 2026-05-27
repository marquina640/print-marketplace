import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

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

  // Find the accepted quote by status (not a column on jobs)
  const { data: quote } = await supabase
    .from('quotes')
    .select('id, price')
    .eq('job_id', jobId)
    .eq('status', 'accepted')
    .single()

  if (!quote) return NextResponse.json({ error: 'No accepted quote found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
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
