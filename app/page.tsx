import Link from 'next/link'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole: string | null = null
  if (user) {
    const cookieStore = await cookies()
    const viewMode = cookieStore.get('view_mode')?.value
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('user_id', user.id).single()
    userRole = viewMode === 'maker' ? 'printer_owner'
      : viewMode === 'client' ? 'client'
      : profile?.role ?? null
  }

  const isMaker = userRole === 'printer_owner'

  return (
    <div className="min-h-screen bg-warm-50 font-sans">

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-warm-200 bg-white/95 backdrop-blur-md">
        <div className="page-container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-icon.png" alt="PrintMarketHub" className="h-12 w-auto" />
            <span className="text-xl font-black tracking-tight text-warm-900">PrintMarket<span className="text-[#D4A017]">Hub</span></span>
          </div>
          <nav className="flex items-center gap-2">
            {user ? (
              <Link href={isMaker ? '/dashboard/printer' : '/dashboard/client'}>
                <Button variant="gold" size="sm">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <div className="hidden md:flex items-center gap-1 mr-2">
                  <Link href="/how-it-works" className="px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-warm-900 hover:bg-warm-100 rounded-lg transition-colors">How it works</Link>
                  <Link href="/for-makers" className="px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-warm-900 hover:bg-warm-100 rounded-lg transition-colors">For makers</Link>
                  <Link href="/blog" className="px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-warm-900 hover:bg-warm-100 rounded-lg transition-colors">Blog</Link>
                </div>
                <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
                <Link href="/signup"><Button variant="gold" size="sm">Get started free</Button></Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'linear-gradient(#fbbf24 1px, transparent 1px), linear-gradient(to right, #fbbf24 1px, transparent 1px)',
            backgroundSize: '72px 72px'
          }} />
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />

        <div className="page-container relative py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left - copy */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold-400">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-pulse" />
                The 3D Printing Marketplace
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.92] tracking-tighter text-white mb-6">
                Get your idea<br />
                <span className="text-gold-400">printed today.</span>
              </h1>
              <p className="text-lg text-[#CEC8E4] max-w-lg mb-8 leading-relaxed">
                Post a request, collect quotes from verified makers near you, pay securely, and track your order every step of the way.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Link href="/jobs/new">
                  <Button variant="gold" size="lg">Post a Request, it's free</Button>
                </Link>
                <Link href="/signup?role=printer_owner">
                  <Button size="lg" className="bg-white/10 text-white border border-white/20 hover:bg-white/20">
                    I own a printer
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-[#B0A8C8] uppercase tracking-widest">No subscription · Pay only when you print</p>
            </div>

            {/* Right - mockup */}
            <div className="hidden lg:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-warm-500 mb-2 text-center">What quotes look like</p>
              <div className="rounded-2xl border border-warm-700/40 bg-ink-900/60 p-5 backdrop-blur-sm space-y-3 max-w-sm ml-auto">
                {/* Job card */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="rounded-full bg-ink-700 border border-white/10 px-2 py-0.5 text-[9px] font-bold text-warm-400 uppercase tracking-wider">Print Request</span>
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white text-sm">Drone frame, Carbon PETG</p>
                      <p className="text-xs text-warm-500 mt-0.5">Posted 2h ago · Zurich</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">Open</span>
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    {['PETG', 'Functional', 'Pickup OK'].map(t => (
                      <span key={t} className="rounded-full bg-white/8 border border-white/10 px-2 py-0.5 text-[10px] text-warm-400">{t}</span>
                    ))}
                  </div>
                </div>
                {/* Quote 1 */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="rounded-full bg-gold-500/20 border border-gold-500/20 px-1.5 py-0.5 text-[9px] font-bold text-gold-400 uppercase tracking-wider">Quote 1</span>
                    </div>
                    <p className="text-sm font-medium text-white">Zurich Maker Studio</p>
                    <p className="text-[11px] text-warm-500 mt-0.5">★★ certified · 3 days lead time</p>
                  </div>
                  <span className="font-bold text-gold-400 text-sm">CHF 38</span>
                </div>
                {/* Quote 2 */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="rounded-full bg-gold-500/20 border border-gold-500/20 px-1.5 py-0.5 text-[9px] font-bold text-gold-400 uppercase tracking-wider">Quote 2</span>
                    </div>
                    <p className="text-sm font-medium text-white">FDM Workshop</p>
                    <p className="text-[11px] text-warm-500 mt-0.5">★★★ certified · 5 days lead time</p>
                  </div>
                  <span className="font-bold text-gold-400 text-sm">CHF 45</span>
                </div>
                {/* Payment bar */}
                <div className="rounded-xl bg-gold-500/15 border border-gold-500/20 px-3 py-2.5 flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-gold-400/30 flex items-center justify-center flex-shrink-0">
                    <svg className="h-3 w-3 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <p className="text-[11px] text-gold-300">Your payment is held safely until you confirm delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-warm-700 to-transparent" />
      </section>

      {/* Trust bar */}
      <section className="border-y border-gold-400" style={{backgroundColor:'#D4A017'}}>
        <div className="page-container py-3">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-xs font-semibold text-[#1C1829] uppercase tracking-wider">
            {[
              '🔒 Secure payments',
              '🏅 Certified makers',
              '📦 Ship or pickup locally',
              '💳 Card & bank transfer',
              '⭐ Mutual review system',
            ].map(item => <span key={item}>{item}</span>)}
          </div>
        </div>
      </section>

      {/* Find your model */}
      <section className="py-20 bg-warm-50">
        <div className="page-container">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-600 mb-3">Step 0: Find your model</p>
            <h2 className="text-3xl font-black text-warm-900 tracking-tight">Don't have a 3D file yet?</h2>
            <p className="text-warm-600 mt-3 max-w-xl mx-auto">
              Millions of free models are one click away. Browse, download your STL, then come back and post your request.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto mb-6">
            {/* MakerWorld */}
            <a href="https://makerworld.com/en" target="_blank" rel="noopener noreferrer"
              className="group rounded-2xl border-2 border-warm-200 bg-white p-6 hover:border-gold-500/50 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-ink-50 border border-warm-200 flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-warm-900">MakerWorld</p>
                  <p className="text-xs text-warm-400">by Bambu Lab</p>
                </div>
                <svg className="h-4 w-4 text-warm-400 group-hover:text-ink-900 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </div>
              <p className="text-sm text-warm-600 mb-4">High-quality models with print profiles. Great for functional parts and validated designs.</p>
              <div className="flex flex-wrap gap-1.5">
                {['Mechanical', 'Hobby', 'Home', 'Engineering', 'Art'].map(c => (
                  <span key={c} className="rounded-full bg-warm-100 border border-warm-200 px-2.5 py-0.5 text-xs text-warm-600">{c}</span>
                ))}
              </div>
            </a>

            {/* Thingiverse */}
            <a href="https://www.thingiverse.com" target="_blank" rel="noopener noreferrer"
              className="group rounded-2xl border-2 border-warm-200 bg-white p-6 hover:border-gold-500/50 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-warm-900">Thingiverse</p>
                  <p className="text-xs text-warm-400">by MakerBot</p>
                </div>
                <svg className="h-4 w-4 text-warm-400 group-hover:text-ink-900 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </div>
              <p className="text-sm text-warm-600 mb-4">The world's largest 3D model library. Millions of free community designs for every use case.</p>
              <div className="flex flex-wrap gap-1.5">
                {['Gadgets', 'Tools', 'Toys', 'Architecture', 'Fashion'].map(c => (
                  <span key={c} className="rounded-full bg-warm-100 border border-warm-200 px-2.5 py-0.5 text-xs text-warm-600">{c}</span>
                ))}
              </div>
            </a>
          </div>

          <p className="text-center text-sm text-warm-600">
            Already have your STL? <Link href="/jobs/new" className="font-semibold text-[#D4A017] hover:underline">Post your request directly</Link>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-600 mb-3">How it works</p>
            <h2 className="text-4xl font-black text-warm-900 tracking-tight">From idea to printed part<br />in a few clicks.</h2>
          </div>

          {/* Client path */}
          <div className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-warm-400 mb-6 text-center">For customers</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { n: '1', icon: '📁', title: 'Find or upload your model', desc: 'Browse MakerWorld or Thingiverse, or upload your own STL or STEP file.' },
                { n: '2', icon: '📋', title: 'Post your request', desc: 'Describe material, color, quantity, deadline, and budget. Takes 2 minutes.' },
                { n: '3', icon: '💬', title: 'Compare quotes and choose', desc: 'Get multiple quotes from local makers. Compare prices, ratings, and timelines. Ask questions before deciding.' },
                { n: '4', icon: '📦', title: 'Pay and receive', desc: 'Accept the best quote and pay securely. Your money is held safely and released only when you confirm delivery.' },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl border border-warm-200 bg-white p-5 relative">
                  <div className="absolute -top-3 left-5 h-6 w-6 rounded-full bg-gold-400 flex items-center justify-center text-[11px] font-black text-ink-950">
                    {s.n}
                  </div>
                  <p className="text-2xl mb-3 mt-2">{s.icon}</p>
                  <p className="font-bold text-warm-900 text-sm mb-1">{s.title}</p>
                  <p className="text-xs text-warm-600 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href={isMaker ? '/dashboard/client' : '/jobs/new'}>
                <Button variant="gold">Post Your First Request</Button>
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-warm-200" /></div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs font-bold text-warm-400 uppercase tracking-widest">or</span>
            </div>
          </div>

          {/* Maker path */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-warm-400 mb-6 text-center">For makers</p>
            <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { n: '1', icon: '🖨️', title: 'Set up your profile', desc: 'List your machines, materials, and capabilities. Certification levels build trust.' },
                { n: '2', icon: '🔍', title: 'Browse open requests', desc: 'Filter by material, process, and location. Find requests that match your setup.' },
                { n: '3', icon: '💰', title: 'Submit quotes and earn', desc: 'Send a quote with your price and lead time. Get paid into your account on delivery.' },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl border border-warm-200 bg-white p-5 relative">
                  <div className="absolute -top-3 left-5 h-6 w-6 rounded-full bg-gold-400 flex items-center justify-center text-[11px] font-black text-ink-950">
                    {s.n}
                  </div>
                  <p className="text-2xl mb-3 mt-2">{s.icon}</p>
                  <p className="font-bold text-warm-900 text-sm mb-1">{s.title}</p>
                  <p className="text-xs text-warm-600 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/signup?role=printer_owner">
                <Button className="bg-ink-900 text-white hover:bg-ink-800">Join as a Maker</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why PrintMarketHub */}
      <section className="py-20 bg-warm-50">
        <div className="page-container">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-600 mb-3">Why PrintMarketHub</p>
            <h2 className="text-4xl font-black text-warm-900 tracking-tight">Built for trust.<br />Made for makers everywhere.</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: '🔒',
                title: 'Your money is protected',
                desc: "Payment is held safely until you confirm delivery. Makers only get paid when you're happy.",
              },
              {
                icon: '💳',
                title: 'Pay your way',
                desc: 'Card and bank transfer supported. Powered by Stripe - secure, reliable, and trusted by millions.',
              },
              {
                icon: '🏅',
                title: 'Certified makers',
                desc: "Makers earn certification levels by printing benchmark parts reviewed by our team. You always know what you're getting.",
              },
              {
                icon: '⭐',
                title: 'Verified reviews',
                desc: 'Reviews only go public when both client and maker submit one. Honest, balanced, impossible to game.',
              },
              {
                icon: '🗺️',
                title: 'Community-first',
                desc: 'Find makers near you on an interactive map. Get your part printed and delivered by someone in your community.',
              },
              {
                icon: '📎',
                title: 'Your files, your control',
                desc: 'You upload your file when posting a request. Makers who quote can view it to prepare an accurate price.',
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-warm-200 bg-white p-6 hover:border-ink-200 hover:shadow-md transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-warm-900 mb-2">{f.title}</h3>
                <p className="text-sm text-warm-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What can we print */}
      <section className="py-16 bg-white border-y border-warm-200">
        <div className="page-container">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-warm-500 mb-2">What can we print?</p>
            <h3 className="text-2xl font-black text-warm-900">Almost anything you can imagine.</h3>
            <p className="text-warm-600 text-sm mt-2 max-w-lg mx-auto">You don't need to know anything about 3D printing. Just describe what you want and let the makers handle the rest.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {[
              { label: '🎮 Figurines and collectibles', sub: 'Pokémon, miniatures, action figures' },
              { label: '🔧 Functional parts', sub: 'Brackets, clips, housings, tools' },
              { label: '💡 Prototypes', sub: 'Product mockups, concept models' },
              { label: '💍 Jewelry and accessories', sub: 'Rings, pendants, custom pieces' },
              { label: '🏠 Home and decor', sub: 'Vases, organizers, wall art' },
              { label: '🚗 RC parts and drones', sub: 'Frames, mounts, covers' },
              { label: '🎲 Board game pieces', sub: 'Terrain, tokens, custom dice' },
              { label: '🎭 Cosplay and props', sub: 'Armor, helmets, movie replicas' },
              { label: '🏗️ Architecture models', sub: 'Scale buildings, site plans' },
              { label: '🔩 Replacement parts', sub: 'Broken clips, knobs, brackets' },
            ].map((t) => (
              <div key={t.label} className="rounded-2xl border border-warm-200 bg-warm-50 px-5 py-3 text-center">
                <p className="font-semibold text-warm-800 text-sm">{t.label}</p>
                <p className="text-[11px] text-warm-500 mt-0.5">{t.sub}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-warm-500 mt-6">Not sure if your idea is printable? Post a request and ask.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-gold-400 to-gold-500">
        <div className="page-container text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-700 mb-4">Ready to get started?</p>
          <h2 className="text-5xl font-black text-ink-950 tracking-tight mb-4">
            Your part is waiting.
          </h2>
          <p className="text-ink-700 mb-10 text-lg max-w-md mx-auto leading-relaxed">
            Join makers and clients already using PrintMarketHub to bring ideas to life.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/jobs/new">
              <Button size="lg" className="bg-ink-950 text-white hover:bg-ink-900 shadow-lg">
                Post a Request
              </Button>
            </Link>
            <Link href="/signup?role=printer_owner">
              <Button size="lg" className="bg-white/30 text-ink-900 border border-ink-900/20 hover:bg-white/50">
                List your printer
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-xs text-ink-600 uppercase tracking-widest">No subscription · Free to join</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-warm-200 bg-[#2B1B47] py-10">
        <div className="page-container space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <img src="/logo-full.png" alt="PrintMarketHub" className="h-8 w-auto" />
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#9d97c4]">
              <Link href="/how-it-works" className="hover:text-white transition-colors">How it works</Link>
              <Link href="/for-makers" className="hover:text-white transition-colors">For makers</Link>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
              <Link href="/makers" className="hover:text-white transition-colors">Browse makers</Link>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#6b6580]">© {new Date().getFullYear()} PrintMarketHub</p>
            <div className="flex gap-5 text-xs text-[#6b6580]">
              <a href="/legal/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/legal/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="/legal/impressum" className="hover:text-white transition-colors">Impressum</a>
              <a href="mailto:admin@printmarkethub.com" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
