import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Run with: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=... node scripts/send-listings-launch-email.mjs
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = 'https://www.printmarkethub.com'

const { data: profiles } = await admin
  .from('profiles')
  .select('user_id, email, display_name')
  .eq('role', 'printer_owner')
  .eq('onboarding_complete', true)
  .not('email', 'ilike', '%@test.com')

const makerIds = (profiles ?? []).map(p => p.user_id)
const { data: ppRows } = await admin
  .from('printer_profiles')
  .select('user_id, display_name')
  .in('user_id', makerIds)

const ppByUser = Object.fromEntries((ppRows ?? []).map(p => [p.user_id, p]))

let sent = 0
let errors = 0

for (const p of profiles ?? []) {
  const makerName = ppByUser[p.user_id]?.display_name ?? p.display_name ?? 'there'
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#1a1625;">
      <div style="padding:32px 0 24px;">
        <img src="${APP_URL}/logo.png" alt="PrintMarketHub" style="height:32px;" />
      </div>
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;">Hey, ${makerName}</h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3d3a35;">
        We just launched something we think you'll love.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3d3a35;">
        You can now add listings to your PrintMarketHub profile: your original designs, priced and ready for people near you to buy. No waiting for a custom job request. Someone sees it, pays for it, and you arrange delivery or hand it off locally.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3d3a35;">
        The local part matters. Your customers are often just a few kilometers away. That means no complicated shipping, no waiting a week, just a quick handoff to someone in your city who wanted exactly what you already make.
      </p>
      <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#3d3a35;">
        It takes 2 minutes to go live: a photo, a title, a price, and your listing is up.
      </p>
      <a href="${APP_URL}/profile/listings" style="display:inline-block;padding:12px 24px;background:#D4A017;color:#1a1625;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;">Add your first listing</a>
      <hr style="margin:40px 0;border:none;border-top:1px solid #e8e5df;" />
      <p style="margin:0;font-size:12px;color:#9e9b94;line-height:1.6;">
        PrintMarketHub &bull;
        <a href="${APP_URL}/legal/terms" style="color:#9e9b94;">Terms</a> &bull;
        <a href="${APP_URL}/legal/privacy" style="color:#9e9b94;">Privacy</a>
      </p>
    </div>
  `

  try {
    await resend.emails.send({
      from: 'PrintMarketHub <hello@printmarkethub.com>',
      to: p.email,
      subject: 'You can now sell your designs directly on PrintMarketHub',
      html,
    })
    console.log(`✓ ${makerName} <${p.email}>`)
    sent++
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 80))
  } catch (err) {
    console.error(`✗ ${p.email}: ${err.message}`)
    errors++
  }
}

console.log(`\nDone: ${sent} sent, ${errors} errors`)
