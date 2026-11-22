import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getChargeForPaymentIntent, transferToMaker, PLATFORM_FEE_PERCENT } from '@/lib/stripe'

const JOB_ID = 'ce1f0d26-e883-4d51-8eac-b4a330552e97'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Not admin' }, { status: 403 })

  const admin = createAdminClient()
  const { data: job } = await admin.from('jobs').select('*').eq('id', JOB_ID).single()
  const { data: quote } = await admin.from('quotes').select('printer_id, price, currency').eq('job_id', JOB_ID).eq('status', 'accepted').single()
  const { data: pp } = await admin.from('printer_profiles').select('stripe_account_id').eq('user_id', (quote as any)?.printer_id).single()

  const piId = (job as any)?.paypal_order_id as string
  const chargeId = piId?.startsWith('pi_') ? await getChargeForPaymentIntent(piId) : null
  const stripeAccount = (pp as any)?.stripe_account_id as string
  const currency = (quote as any)?.currency ?? 'CHF'
  const price = (quote as any)?.price

  const info = { piId, chargeId, stripeAccount, currency, price, jobStatus: (job as any)?.status }

  try {
    const transferId = await transferToMaker(price, stripeAccount, JOB_ID, (job as any)?.title, PLATFORM_FEE_PERCENT, currency, chargeId ?? undefined)
    return NextResponse.json({ success: true, transferId, info })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err), info })
  }
}
