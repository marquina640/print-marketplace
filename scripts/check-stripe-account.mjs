import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const { data } = await admin
  .from('printer_profiles')
  .select('user_id, display_name, stripe_account_id, stripe_onboarding_complete, country')
  .eq('user_id', (await admin.from('profiles').select('user_id').eq('email', 'am3dproduction@gmail.com').single()).data?.user_id)

console.log(data)
