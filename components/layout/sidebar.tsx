'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
}

function NavLink({ href, label, icon, badge }: NavItem) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-ink-900 text-white'
          : 'text-warm-500 hover:bg-warm-100 hover:text-ink-900'
      )}
    >
      <span className={cn('h-4 w-4 flex-shrink-0', active ? 'text-gold-400' : 'text-warm-400')}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}

const icons = {
  map: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  home: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  briefcase: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  plus: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  chat: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  search: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  user: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  cog: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  users: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
}

const clientNav: NavItem[] = [
  { href: '/dashboard/client', label: 'Dashboard',      icon: icons.home     },
  { href: '/jobs/new',         label: 'Post a Job',     icon: icons.plus     },
  { href: '/makers',           label: 'Browse Makers',  icon: icons.search   },
  { href: '/map',              label: 'Map',            icon: icons.map      },
  { href: '/messages',         label: 'Messages',       icon: icons.chat     },
  { href: '/profile/client',   label: 'My Profile',     icon: icons.user     },
]

const printerNav: NavItem[] = [
  { href: '/dashboard/printer',       label: 'Dashboard',     icon: icons.home      },
  { href: '/jobs',                    label: 'Browse Jobs',   icon: icons.search    },
  { href: '/map',                     label: 'Map',           icon: icons.map       },
  { href: '/messages',                label: 'Messages',      icon: icons.chat      },
  { href: '/profile/machines',        label: 'Machines',      icon: icons.cog       },
  { href: '/profile/portfolio',       label: 'Portfolio',     icon: icons.briefcase },
  { href: '/profile/certification',   label: 'Certification', icon: icons.users     },
  { href: '/profile/setup',           label: 'Settings',      icon: icons.user      },
]

const adminNav: NavItem[] = [
  { href: '/dashboard/admin',                 label: 'Dashboard',    icon: icons.home      },
  { href: '/dashboard/admin/certifications',  label: 'Certifications', icon: icons.users   },
  { href: '/dashboard/admin/users',           label: 'Users',        icon: icons.users     },
  { href: '/dashboard/admin/jobs',            label: 'Jobs',         icon: icons.briefcase },
  { href: '/dashboard/admin/settings',        label: 'Settings',     icon: icons.cog       },
]

export function Sidebar({ role, unreadMessages = 0 }: { role: string; unreadMessages?: number }) {
  const baseNav =
    role === 'client' ? clientNav
    : role === 'printer_owner' ? printerNav
    : adminNav

  const navItems = baseNav.map((item) =>
    item.href === '/messages' ? { ...item, badge: unreadMessages } : item
  )

  const roleLabel =
    role === 'client' ? 'Client'
    : role === 'printer_owner' ? 'Maker'
    : 'Admin'

  return (
    <aside className="hidden lg:flex w-52 flex-col border-r border-warm-200 bg-white px-3 py-5 gap-0.5">
      <p className="px-3 mb-4 text-[10px] font-bold text-warm-400 uppercase tracking-widest">
        {roleLabel}
      </p>
      {navItems.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}
    </aside>
  )
}
