import type { Metadata } from 'next'
import Link from 'next/link'
import { EarningsCalculator } from './earnings-calculator'

export const metadata: Metadata = {
  title: 'Earn Money with Your 3D Printer - PrintMarketHub for Makers',
  description: 'Turn your 3D printer into a revenue stream. Join PrintMarketHub to receive job requests from clients in your community. Free to join. You set your own prices.',
}

const benefits = [
  { icon: '🆓', title: 'Free to join', desc: 'No subscription, no listing fee. A commission applies only when a job is successfully completed — no upfront costs, ever.' },
  { icon: '💸', title: 'You set your prices', desc: 'Quote whatever you think is fair. There\'s no floor or ceiling - the market finds the right price.' },
  { icon: '🔒', title: 'Always get paid', desc: 'Payment is collected from the client before you start. Once they confirm delivery, the money is automatically released to your account.' },
  { icon: '📅', title: 'Work your schedule', desc: 'Only quote on jobs you want to take. Busy this week? Simply don\'t quote. No penalties, no minimums.' },
  { icon: '⭐', title: 'Build a reputation', desc: 'Every completed job adds a verified review to your profile. A strong rating unlocks higher-value engineering jobs.' },
  { icon: '🗺️', title: 'Community-first', desc: 'Your profile is shown to clients near you first - faster turnaround, easier pickups, and clients who value finding someone local.' },
]

const requirements = [
  { icon: '🖨️', text: 'A working 3D printer (any type - FDM, resin)' },
  { icon: '📦', text: 'Ability to ship to your customers (or offer local pickup)' },
  { icon: '💳', text: 'A Stripe account for receiving payouts (free to create)' },
  { icon: '📸', text: 'A completed profile with photos of your setup and past work' },
]

const steps = [
  { n: '1', title: 'Create your free account', desc: 'Sign up and choose the "Maker" role. Takes under 2 minutes.' },
  { n: '2', title: 'Set up your profile', desc: 'Add your machines, materials, and a short bio. The more complete your profile, the more quotes you win.' },
  { n: '3', title: 'Browse open requests', desc: 'See job requests from clients near you. Filter by material, process, or job type.' },
  { n: '4', title: 'Send quotes and earn', desc: 'Quote on jobs you want. When accepted, print and ship - and get paid automatically on delivery.' },
]

export default function ForMakersPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-16">

      {/* Hero */}
      <div className="text-center space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-sm font-semibold text-emerald-700">
          🖨️ For makers
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-ink-900 tracking-tight leading-tight">
          Your printer is already earning money.<br />
          <span className="text-[#D4A017]">You just need the jobs.</span>
        </h1>
        <p className="text-warm-500 text-base max-w-xl mx-auto leading-relaxed">
          PrintMarketHub connects you with people in your community who need things printed - and can&apos;t do it themselves. No ads, no bidding wars. Just real jobs from real people nearby.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/signup"
            className="rounded-xl bg-[#D4A017] text-[#1a1535] font-bold px-6 py-3 text-sm hover:bg-[#c49015] transition-colors shadow-sm">
            Start earning for free →
          </Link>
          <Link href="/how-it-works"
            className="rounded-xl border border-warm-300 bg-white text-ink-700 font-semibold px-6 py-3 text-sm hover:bg-warm-50 transition-colors">
            How it works
          </Link>
        </div>
      </div>

      {/* Benefits grid */}
      <div>
        <h2 className="text-xl font-black text-ink-900 text-center mb-8">Why makers choose PrintMarketHub</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-2xl border border-warm-200 bg-white p-5 space-y-2 hover:border-ink-300 transition-colors">
              <div className="text-2xl">{b.icon}</div>
              <p className="font-bold text-ink-900 text-sm">{b.title}</p>
              <p className="text-sm text-warm-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings calculator */}
      <div className="grid sm:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <h2 className="text-xl font-black text-ink-900">How much can you earn?</h2>
          <p className="text-warm-500 text-sm leading-relaxed">
            It depends on your printer, the jobs available near you, and how many hours you want to put in. You decide when you quote, how much you charge, and which jobs to take.
          </p>
          <p className="text-warm-500 text-sm leading-relaxed">
            A standard FDM job - a bracket, a housing, a custom part - typically runs <strong>$20-80</strong>. Complex engineering parts or resin prints go higher. Jobs that arrive as Thingiverse links can take as little as 30 minutes to print and pack.
          </p>
          <p className="text-warm-500 text-sm leading-relaxed">
            Use the calculator to get a rough sense of what your setup could earn.
          </p>
        </div>
        <EarningsCalculator />
      </div>

      {/* How to get started */}
      <div>
        <h2 className="text-xl font-black text-ink-900 text-center mb-8">Get started in 4 steps</h2>
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.n} className="flex items-start gap-4 rounded-2xl border border-warm-200 bg-white p-5">
              <div className="w-9 h-9 rounded-full bg-[#1a1535] text-white text-sm font-black flex items-center justify-center flex-shrink-0">
                {step.n}
              </div>
              <div>
                <p className="font-bold text-ink-900 text-sm">{step.title}</p>
                <p className="text-sm text-warm-500 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div className="rounded-2xl bg-warm-50 border border-warm-200 p-6 space-y-4">
        <h3 className="font-bold text-ink-900">What you need to get started</h3>
        <ul className="space-y-3">
          {requirements.map((r) => (
            <li key={r.text} className="flex items-start gap-3 text-sm text-warm-700">
              <span className="text-base flex-shrink-0 mt-0.5">{r.icon}</span>
              {r.text}
            </li>
          ))}
        </ul>
        <p className="text-xs text-warm-400 pt-2 border-t border-warm-200">
          That&apos;s it. No certifications required to start - though completing our optional certification process unlocks access to higher-value engineering jobs.
        </p>
      </div>

      {/* Final CTA */}
      <div className="rounded-2xl bg-[#1a1535] text-white p-8 text-center space-y-4">
        <p className="text-2xl font-black">Ready to turn prints into income?</p>
        <p className="text-[#CEC8E4] text-sm max-w-md mx-auto">
          Join other makers already earning on PrintMarketHub. Free to join, no commitment required.
        </p>
        <Link href="/signup"
          className="inline-block rounded-xl bg-[#D4A017] text-[#1a1535] font-bold px-8 py-3 text-sm hover:bg-[#c49015] transition-colors">
          Create your free maker profile →
        </Link>
        <p className="text-xs text-[#6b6580] pt-2">
          Have questions?{' '}
          <Link href="/faq#makers" className="underline text-[#9d97c4] hover:text-white">Read the maker FAQ</Link>
          {' '}or{' '}
          <a href="mailto:admin@printmarkethub.com" className="underline text-[#9d97c4] hover:text-white">email us</a>.
        </p>
      </div>

    </div>
  )
}
