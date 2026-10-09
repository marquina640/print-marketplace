'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { stripe } from '@/lib/stripe'
import { toCents } from '@/lib/stripe'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not admin')
}

export async function createReferralCode(input: {
  code: string
  influencer_name: string
  influencer_email: string | null
  instagram_handle: string | null
  referred_maker_commission_months: number | null
}): Promise<{ error?: string; code?: any }> {
  try {
    await assertAdmin()
    const admin = createAdminClient()
    const { data, error } = await admin.from('referral_codes').insert(input).select().single()
    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin')
    return { code: data }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function activateReferralWaiver(
  codeId: string,
  tier: string,
): Promise<{ error?: string }> {
  try {
    await assertAdmin()

    const tierMonths: Record<string, number> = { story: 1, post: 2, reel: 4 }
    const months = tierMonths[tier]
    if (!months) return { error: 'Invalid tier' }

    const admin = createAdminClient()

    // Get the referral code to find the influencer's email
    const { data: rc } = await admin.from('referral_codes').select('*').eq('id', codeId).single()
    if (!rc) return { error: 'Referral code not found' }

    // Mark the code as activated with the tier
    await admin.from('referral_codes').update({
      tier,
      fee_waiver_months: months,
      waiver_activated: true,
    }).eq('id', codeId)

    // If the influencer has an email, find their printer_profile and set the waiver
    if ((rc as any).influencer_email) {
      const { data: profile } = await admin
        .from('profiles')
        .select('user_id')
        .eq('email', (rc as any).influencer_email)
        .single()

      if (profile) {
        const waiverUntil = new Date()
        waiverUntil.setMonth(waiverUntil.getMonth() + months)

        await admin.from('printer_profiles').upsert({
          user_id: profile.user_id,
          fee_waiver_until: waiverUntil.toISOString(),
        } as any, { onConflict: 'user_id' })
      }
    }

    revalidatePath('/dashboard/admin')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function payOutCommissions(
  referralCode: string,
): Promise<{ error?: string; amountPaid?: number }> {
  try {
    await assertAdmin()
    const admin = createAdminClient()

    // Get all unpaid commissions for this code
    const { data: commissions } = await admin
      .from('referral_commissions' as any)
      .select('*')
      .eq('referral_code', referralCode)
      .eq('paid_out', false)

    if (!commissions || commissions.length === 0) return { error: 'No pending commissions for this code.' }

    // Find the influencer's Stripe account via their email
    const { data: rc } = await admin.from('referral_codes').select('influencer_email').eq('code', referralCode).single()
    if (!(rc as any)?.influencer_email) return { error: 'No email on this referral code.' }

    const { data: influencerProfile } = await admin
      .from('profiles').select('user_id').eq('email', (rc as any).influencer_email).single()
    if (!influencerProfile) return { error: 'Influencer has no account on the platform yet.' }

    const { data: influencerPrinterProfile } = await admin
      .from('printer_profiles').select('stripe_account_id').eq('user_id', influencerProfile.user_id).single()
    const stripeAccountId = (influencerPrinterProfile as any)?.stripe_account_id as string | null
    if (!stripeAccountId) return { error: 'Influencer has not connected Stripe yet.' }

    // Group commissions by currency and make one transfer per currency
    const byCurrency = (commissions as any[]).reduce<Record<string, { total: number; ids: string[] }>>((acc, c) => {
      const cur = (c.currency as string | null) ?? 'CHF'
      const amount = Number(c.commission_amount ?? c.commission_chf)
      if (!acc[cur]) acc[cur] = { total: 0, ids: [] }
      acc[cur].total += amount
      acc[cur].ids.push(c.id)
      return acc
    }, {})

    let totalPaid = 0
    const now = new Date().toISOString()

    for (const [currency, { total, ids }] of Object.entries(byCurrency)) {
      if (total <= 0) continue
      const transfer = await stripe.transfers.create({
        amount:      toCents(total, currency),
        currency:    currency.toLowerCase(),
        destination: stripeAccountId,
        metadata:    { referralCode, type: 'affiliate_commission', currency },
      })
      await admin.from('referral_commissions' as any)
        .update({ paid_out: true, paid_out_at: now, stripe_transfer_id: transfer.id })
        .in('id', ids)
      totalPaid += total
    }

    if (totalPaid <= 0) return { error: 'Total commission is zero.' }

    revalidatePath('/dashboard/admin')
    return { amountPaid: totalPaid }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
