import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const accountIdParam = searchParams.get('account')
  const isRefresh      = searchParams.get('refresh') === '1'
  const appUrl         = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${appUrl}/login`)

  const admin = createAdminClient()

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    // Look up the account ID from DB for the authenticated user (more secure than URL param)
    const { data: pp } = await admin
      .from('printer_profiles')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single()

    const accountId = (pp as any)?.stripe_account_id as string | null ?? accountIdParam

    if (accountId) {
      const account = await stripe.accounts.retrieve(accountId)
      const complete = account.details_submitted && (account.charges_enabled || account.payouts_enabled)

      await admin
        .from('printer_profiles')
        .update({ stripe_onboarding_complete: complete } as any)
        .eq('stripe_account_id', accountId)
        .eq('user_id', user.id)
    }
  } catch (err) {
    console.error('Stripe Connect return error:', err)
  }

  if (isRefresh) {
    // Refresh means the link expired — restart onboarding
    return NextResponse.redirect(`${appUrl}/profile/setup?stripe=refresh`)
  }
  return NextResponse.redirect(`${appUrl}/dashboard/printer?stripe=connected`)
}
