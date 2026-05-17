import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-warm-50 font-sans">

      {/* ── Navbar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-warm-200/60 bg-warm-50/90 backdrop-blur-md">
        <div className="page-container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-ink-900 text-lg tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-ink-900">
              <svg className="h-4 w-4 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            PrintMarket
          </div>
          <nav className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard">
                <Button variant="gold" size="sm">Dashboard →</Button>
              </Link>
            ) : (
              <>
                <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
                <Link href="/signup"><Button variant="primary" size="sm">Get started</Button></Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        {/* Geometric background lines */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fbbf24 1px, transparent 1px), linear-gradient(to right, #fbbf24 1px, transparent 1px)',
            backgroundSize: '64px 64px'
          }} />
        {/* Gold accent bar */}
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />

        <div className="page-container relative py-28 lg:py-36">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold-400">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-pulse" />
              Zurich's 3D Printing Marketplace
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter text-white mb-6">
              Your part,<br />
              <span className="text-gold-400">printed.</span>
            </h1>

            <p className="text-xl text-warm-400 max-w-xl mb-10 leading-relaxed">
              Connect with skilled 3D printer owners across Zurich. Post a job, get competitive quotes, and get it made — fast.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup?role=client">
                <Button variant="gold" size="lg">Post a Job →</Button>
              </Link>
              <Link href="/signup?role=printer_owner">
                <Button size="lg" className="bg-white/10 text-white border border-white/20 hover:bg-white/20">
                  Offer Printing Services
                </Button>
              </Link>
            </div>

            <p className="mt-5 text-xs text-warm-600 uppercase tracking-widest">Free to join · No credit card required</p>
          </div>
        </div>

        {/* Bottom divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-warm-700 to-transparent" />
      </section>

      {/* ── Stats bar ──────────────────────────────────── */}
      <section className="bg-ink-900 text-white">
        <div className="page-container py-5">
          <div className="grid grid-cols-3 divide-x divide-warm-700">
            {[
              { value: 'Zurich', label: 'Based in' },
              { value: 'FDM · SLA · SLS', label: 'Technologies' },
              { value: '24h', label: 'Avg. first quote' },
            ].map((s) => (
              <div key={s.label} className="px-8 first:pl-0 last:pr-0 text-center">
                <p className="text-lg font-bold text-gold-400">{s.value}</p>
                <p className="text-xs text-warm-500 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────── */}
      <section className="py-24 bg-warm-50">
        <div className="page-container">
          <div className="mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-600 mb-3">How it works</p>
            <h2 className="text-4xl font-black text-ink-950 tracking-tight leading-tight">
              Simple for clients.<br />Powerful for makers.
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Client */}
            <div className="rounded-2xl border border-warm-200 bg-white p-8">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-ink-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                For Clients
              </div>
              <div className="space-y-6">
                {[
                  { n: '01', title: 'Post a Job', desc: 'Describe your part, upload your 3D file, set your budget.' },
                  { n: '02', title: 'Receive Quotes', desc: 'Printer owners review your job and send competitive bids with photos.' },
                  { n: '03', title: 'Accept & Print', desc: 'Pick the best quote, message directly, and get it made.' },
                ].map((s) => (
                  <div key={s.n} className="flex gap-4">
                    <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-gold-400 flex items-center justify-center text-xs font-black text-ink-950">
                      {s.n}
                    </div>
                    <div>
                      <p className="font-bold text-ink-900">{s.title}</p>
                      <p className="text-sm text-warm-500 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-warm-100">
                <Link href="/signup?role=client">
                  <Button variant="gold" className="w-full">Post Your First Job</Button>
                </Link>
              </div>
            </div>

            {/* Printer */}
            <div className="rounded-2xl border border-ink-800 bg-ink-950 p-8 text-white">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gold-500/20 border border-gold-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold-400">
                For Makers
              </div>
              <div className="space-y-6">
                {[
                  { n: '01', title: 'Build Your Profile', desc: 'List your printers, materials, and service area in minutes.' },
                  { n: '02', title: 'Browse Open Jobs', desc: 'See jobs nearby that match your printer and materials.' },
                  { n: '03', title: 'Win Quotes', desc: 'Submit competitive bids, attach a preview photo, grow your business.' },
                ].map((s) => (
                  <div key={s.n} className="flex gap-4">
                    <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-gold-400 flex items-center justify-center text-xs font-black text-ink-950">
                      {s.n}
                    </div>
                    <div>
                      <p className="font-bold text-white">{s.title}</p>
                      <p className="text-sm text-warm-500 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-warm-800">
                <Link href="/signup?role=printer_owner">
                  <Button className="w-full bg-white text-ink-900 hover:bg-warm-100">Start Earning Today</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section className="py-24 bg-ink-950 text-white">
        <div className="page-container">
          <div className="mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-3">Platform features</p>
            <h2 className="text-4xl font-black text-white tracking-tight">Built for designers.<br />Trusted by makers.</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-warm-800">
            {[
              { icon: '⬡', title: 'Verified Quotes', desc: 'Every quote includes a photo of the model or slicer preview — no surprises.' },
              { icon: '◎', title: 'Mutual Reviews', desc: 'Airbnb-style: reviews only go public when both parties have submitted.' },
              { icon: '◈', title: 'Direct Messaging', desc: 'Chat directly with your printer owner from quote acceptance to delivery.' },
              { icon: '◻', title: 'Interactive Map', desc: 'Browse printers and open jobs near you on a Zurich-centered map.' },
              { icon: '◆', title: 'File Uploads', desc: 'Attach your STL, STEP, or OBJ files securely — only seen by matched makers.' },
              { icon: '◉', title: 'Local & Shipping', desc: 'Filter for pickup, local delivery, or Switzerland-wide shipping options.' },
            ].map((f) => (
              <div key={f.title} className="bg-ink-950 p-8 hover:bg-ink-900 transition-colors">
                <div className="text-2xl text-gold-400 mb-4 font-mono">{f.icon}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-warm-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-24 bg-gold-400">
        <div className="page-container text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-800 mb-4">Join the community</p>
          <h2 className="text-5xl font-black text-ink-950 tracking-tight mb-4">
            Ready to print?
          </h2>
          <p className="text-ink-700 mb-10 text-lg max-w-md mx-auto">
            Whether you need a part made or have a printer ready to go &mdash; this is your platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="bg-ink-950 text-white hover:bg-ink-900">
                Create free account →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-warm-200 bg-warm-50 py-10">
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-ink-900">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-ink-900">
              <svg className="h-3.5 w-3.5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            PrintMarket
          </div>
          <p className="text-xs text-warm-400 uppercase tracking-wider">© 2025 PrintMarket · Zurich, Switzerland</p>
          <div className="flex gap-5 text-xs text-warm-500">
            <a href="#" className="hover:text-ink-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-ink-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-ink-900 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
