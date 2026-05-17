'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { markNotificationsRead } from '@/app/actions/notifications'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

interface NavbarProps {
  userEmail?: string | null
  userRole?: string | null
  unreadMessages?: number
  notifications?: Notification[]
}

const clientNav = [
  { href: '/dashboard/client', label: 'Dashboard' },
  { href: '/jobs/new',         label: 'Post a Job' },
  { href: '/makers',           label: 'Browse Makers' },
  { href: '/map',              label: 'Map' },
  { href: '/messages',         label: 'Messages' },
  { href: '/profile/client',   label: 'My Profile' },
]

const printerNav = [
  { href: '/dashboard/printer',     label: 'Dashboard' },
  { href: '/jobs',                  label: 'Browse Jobs' },
  { href: '/map',                   label: 'Map' },
  { href: '/messages',              label: 'Messages' },
  { href: '/profile/machines',      label: 'Machines' },
  { href: '/profile/portfolio',     label: 'Portfolio' },
  { href: '/profile/certification', label: 'Certification' },
  { href: '/profile/setup',         label: 'Settings' },
]

const adminNav = [
  { href: '/dashboard/admin',                label: 'Dashboard' },
  { href: '/dashboard/admin/certifications', label: 'Certifications' },
  { href: '/dashboard/admin/users',          label: 'Users' },
  { href: '/dashboard/admin/jobs',           label: 'Jobs' },
  { href: '/dashboard/admin/settings',       label: 'Settings' },
]

export function Navbar({ userEmail, userRole, unreadMessages = 0, notifications = [] }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const unreadNotifications = notifications.filter((n) => !n.is_read)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleBellOpen() {
    setBellOpen((v) => !v)
    if (!bellOpen && unreadNotifications.length > 0) {
      await markNotificationsRead(unreadNotifications.map((n) => n.id))
      router.refresh()
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const dashboardHref =
    userRole === 'printer_owner' ? '/dashboard/printer'
    : userRole === 'admin'       ? '/dashboard/admin'
    : '/dashboard/client'

  const mobileNav =
    userRole === 'client'        ? clientNav
    : userRole === 'printer_owner' ? printerNav
    : userRole === 'admin'       ? adminNav
    : []

  return (
    <header className="sticky top-0 z-40 border-b border-warm-200 bg-white/95 backdrop-blur-sm">
      <div className="page-container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-ink-900 text-base tracking-tight">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-ink-900">
            <svg className="h-3.5 w-3.5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          PrintMarket
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {userEmail ? (
            <>
              <Link href={dashboardHref}
                className="px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-ink-900 hover:bg-warm-100 rounded-lg transition-colors">
                Dashboard
              </Link>
              {userRole === 'printer_owner' && (
                <Link href="/jobs"
                  className="px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-ink-900 hover:bg-warm-100 rounded-lg transition-colors">
                  Browse Jobs
                </Link>
              )}
              {userRole === 'client' && (
                <Link href="/jobs/new"
                  className="px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-ink-900 hover:bg-warm-100 rounded-lg transition-colors">
                  Post a Job
                </Link>
              )}
              {/* Messages with bell badge */}
              <Link href="/messages"
                className="relative px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-ink-900 hover:bg-warm-100 rounded-lg transition-colors flex items-center gap-1.5">
                Messages
                {unreadMessages > 0 && (
                  <span className="rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </Link>
              {/* Notification bell */}
              <div ref={bellRef} className="relative">
                <button
                  onClick={handleBellOpen}
                  className="relative p-2 rounded-lg text-warm-500 hover:bg-warm-100 transition-colors"
                  aria-label="Notifications"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifications.length > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-2xl border border-warm-200 shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-warm-100">
                      <p className="text-sm font-semibold text-ink-900">Notifications</p>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-warm-400 text-center">No notifications yet.</p>
                    ) : (
                      <ul className="divide-y divide-warm-50 max-h-80 overflow-y-auto">
                        {notifications.map((n) => (
                          <li key={n.id}>
                            {n.link ? (
                              <Link href={n.link} onClick={() => setBellOpen(false)}
                                className={cn('block px-4 py-3 hover:bg-warm-50 transition-colors', !n.is_read && 'bg-blue-50/60')}>
                                <p className="text-sm font-medium text-ink-900">{n.title}</p>
                                {n.body && <p className="text-xs text-warm-500 mt-0.5">{n.body}</p>}
                              </Link>
                            ) : (
                              <div className={cn('px-4 py-3', !n.is_read && 'bg-blue-50/60')}>
                                <p className="text-sm font-medium text-ink-900">{n.title}</p>
                                {n.body && <p className="text-xs text-warm-500 mt-0.5">{n.body}</p>}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pl-2 ml-1 border-l border-warm-200">
                <span className="text-xs text-warm-400 truncate max-w-[140px] hidden xl:block">{userEmail}</span>
                <Button variant="outline" size="sm" onClick={handleSignOut} loading={signingOut}>
                  Sign out
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button variant="gold" size="sm">Get started</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile right side */}
        <div className="lg:hidden flex items-center gap-1">
          {userEmail && unreadNotifications.length > 0 && (
            <button onClick={handleBellOpen} className="relative p-2 rounded-lg text-warm-500 hover:bg-warm-100 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
            </button>
          )}
          {userEmail && unreadMessages > 0 && (
            <Link href="/messages" className="relative p-2 rounded-lg text-warm-500 hover:bg-warm-100 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
            </Link>
          )}
          <button
            className="p-2 rounded-lg text-warm-500 hover:bg-warm-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu — full role-based nav */}
      {menuOpen && (
        <div className="lg:hidden border-t border-warm-100 bg-white px-4 py-3 space-y-0.5 max-h-[80vh] overflow-y-auto">
          {userEmail ? (
            <>
              {mobileNav.map((item) => {
                const isMessages = item.href === '/messages'
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-colors',
                      active ? 'bg-ink-900 text-white' : 'text-warm-700 hover:bg-warm-50'
                    )}
                  >
                    <span>{item.label}</span>
                    {isMessages && unreadMessages > 0 && (
                      <span className="rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
                        {unreadMessages > 99 ? '99+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                )
              })}
              <div className="pt-3 mt-2 border-t border-warm-100">
                <p className="text-xs text-warm-400 px-3 mb-2 truncate">{userEmail}</p>
                <Button variant="outline" size="sm" onClick={handleSignOut} loading={signingOut} className="w-full">
                  Sign out
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-1">
              <Link href="/login" className="block"><Button variant="outline" className="w-full" onClick={() => setMenuOpen(false)}>Log in</Button></Link>
              <Link href="/signup" className="block"><Button variant="gold" className="w-full" onClick={() => setMenuOpen(false)}>Get started</Button></Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
