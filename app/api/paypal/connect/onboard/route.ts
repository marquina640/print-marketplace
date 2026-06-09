import { NextRequest, NextResponse } from 'next/server'
import { createClient }       from '@/lib/supabase/server'
import { createPartnerReferral } from '@/lib/paypal'

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const returnUrl = `${appUrl}/api/paypal/connect/return?userId=${user.id}`

    const { actionUrl } = await createPartnerReferral(user.id, returnUrl)

    return NextResponse.json({ url: actionUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('PayPal connect onboard error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
