import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import Link from 'next/link'

export default async function BrowseLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let effectiveRole: string | null = null
  let unreadMessages = 0
  let notifications: Array<{ id: string; type: string; title: string; body: string | null; link: string | null; is_read: boolean; created_at: string }> = []

  let isPreview = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('user_id', user.id).single()
    const cookieStore = await cookies()
    const previewAs = profile?.role === 'admin'
      ? cookieStore.get('admin_preview_as')?.value
      : undefined
    const viewMode = profile?.role !== 'admin' ? cookieStore.get('view_mode')?.value : undefined
    effectiveRole = previewAs ?? (viewMode === 'maker' ? 'printer_owner'
      : viewMode === 'client' ? 'client'
      : profile?.role ?? null)
    isPreview = !!previewAs
    const { count } = await supabase
      .from('messages').select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id).eq('is_read', false)
    unreadMessages = count ?? 0
    const { data: notifs } = await (supabase as any)
      .from('notifications').select('id, type, title, body, link, is_read, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
    notifications = notifs ?? []
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar
        userEmail={user?.email}
        userRole={effectiveRole}
        unreadMessages={unreadMessages}
        notifications={notifications}
        isPreview={isPreview}
      />
      {!user && (
        <div className="border-b border-[#3D3A58] bg-[#2D2845] py-2.5 text-center text-sm text-[#CEC8E4]">
          You're browsing as a guest —{' '}
          <Link href="/signup" className="font-semibold text-[#D4A017] hover:underline">
            create a free account
          </Link>
          {' '}to post requests, message makers, and more.
        </div>
      )}
      <div className="flex flex-1">
        {user && effectiveRole && (
          <Sidebar role={effectiveRole} unreadMessages={unreadMessages} />
        )}
        <main className="flex-1 min-w-0 p-6">{children}</main>
      </div>
    </div>
  )
}
