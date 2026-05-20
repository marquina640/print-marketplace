import Link from 'next/link'

const LEGAL_NAV = [
  { href: '/legal/terms',          label: 'Terms of Service' },
  { href: '/legal/privacy',        label: 'Privacy Policy' },
  { href: '/legal/cookies',        label: 'Cookie Policy' },
  { href: '/legal/impressum',      label: 'Impressum' },
  { href: '/legal/acceptable-use', label: 'Acceptable Use Policy' },
  { href: '/legal/maker-terms',    label: 'Maker / Seller Terms' },
  { href: '/legal/refunds',        label: 'Refund & Dispute Policy' },
]

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-warm-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-ink-950 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-white text-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gold-400">
              <svg className="h-3.5 w-3.5 text-ink-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            PrintMarketHub
          </Link>
          <Link href="/" className="text-xs text-warm-400 hover:text-white transition-colors flex items-center gap-1">
            ← Back to site
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-[10px] font-bold uppercase tracking-widest text-warm-400 mb-3 px-3">Legal Documents</p>
              <nav className="space-y-0.5">
                {LEGAL_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 rounded-lg text-sm text-warm-600 hover:bg-warm-200 hover:text-ink-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Page content */}
          <main className="min-w-0">{children}</main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-warm-200 bg-white py-8 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-warm-400">
          <span>© 2025 PrintMarketHub · Switzerland</span>
          <div className="flex gap-5">
            {LEGAL_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-ink-900 transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
