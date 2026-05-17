import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardRedirect() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const roleMap: Record<string, string> = {
    client: '/dashboard/client',
    printer_owner: '/dashboard/printer',
    admin: '/dashboard/admin',
  }

  redirect(roleMap[profile?.role ?? ''] ?? '/onboarding')
}
