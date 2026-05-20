import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { PreviewBanner } from '@/components/layout/preview-banner'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name, email, onboarding_complete')
    .eq('user_id', user.id)
    .single()

  if (!profile?.role) redirect('/onboarding')

  // Middleware handles the /profile/setup redirect for incomplete printer owners.
  // The layout must NOT repeat that check or /profile/setup would redirect to itself.

  const cookieStore = await cookies()
  const previewAs = profile.role === 'admin'
    ? (cookieStore.get('admin_preview_as')?.value as 'client' | 'printer_owner' | undefined)
    : undefined
  const previewUserId = profile.role === 'admin'
    ? cookieStore.get('admin_preview_user_id')?.value
    : undefined
  const viewModeCookie = profile.role !== 'admin' ? cookieStore.get('view_mode')?.value : undefined
  const viewModeRole = viewModeCookie === 'maker' ? 'printer_owner' : viewModeCookie === 'client' ? 'client' : null
  const effectiveRole = previewAs ?? viewModeRole ?? profile.role

  // When previewing as a specific user, fetch their name for the banner
  const { data: previewUserProfile } = previewUserId
    ? await supabase.from('profiles').select('display_name, email').eq('user_id', previewUserId).single()
    : { data: null }
  const previewUserName = previewUserProfile?.display_name ?? previewUserProfile?.email?.split('@')[0]

  // Unread messages: received by this user, not yet read
  const { count: unreadMessages } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .eq('is_read', false)

  // Recent notifications (last 10)
  const { data: notifications } = await (supabase as any)
    .from('notifications')
    .select('id, type, title, body, link, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10) as { data: Array<{ id: string; type: string; title: string; body: string | null; link: string | null; is_read: boolean; created_at: string }> | null }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar userEmail={user.email} userRole={effectiveRole} unreadMessages={unreadMessages ?? 0} notifications={notifications ?? []} />
      {previewAs && <PreviewBanner role={previewAs} userName={previewUserName} />}
      <div className="flex flex-1">
        <Sidebar role={effectiveRole} unreadMessages={unreadMessages ?? 0} />
        <main className="flex-1 min-w-0 p-6">{children}</main>
      </div>
    </div>
  )
}
