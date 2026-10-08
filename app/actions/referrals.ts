'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

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
