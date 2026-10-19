import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * PayPal redirects here after a maker completes (or cancels) onboarding.
 * Query params from PayPal:
 *   merchantIdInPayPal  — the seller's PayPal Merchant ID (their Payer ID)
 *   merchantId          — tracking ID we passed (same as our user_id)
 *   permissionsGranted  — "true" | "false"
 *   consentStatus       — "true" | "false"
 *   isEmailConfirmed    — "true" | "false"
 *   accountStatus       — BUSINESS_ACCOUNT | PERSONAL_ACCOUNT
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const appUrl            = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const merchantIdInPayPal = searchParams.get('merchantIdInPayPal')
  const userId             = searchParams.get('userId') ?? searchParams.get('merchantId')
  const permissionsGranted = searchParams.get('permissionsGranted') === 'true'

  // Verify the session — only update the row for the authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${appUrl}/login`)

  if (userId && merchantIdInPayPal && permissionsGranted) {
    // Reject if the userId in the callback doesn't match the authenticated session
    if (userId !== user.id) {
      console.error('PayPal connect return: userId mismatch', { userId, sessionUserId: user.id })
      return NextResponse.redirect(`${appUrl}/dashboard/printer?paypal=error`)
    }

    try {
      const admin = createAdminClient()
      await admin
        .from('printer_profiles')
        .update({
          paypal_merchant_id:         merchantIdInPayPal,
          paypal_onboarding_complete: true,
        } as any)
        .eq('user_id', user.id)
    } catch (err) {
      console.error('PayPal connect return DB error:', err)
    }

    return NextResponse.redirect(`${appUrl}/dashboard/printer?paypal=connected`)
  }

  // Permissions not granted or something went wrong
  return NextResponse.redirect(`${appUrl}/dashboard/printer?paypal=error`)
}
