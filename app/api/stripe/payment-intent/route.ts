import { NextRequest, NextResponse } from 'next/server'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPaymentIntent } from '@/lib/stripe'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
    const cookieStore = await cookies()
    const previewUserId = profile?.role === 'admin' ? cookieStore.get('admin_preview_user_id')?.value : undefined
    const effectiveUserId = previewUserId ?? user.id

    const { jobId } = await req.json() as { jobId: string }
    if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })

    const admin = createAdminClient()

    const { data: job } = await admin
      .from('jobs')
      .select('id, title, client_id, status')
      .eq('id', jobId)
      .eq('status', 'accepted')
      .single()

    if (!job) return NextResponse.json({ error: 'Job not found or not in accepted state' }, { status: 404 })
    if (job.client_id !== effectiveUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: quote } = await admin
      .from('quotes')
      .select('id, price')
      .eq('job_id', jobId)
      .eq('status', 'accepted')
      .single()

    if (!quote) return NextResponse.json({ error: 'No accepted quote found' }, { status: 404 })

    const { clientSecret, paymentIntentId } = await createPaymentIntent(
      quote.price,
      jobId,
      job.title,
    )

    // Persist payment intent ID so we can confirm it later
    await admin.from('jobs').update({ paypal_order_id: paymentIntentId } as any).eq('id', jobId)

    return NextResponse.json({ clientSecret })
  } catch (err) {
    console.error('Stripe payment intent error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
  }
}
