import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const { data: makers } = await admin
  .from('profiles')
  .select('user_id, email, display_name, is_test')
  .eq('role', 'printer_owner')
  .eq('onboarding_complete', true)

console.log(`Total onboarded makers: ${makers?.length ?? 0}`)
console.log()
for (const m of makers ?? []) {
  console.log(`${m.is_test ? '[TEST] ' : ''}${m.display_name ?? '(no name)'} <${m.email}>`)
}
