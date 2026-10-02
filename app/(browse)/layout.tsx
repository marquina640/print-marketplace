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
        <main className="flex-1 min-w-0 p-4 sm:p-6">{children}</main>
      </div>

      {/* Footer */}
      <footer className="border-t border-warm-200 bg-warm-100 py-6 text-xs text-warm-400">
        <div className="page-container space-y-4">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/how-it-works" className="hover:text-warm-700 hover:underline">How it works</Link>
            <Link href="/for-makers"   className="hover:text-warm-700 hover:underline">For makers</Link>
            <Link href="/blog"         className="hover:text-warm-700 hover:underline">Blog</Link>
            <Link href="/faq"          className="hover:text-warm-700 hover:underline">FAQ</Link>
            <Link href="/makers"       className="hover:text-warm-700 hover:underline">Browse makers</Link>
            <Link href="/jobs"         className="hover:text-warm-700 hover:underline">Browse requests</Link>
            <a href="https://discord.com/channels/1506581479638175876/1506595983881011281" target="_blank" rel="noopener noreferrer"
              className="hover:text-warm-700 hover:underline flex items-center gap-1">
              <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Discord
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-warm-200 pt-4">
            <span>© {new Date().getFullYear()} PrintMarketHub</span>
            <Link href="/terms"          className="hover:text-warm-700 hover:underline">Terms of Service</Link>
            <Link href="/legal/privacy"  className="hover:text-warm-700 hover:underline">Privacy Policy</Link>
            <a href="mailto:admin@printmarkethub.com" className="hover:text-warm-700 hover:underline">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
