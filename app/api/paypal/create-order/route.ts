import { NextRequest, NextResponse } from 'next/server'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPayPalOrder } from '@/lib/paypal'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { jobId } = await req.json() as { jobId: string }
    if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })

    const admin = createAdminClient()

    const { data: job } = await admin
      .from('jobs')
      .select('id, title, client_id, status, currency')
      .eq('id', jobId)
      .eq('status', 'accepted')
      .single()

    if (!job) return NextResponse.json({ error: 'Job not found or not in accepted state' }, { status: 404 })
    if (job.client_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: quote } = await admin
      .from('quotes')
      .select('id, price, currency')
      .eq('job_id', jobId)
      .eq('status', 'accepted')
      .single()

    if (!quote) return NextResponse.json({ error: 'No accepted quote found' }, { status: 404 })

    const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const currency = (quote as any).currency ?? (job as any).currency ?? 'CHF'

    const { orderId, approveUrl } = await createPayPalOrder({
      amountValue: quote.price.toFixed(2),
      currency,
      description: `Order: ${job.title}`,
      jobId,
      returnUrl: `${appUrl}/api/paypal/capture?jobId=${jobId}`,
      cancelUrl: `${appUrl}/jobs/${jobId}?payment=cancelled`,
    })

    // Store PayPal order ID for validation on capture
    await admin.from('jobs').update({ paypal_order_id: orderId } as any).eq('id', jobId)

    return NextResponse.json({ approveUrl })
  } catch (err) {
    console.error('PayPal create-order error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 })
  }
}
