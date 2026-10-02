import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  emailMakerAddMachine,
  emailMakerMissingRequests,
  emailMakerSetupPayouts,
} from '@/lib/email'

// Called daily by Vercel Cron. Protected by CRON_SECRET.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()

  // Fetch all maker profiles with their email and creation time
  const { data: makers } = await admin
    .from('profiles')
    .select('user_id, email, display_name, created_at')
    .eq('role', 'printer_owner')
    .eq('onboarding_complete', true)

  if (!makers?.length) return NextResponse.json({ sent: 0 })

  const makerIds = makers.map((m) => m.user_id)

  // Fetch which emails have already been sent
  const { data: alreadySent } = await admin
    .from('email_sends')
    .select('user_id, email_type')
    .in('user_id', makerIds)

  const sentSet = new Set((alreadySent ?? []).map((r) => `${r.user_id}:${r.email_type}`))
  const hasSent = (userId: string, type: string) => sentSet.has(`${userId}:${type}`)

  // Fetch which makers have machines
  const { data: machineRows } = await admin
    .from('machines')
    .select('maker_id')
    .in('maker_id', makerIds)
  const withMachines = new Set((machineRows ?? []).map((m) => m.maker_id))

  // Fetch which makers have Stripe connected
  const { data: stripeRows } = await admin
    .from('printer_profiles')
    .select('user_id, stripe_account_id')
    .in('user_id', makerIds)
  const withStripe = new Set(
    (stripeRows ?? []).filter((r) => r.stripe_account_id).map((r) => r.user_id)
  )

  let sent = 0
  const newSends: { user_id: string; email_type: string }[] = []

  for (const maker of makers) {
    const { user_id, email, display_name, created_at } = maker
    const ageMs = now.getTime() - new Date(created_at).getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)
    const hasMachine = withMachines.has(user_id)
    const hasStripe = withStripe.has(user_id)

    // Day 1: no machine → "Add your printer"
    if (ageDays >= 1 && !hasMachine && !hasSent(user_id, 'd1_add_machine')) {
      await emailMakerAddMachine({ to: email, name: display_name })
      newSends.push({ user_id, email_type: 'd1_add_machine' })
      sent++
    }

    // Day 4: still no machine → "Missing requests"
    if (ageDays >= 4 && !hasMachine && !hasSent(user_id, 'd4_missing_requests')) {
      await emailMakerMissingRequests({ to: email, name: display_name })
      newSends.push({ user_id, email_type: 'd4_missing_requests' })
      sent++
    }

    // Day 7: has machine but no Stripe → "Set up payouts"
    if (ageDays >= 7 && hasMachine && !hasStripe && !hasSent(user_id, 'd7_setup_payouts')) {
      await emailMakerSetupPayouts({ to: email, name: display_name })
      newSends.push({ user_id, email_type: 'd7_setup_payouts' })
      sent++
    }
  }

  // Record all sends (ignore conflicts — unique constraint prevents duplicates)
  if (newSends.length > 0) {
    await admin.from('email_sends').upsert(newSends, { onConflict: 'user_id,email_type' })
  }

  return NextResponse.json({ sent, checked: makers.length })
}
