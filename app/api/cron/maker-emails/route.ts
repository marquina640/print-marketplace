import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  emailMakerAddMachine,
  emailMakerMissingRequests,
  emailMakerSetupPayouts,
  emailPayoutsReminder,
  emailStripeIncomplete,
} from '@/lib/email'

// Called daily by Vercel Cron. Protected by CRON_SECRET.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
  const expected = process.env.CRON_SECRET ?? ''
  const secretsMatch =
    secret.length > 0 &&
    expected.length > 0 &&
    secret.length === expected.length &&
    timingSafeEqual(Buffer.from(secret), Buffer.from(expected))
  if (!secretsMatch) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()

  const { data: makers } = await admin
    .from('profiles')
    .select('user_id, email, display_name, created_at')
    .eq('role', 'printer_owner')
    .eq('onboarding_complete', true)

  if (!makers?.length) return NextResponse.json({ sent: 0 })

  const makerIds = makers.map((m) => m.user_id)

  const [
    { data: alreadySent },
    { data: machineRows },
    { data: printerProfiles },
  ] = await Promise.all([
    admin.from('email_sends').select('user_id, email_type').in('user_id', makerIds),
    admin.from('machines').select('maker_id').in('maker_id', makerIds),
    admin.from('printer_profiles')
      .select('user_id, stripe_account_id, stripe_onboarding_complete, paypal_email')
      .in('user_id', makerIds),
  ])

  const sentSet = new Set((alreadySent ?? []).map((r) => `${r.user_id}:${r.email_type}`))
  const hasSent = (userId: string, type: string) => sentSet.has(`${userId}:${type}`)

  const withMachines = new Set((machineRows ?? []).map((m) => m.maker_id))

  // Build payout status maps
  const payoutByUser = Object.fromEntries(
    (printerProfiles ?? []).map((p) => [p.user_id, p])
  )

  let sent = 0
  const newSends: { user_id: string; email_type: string }[] = []

  for (const maker of makers) {
    const { user_id, email, display_name, created_at } = maker
    const ageDays = (now.getTime() - new Date(created_at).getTime()) / 86400000
    const hasMachine = withMachines.has(user_id)

    const pp = payoutByUser[user_id]
    const stripeComplete    = !!pp?.stripe_account_id && !!pp?.stripe_onboarding_complete
    const stripeStarted     = !!pp?.stripe_account_id && !pp?.stripe_onboarding_complete
    const hasPaypal         = !!pp?.paypal_email
    const hasPayouts        = stripeComplete || hasPaypal

    // ── Machine emails ───────────────────────────────────────────────────────

    // Day 1: no machine yet
    if (ageDays >= 1 && !hasMachine && !hasSent(user_id, 'd1_add_machine')) {
      await emailMakerAddMachine({ to: email, name: display_name })
      newSends.push({ user_id, email_type: 'd1_add_machine' })
      sent++
    }

    // Day 4: still no machine
    if (ageDays >= 4 && !hasMachine && !hasSent(user_id, 'd4_missing_requests')) {
      await emailMakerMissingRequests({ to: email, name: display_name })
      newSends.push({ user_id, email_type: 'd4_missing_requests' })
      sent++
    }

    // ── Stripe incomplete (started but never finished) ────────────────────────

    if (stripeStarted && !hasSent(user_id, 'stripe_incomplete')) {
      await emailStripeIncomplete({ to: email, name: display_name })
      newSends.push({ user_id, email_type: 'stripe_incomplete' })
      sent++
    }

    // ── Payout setup reminders (only for makers with a machine) ──────────────

    if (!hasMachine || hasPayouts) continue

    // Day 7: first payout nudge
    if (ageDays >= 7 && !hasSent(user_id, 'd7_setup_payouts')) {
      await emailMakerSetupPayouts({ to: email, name: display_name })
      newSends.push({ user_id, email_type: 'd7_setup_payouts' })
      sent++
    }

    // Day 14: second nudge
    if (ageDays >= 14 && !hasSent(user_id, 'd14_setup_payouts')) {
      await emailPayoutsReminder({ to: email, name: display_name, reminderNumber: 2 })
      newSends.push({ user_id, email_type: 'd14_setup_payouts' })
      sent++
    }

    // Day 30: final push
    if (ageDays >= 30 && !hasSent(user_id, 'd30_setup_payouts')) {
      await emailPayoutsReminder({ to: email, name: display_name, reminderNumber: 3 })
      newSends.push({ user_id, email_type: 'd30_setup_payouts' })
      sent++
    }
  }

  if (newSends.length > 0) {
    await admin.from('email_sends').upsert(newSends, { onConflict: 'user_id,email_type' })
  }

  return NextResponse.json({ sent, checked: makers.length })
}
