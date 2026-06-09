import { NextRequest, NextResponse } from 'next/server'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPayPalOrder } from '@/lib/paypal'
import { cookies }           from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Support admin preview mode
    const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
    const cookieStore  = await cookies()
    const previewUserId = profile?.role === 'admin' ? cookieStore.get('admin_preview_user_id')?.value : undefined
    const effectiveUserId = previewUserId ?? user.id

    const { jobId } = await req.json() as { jobId: string }
    if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })

    const admin = createAdminClient()

    const { data: job } = await admin
      .from('jobs')
      .select('id, title, client_id')
      .eq('id', jobId)
      .eq('status', 'accepted')
      .single()

    if (!job) return NextResponse.json({ error: 'Job not found or not in accepted state' }, { status: 404 })
    if (job.client_id !== effectiveUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: quote } = await admin
      .from('quotes')
      .select('id, price, printer_id')
      .eq('job_id', jobId)
      .eq('status', 'accepted')
      .single()

    if (!quote) return NextResponse.json({ error: 'No accepted quote found' }, { status: 404 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Method 2: full amount goes to our PayPal account; maker is paid out on delivery
    const { orderId, approveUrl } = await createPayPalOrder({
      amountValue: quote.price.toFixed(2),
      currency:    'CHF',
      description: `3D Print: ${job.title}`,
      jobId,
      returnUrl:   `${appUrl}/api/paypal/orders/capture?jobId=${jobId}`,
      cancelUrl:   `${appUrl}/jobs/${jobId}?payment=cancelled`,
    })

    // Persist the order ID on the job so we can capture it on return
    await admin
      .from('jobs')
      .update({ paypal_order_id: orderId } as any)
      .eq('id', jobId)

    return NextResponse.json({ url: approveUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('PayPal order create error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
