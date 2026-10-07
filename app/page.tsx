import Link from 'next/link'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { Shield, Award, Lock, Users, Globe, CheckCircle } from 'lucide-react'
import { MakerCard } from '@/components/makers/maker-card'
import { MapClient } from '@/components/map/map-client'

// ---------------------------------------------------------------------------
// Photography placeholder helper (local, not exported)
// ---------------------------------------------------------------------------
function ImgPlaceholder({ id, subject, className }: { id: string; subject: string; className?: string }) {
  return (
    <div className={`bg-warm-200 flex items-center justify-center rounded-xl ${className ?? ''}`}>
      <div className="text-center px-4">
        <p className="text-warm-400 text-xs font-mono">{id}</p>
        <p className="text-warm-400 text-xs mt-1">{subject}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole: string | null = null
  if (user) {
    const cookieStore = await cookies()
    const viewMode = cookieStore.get('view_mode')?.value
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('user_id', user.id).single()
    const profileData = profile as { role: string } | null
    userRole = viewMode === 'maker' ? 'printer_owner'
      : viewMode === 'client' ? 'client'
      : profileData?.role ?? null
  }

  // Platform stats + maker cards
  const [
    { count: makerCount },
    { count: jobCount },
    { count: completedCount },
    { data: makersRaw },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'printer_owner'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase
      .from('printer_profiles')
      .select('user_id, display_name, city, certification_level, materials, processes, description')
      .not('display_name', 'is', null)
      .limit(6),
  ])

  const isMaker = userRole === 'printer_owner'

  // Shape maker data for MakerCard
  type RawMaker = {
    user_id: string
    display_name: string | null
    city: string | null
    certification_level: number | null
    materials: string[] | null
    processes: string[] | null
    description: string | null
  }
  const makers = ((makersRaw as RawMaker[] | null) ?? []).map((m) => ({
    user_id: m.user_id,
    display_name: m.display_name,
    city: m.city,
    certification_level: m.certification_level ?? 0,
    materials: m.materials ?? [],
    processes: m.processes ?? [],
    description: m.description ?? null,
    cover_image: null as string | null,
    avatar_url: null as string | null,
    rating_average: null as number | null,
    rating_count: null as number | null,
  }))

  return (
    <div className="min-h-screen bg-warm-50 font-sans">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-warm-200 bg-white/95 backdrop-blur-md">
        <div className="page-container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="PrintMarketHub" className="h-10 w-auto" />
            <span className="hidden sm:block text-xl font-black tracking-tight text-warm-900">
              PrintMarket<span className="text-gold-500">Hub</span>
            </span>
          </div>
          <nav className="flex items-center gap-1.5">
            <div className="hidden md:flex items-center gap-0.5 mr-1">
              <Link href="/how-it-works" className="px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-warm-900 hover:bg-warm-100 rounded-lg transition-colors">How it works</Link>
              <Link href="/makers"       className="px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-warm-900 hover:bg-warm-100 rounded-lg transition-colors">Browse makers</Link>
              <Link href="/for-makers"   className="px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-warm-900 hover:bg-warm-100 rounded-lg transition-colors">For makers</Link>
              <Link href="/faq"          className="px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-warm-900 hover:bg-warm-100 rounded-lg transition-colors">FAQ</Link>
            </div>
            {user ? (
              <Link href={userRole === 'admin' ? '/dashboard/admin' : isMaker ? '/dashboard/printer' : '/dashboard/client'}>
                <Button variant="gold" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block"><Button variant="ghost" size="sm">Log in</Button></Link>
                <Link href="/signup"><Button variant="gold" size="sm"><span className="hidden sm:inline">Get started free</span><span className="sm:hidden">Get started</span></Button></Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — HERO (light editorial split)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-warm-50">
        <div className="page-container py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — copy */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-warm-500 mb-5">
                3D printing marketplace
              </p>
              <h1 className="text-5xl font-black leading-tight tracking-tight text-ink-950 mb-6">
                Need something 3D printed? <span className="text-gold-500">Someone nearby</span> can make it.
              </h1>
              <p className="text-base text-warm-600 max-w-md mb-8 leading-relaxed">
                Upload a model or describe what you need. Makers with suitable equipment send quotes.
                Compare your options and choose who makes it.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <Link href="/jobs/new">
                  <Button variant="primary" size="lg">Post a request</Button>
                </Link>
                <Link href="/how-it-works">
                  <Button variant="outline" size="lg">How it works</Button>
                </Link>
              </div>
              <p className="text-sm text-warm-500">
                Own a printer?{' '}
                <Link href="/for-makers" className="font-semibold text-ink-700 hover:text-gold-600 transition-colors">
                  Become a maker →
                </Link>
              </p>
            </div>

            {/* Right — photo placeholder + small UI annotation */}
            <div className="hidden lg:block">
              <div className="relative">
                <ImgPlaceholder id="IMG-01" subject="Hero photograph" className="aspect-[4/3] w-full" />
                {/* Small job card annotation — NOT a floating stack */}
                <div className="mt-3 rounded-xl border border-warm-200 bg-white p-4 shadow-card">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-950">Custom bracket for DJI Osmo Pocket 3</p>
                      <p className="text-xs text-warm-500 mt-0.5">FDM · PETG · CHF 40–80</p>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
                      Open
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — COMPACT PROOF STRIP
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-y border-warm-200 py-4">
        <div className="page-container">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-sm">
            {[
              { icon: <Users size={14} className="text-warm-400" />, value: `${(makerCount ?? 0)}+`, label: 'makers' },
              { icon: <Globe size={14} className="text-warm-400" />, value: 'Worldwide', label: '' },
              { icon: <CheckCircle size={14} className="text-warm-400" />, value: 'Stripe', label: 'payments' },
              { icon: <Award size={14} className="text-warm-400" />, value: 'Certified', label: 'makers' },
            ].map((item) => (
              <div key={item.value + item.label} className="flex items-center gap-1.5">
                {item.icon}
                <span className="font-semibold text-ink-900">{item.value}</span>
                {item.label && <span className="text-warm-500">{item.label}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — REAL MAKERS NEAR YOU
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16">
        <div className="page-container">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-ink-950 tracking-tight mb-2">Makers near you</h2>
            <p className="text-warm-600 text-sm max-w-xl">
              Find people and print businesses with the right equipment for your job.
            </p>
          </div>

          {makers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {makers.slice(0, 3).map((maker) => (
                <MakerCard key={maker.user_id} maker={maker} />
              ))}
            </div>
          ) : (
            <p className="text-warm-500 text-sm">
              Makers are joining every week. Check back soon.
            </p>
          )}

          <div className="mt-8">
            <Link href="/makers" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-700 hover:text-gold-600 transition-colors">
              Explore all makers →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — MAP SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-warm-50 py-16">
        <div className="page-container">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-ink-950 tracking-tight mb-2">
              The right printer might be closer than you think.
            </h2>
            <p className="text-warm-600 text-sm max-w-xl">
              PrintMarketHub connects people with makers and print businesses around the world.
            </p>
          </div>

          <div className="border border-warm-200 rounded-xl overflow-hidden h-[420px]">
            <MapClient jobs={[]} printers={[]} defaultMode="both" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — HOW IT WORKS (editorial alternating)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16">
        <div className="page-container">
          <div className="mb-12">
            <p className="section-label mb-3">How it works</p>
            <h2 className="text-4xl font-black text-ink-950 tracking-tight">
              From idea to finished part in three steps.
            </h2>
          </div>

          <div className="space-y-16">

            {/* Step 01 — text left, UI right */}
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-6xl font-black text-warm-200 leading-none mb-2">01</p>
                <h3 className="text-xl font-bold text-ink-950 mb-3">Tell us what you need</h3>
                <p className="text-sm text-warm-600 leading-relaxed max-w-sm">
                  Upload an existing model, or describe what you want and let a maker design it for you.
                </p>
              </div>
              <div className="bg-warm-100 rounded-xl p-8">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-warm-500 font-medium mb-1">Describe your part</p>
                    <div className="h-20 rounded-lg bg-white border border-warm-200 px-3 py-2">
                      <p className="text-xs text-warm-400">e.g. A bracket to mount a camera to a tripod rail...</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-warm-500 font-medium mb-1">Material</p>
                      <div className="h-9 rounded-lg bg-white border border-warm-200 px-3 flex items-center">
                        <p className="text-xs text-warm-400">PLA / PETG / ABS…</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-warm-500 font-medium mb-1">Budget</p>
                      <div className="h-9 rounded-lg bg-white border border-warm-200 px-3 flex items-center">
                        <p className="text-xs text-warm-400">CHF 0–200</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 02 — UI left, text right */}
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="order-2 lg:order-1 bg-warm-100 rounded-xl p-8 space-y-3">
                {[
                  { name: 'Zurich Maker Studio', price: 'CHF 38', days: '3 days' },
                  { name: 'FDM Workshop', price: 'CHF 45', days: '5 days' },
                ].map((q) => (
                  <div key={q.name} className="bg-white rounded-xl border border-warm-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink-950">{q.name}</p>
                      <p className="text-xs text-warm-500 mt-0.5">{q.days} lead time</p>
                    </div>
                    <span className="font-bold text-gold-500 text-sm">{q.price}</span>
                  </div>
                ))}
              </div>
              <div className="order-1 lg:order-2">
                <p className="text-6xl font-black text-warm-200 leading-none mb-2">02</p>
                <h3 className="text-xl font-bold text-ink-950 mb-3">Makers send quotes</h3>
                <p className="text-sm text-warm-600 leading-relaxed max-w-sm">
                  Suitable makers review your request and submit their price and estimated lead time.
                </p>
              </div>
            </div>

            {/* Step 03 — text left, visual right */}
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-6xl font-black text-warm-200 leading-none mb-2">03</p>
                <h3 className="text-xl font-bold text-ink-950 mb-3">Choose your maker</h3>
                <p className="text-sm text-warm-600 leading-relaxed max-w-sm">
                  Compare quotes, read maker profiles, and pick the offer that suits you. Pay securely.
                </p>
              </div>
              <ImgPlaceholder id="IMG-03" subject="Finished printed part" className="aspect-[4/3] w-full" />
            </div>
          </div>

          <div className="mt-12">
            <Link href={isMaker ? '/dashboard/client' : '/jobs/new'}>
              <Button variant="primary">Post your first request</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — MODEL DISCOVERY
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-warm-50 border-y border-warm-200 py-12">
        <div className="page-container">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-ink-950 tracking-tight mb-2">Already have a model?</h2>
            <p className="text-warm-600 text-sm max-w-xl">
              Browse millions of free printable models on MakerWorld and Thingiverse. Find what you want,
              then post a job for a maker to print it.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* MakerWorld */}
            <a href="https://makerworld.com/en" target="_blank" rel="noopener noreferrer"
              className="group bg-white rounded-xl border border-warm-200 p-6 flex gap-4 items-start hover:border-gold-500/50 hover:shadow-lg transition-all">
              <div className="h-10 w-10 rounded-xl bg-ink-50 border border-warm-200 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div>
                    <p className="font-bold text-warm-900">MakerWorld</p>
                    <p className="text-xs text-warm-400">by Bambu Lab</p>
                  </div>
                  <svg className="h-4 w-4 text-warm-400 group-hover:text-ink-900 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <p className="text-sm text-warm-600 mb-3">
                  High-quality models with verified print profiles. Great for functional parts and engineering designs.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Mechanical', 'Hobby', 'Home', 'Engineering', 'Art'].map((c) => (
                    <span key={c} className="rounded-full bg-warm-100 border border-warm-200 px-2.5 py-0.5 text-xs text-warm-600">{c}</span>
                  ))}
                </div>
              </div>
            </a>

            {/* Thingiverse */}
            <a href="https://www.thingiverse.com" target="_blank" rel="noopener noreferrer"
              className="group bg-white rounded-xl border border-warm-200 p-6 flex gap-4 items-start hover:border-gold-500/50 hover:shadow-lg transition-all">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div>
                    <p className="font-bold text-warm-900">Thingiverse</p>
                    <p className="text-xs text-warm-400">by MakerBot</p>
                  </div>
                  <svg className="h-4 w-4 text-warm-400 group-hover:text-ink-900 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <p className="text-sm text-warm-600 mb-3">
                  The world's largest 3D model library. Millions of free community designs for every use case.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Gadgets', 'Tools', 'Toys', 'Architecture', 'Fashion'].map((c) => (
                    <span key={c} className="rounded-full bg-warm-100 border border-warm-200 px-2.5 py-0.5 text-xs text-warm-600">{c}</span>
                  ))}
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 7 — DESIGN HELP (dark)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-ink-950 py-16">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — photo placeholder */}
            <div className="bg-warm-800 rounded-xl aspect-[4/3] flex items-center justify-center">
              <ImgPlaceholder id="IMG-02" subject="Sketch → CAD → printed part" className="w-full h-full bg-transparent" />
            </div>

            {/* Right — text */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-4">
                No 3D model? No problem.
              </p>
              <h2 className="text-3xl font-black text-white mb-4 leading-tight">
                Start with an idea. A maker can design it for you.
              </h2>
              <p className="text-warm-400 text-sm leading-relaxed mb-8 max-w-sm">
                Many makers offer design services. Describe what you need — a rough sketch, a reference
                photo, or just words — and request design help alongside your print.
              </p>
              <Link href="/jobs/new">
                <Button className="bg-white text-ink-950 hover:bg-warm-100 font-bold">
                  Post a design request
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 8 — WHAT CAN BE MADE (2×2 editorial tiles)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16">
        <div className="page-container">
          <div className="mb-10">
            <p className="section-label mb-3">What can be made?</p>
            <h2 className="text-3xl font-black text-ink-950 tracking-tight mb-2">
              Almost anything you can imagine.
            </h2>
            <p className="text-warm-600 text-sm max-w-lg">
              You don't need to know anything about 3D printing. Just describe what you want.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                img: 'IMG-04',
                subject: 'Brackets, clips, jigs in use',
                label: 'Everyday need',
                category: 'Functional parts',
                desc: 'Brackets, clips, housings, jigs, replacement parts — components that need to work.',
              },
              {
                img: 'IMG-05',
                subject: 'Mechanical prototype on desk',
                label: 'For creators',
                category: 'Prototypes & engineering',
                desc: 'Product mockups, concept models, mechanical assemblies. Fast iteration at low cost.',
              },
              {
                img: 'IMG-06',
                subject: 'Miniature figurine or sculpture',
                label: 'Most popular',
                category: 'Models & creative projects',
                desc: 'Miniatures, figurines, scale models, sculptures, props. Anything visual.',
              },
              {
                img: 'IMG-07',
                subject: 'Batch of identical parts',
                label: 'For studios',
                category: 'Small production runs',
                desc: 'Low-volume batches of identical parts. Great for makers, studios, and small businesses.',
              },
            ].map((tile) => (
              <div key={tile.category} className="bg-warm-50 rounded-xl border border-warm-200 overflow-hidden">
                <div className="h-40 bg-warm-200 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-warm-400 text-xs font-mono">{tile.img}</p>
                    <p className="text-warm-400 text-xs mt-1">{tile.subject}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs text-warm-400 font-medium mb-1">{tile.label}</p>
                  <p className="text-lg font-bold text-ink-900 mb-1">{tile.category}</p>
                  <p className="text-sm text-warm-500">{tile.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 9 — TRUST (compact two-column)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-warm-50 border-y border-warm-200 py-12">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* Left — trust statement */}
            <div>
              <h2 className="text-2xl font-black text-ink-950 mb-3">Built on trust. Secured by Stripe.</h2>
              <p className="text-warm-600 text-sm max-w-sm leading-relaxed">
                Every payment flows through Stripe. You only pay when you're ready to proceed, and the
                maker gets paid when the job is complete.
              </p>
            </div>

            {/* Right — trust items */}
            <div className="space-y-5">
              {[
                {
                  Icon: Shield,
                  title: 'Protected payments',
                  desc: 'Stripe-secured. Card and bank transfer.',
                },
                {
                  Icon: Award,
                  title: 'Certified makers',
                  desc: 'Makers earn certification by printing benchmark parts reviewed by our team.',
                },
                {
                  Icon: Lock,
                  title: 'Your files, your control',
                  desc: 'Files are only shared with the maker you choose.',
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <item.Icon size={18} className="text-warm-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                    <p className="text-xs text-warm-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 10 — MAKER RECRUITMENT (dark, 50/50)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-ink-950 py-20">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — photo placeholder */}
            <div className="bg-warm-900 rounded-xl aspect-square flex items-center justify-center">
              <ImgPlaceholder id="IMG-08" subject="Maker workshop / printer setup" className="w-full h-full bg-transparent" />
            </div>

            {/* Right — text */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-4">
                For makers
              </p>
              <h2 className="text-3xl font-black text-white mb-6 leading-tight">
                Own a 3D printer?<br />Put it to work.
              </h2>
              <ul className="space-y-2 text-sm text-warm-400 mb-8">
                {[
                  'Choose the jobs you want',
                  'Set your own price',
                  'Build your maker profile',
                  'Get paid per completed order',
                  '12% commission — no subscription, no listing fee',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-gold-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/for-makers">
                <Button variant="primary" size="lg">Become a maker</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 11 — FINAL CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-warm-50 border-t border-warm-200 py-16">
        <div className="page-container text-center">
          <h2 className="text-3xl font-black text-ink-950 tracking-tight mb-3">
            Ready to make something?
          </h2>
          <p className="text-warm-600 text-sm mb-8 max-w-md mx-auto">
            Post a free request and hear from makers within hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/jobs/new">
              <Button variant="primary" size="lg">Post a request</Button>
            </Link>
            <Link href="/makers" className="inline-flex items-center text-sm font-semibold text-warm-600 hover:text-ink-900 transition-colors">
              Browse makers →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-warm-200 bg-warm-800 py-10">
        <div className="page-container space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <img src="/logo-full.png" alt="PrintMarketHub" className="h-8 w-auto" />
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-warm-400">
              <Link href="/how-it-works" className="hover:text-white transition-colors">How it works</Link>
              <Link href="/for-makers"   className="hover:text-white transition-colors">For makers</Link>
              <Link href="/blog"         className="hover:text-white transition-colors">Blog</Link>
              <Link href="/faq"          className="hover:text-white transition-colors">FAQ</Link>
              <Link href="/makers"       className="hover:text-white transition-colors">Browse makers</Link>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-warm-600">© {new Date().getFullYear()} PrintMarketHub</p>
            <div className="flex gap-5 text-xs text-warm-600">
              <a href="/legal/privacy"    className="hover:text-white transition-colors">Privacy</a>
              <a href="/legal/terms"      className="hover:text-white transition-colors">Terms</a>
              <a href="/legal/impressum"  className="hover:text-white transition-colors">Impressum</a>
              <a href="mailto:admin@printmarkethub.com" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
