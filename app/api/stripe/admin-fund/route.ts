import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { amount, currency = 'CHF' } = await req.json() as { amount: number; currency?: string }
  if (!amount || amount < 1) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Regular charge to the platform account — no transfer_data, funds stay on platform
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: 'PrintMarketHub — Platform top-up' },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    }],
    success_url: `${appUrl}/dashboard/admin?funded=1`,
    cancel_url:  `${appUrl}/dashboard/admin`,
  })

  return NextResponse.json({ url: session.url })
}
