import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConnectedAccountStatus } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const accountId = new URL(req.url).searchParams.get('accountId')
    if (!accountId) return NextResponse.json({ connected: false, detailsSubmitted: false })

    const status = await getConnectedAccountStatus(accountId)
    return NextResponse.json({
      connected:        status.chargesEnabled && status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
    })
  } catch {
    return NextResponse.json({ connected: false, detailsSubmitted: false })
  }
}
