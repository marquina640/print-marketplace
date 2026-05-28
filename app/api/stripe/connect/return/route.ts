import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('account')
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (accountId) {
    try {
      const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const admin   = createAdminClient()
      const account = await stripe.accounts.retrieve(accountId)

      await admin
        .from('printer_profiles')
        .update({ stripe_onboarding_complete: account.details_submitted } as any)
        .eq('stripe_account_id', accountId)
    } catch (err) {
      console.error('Stripe Connect return error:', err)
    }
  }

  return NextResponse.redirect(`${appUrl}/dashboard/printer?stripe=connected`)
}
