'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function createUserProfile(payload: {
  email: string
  password: string
  role: 'client' | 'printer_owner'
  display_name: string
  city?: string
}): Promise<{ error?: string; userId?: string }> {
  // Verify caller is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Not authorized' }

  let admin
  try {
    admin = createAdminClient()
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Service role key not configured' }
  }

  // Create the auth user (email_confirm: true skips email verification)
  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
  })

  if (authError) return { error: authError.message }
  if (!newUser.user) return { error: 'User creation failed' }

  const uid = newUser.user.id

  // Upsert profile row (the DB trigger may have already created it)
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      user_id: uid,
      email: payload.email,
      role: payload.role,
      display_name: payload.display_name || null,
      onboarding_complete: true,
    }, { onConflict: 'user_id' })

  if (profileError) return { error: profileError.message }

  // For makers, create a starter printer_profile
  if (payload.role === 'printer_owner') {
    await admin.from('printer_profiles').upsert({
      user_id: uid,
      display_name: payload.display_name || null,
      city: payload.city || 'Zurich',
      certification_level: 0,
      materials: [],
      processes: [],
      colors: [],
      is_active: true,
    }, { onConflict: 'user_id' })
  }

  revalidatePath('/dashboard/admin/users')
  revalidatePath('/dashboard/admin')
  return { userId: uid }
}
