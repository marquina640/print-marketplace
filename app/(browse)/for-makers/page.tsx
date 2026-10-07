import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EarningsCalculator } from './earnings-calculator'

export const metadata: Metadata = {
  title: 'Earn Money with Your 3D Printer - PrintMarketHub for Makers',
  description: 'Turn your 3D printer into a revenue stream. Join PrintMarketHub to receive job requests from clients in your community. Free to join. You set your own prices.',
}

const benefits = [
  { title: 'Free to join', desc: 'No subscription, no listing fee. A commission applies only when a job is successfully completed — no upfront costs, ever.' },
  { title: 'You set your prices', desc: 'Quote whatever you think is fair. There\'s no floor or ceiling - the market finds the right price.' },
  { title: 'Always get paid', desc: 'The client pays securely at checkout. Once they confirm delivery, your payment is sent directly to your bank account via Stripe.' },
  { title: 'Work your schedule', desc: 'Only quote on jobs you want to take. Busy this week? Simply don\'t quote. No penalties, no minimums.' },
  { title: 'Build a reputation', desc: 'Every completed job adds a verified review to your profile. A strong rating unlocks higher-value engineering jobs.' },
  { title: 'Community-first', desc: 'Your profile is shown to clients near you first - faster turnaround, easier pickups, and clients who value finding someone local.' },
]

const requirements = [
  { text: 'A working 3D printer (any type - FDM, resin)' },
  { text: 'Ability to ship to your customers (or offer local pickup)' },
  { text: 'A bank account for receiving payouts via Stripe (free to connect)' },
  { text: 'A completed profile with photos of your setup and past work' },
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
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-warm-100 border border-warm-200 px-4 py-1.5 text-sm font-semibold text-warm-600">
          For makers
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-ink-900 tracking-tight leading-tight">
          Your printer is already earning money.<br />
          <span className="text-gold-500">You just need the jobs.</span>
        </h1>
        <p className="text-warm-500 text-base max-w-xl leading-relaxed">
          PrintMarketHub connects you with people in your community who need things printed - and can&apos;t do it themselves. No ads, no bidding wars. Just real jobs from real people nearby.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link href="/signup">
            <Button variant="primary" size="lg">Start earning for free</Button>
          </Link>
          <Link href="/how-it-works">
            <Button variant="outline" size="lg">How it works</Button>
          </Link>
        </div>
      </div>

      {/* Benefits grid */}
      <div>
        <h2 className="text-xl font-black text-ink-900 mb-8">Why makers choose PrintMarketHub</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-xl border border-warm-200 bg-white p-5 space-y-2 hover:border-ink-300 transition-colors">
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
        <h2 className="text-xl font-black text-ink-900 mb-8">Get started in 4 steps</h2>
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.n} className="flex items-start gap-4 rounded-xl border border-warm-200 bg-white p-5">
              <div className="w-9 h-9 rounded-full bg-ink-900 text-white text-sm font-black flex items-center justify-center flex-shrink-0">
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
      <div className="rounded-xl bg-warm-50 border border-warm-200 p-6 space-y-4">
        <h3 className="font-bold text-ink-900">What you need to get started</h3>
        <ul className="space-y-3">
          {requirements.map((r) => (
            <li key={r.text} className="flex items-start gap-3 text-sm text-warm-700">
              <span className="text-warm-400 flex-shrink-0 mt-0.5">—</span>
              {r.text}
            </li>
          ))}
        </ul>
        <p className="text-xs text-warm-400 pt-2 border-t border-warm-200">
          That&apos;s it. No certifications required to start - though completing our optional certification process unlocks access to higher-value engineering jobs.
        </p>
      </div>

      {/* Final CTA */}
      <div className="rounded-xl bg-ink-950 text-white p-8 space-y-4">
        <p className="text-2xl font-black">Ready to turn prints into income?</p>
        <p className="text-warm-400 text-sm max-w-md">
          Join other makers already earning on PrintMarketHub. Free to join, no commitment required.
        </p>
        <Link href="/signup">
          <Button variant="primary">Create your free maker profile</Button>
        </Link>
        <p className="text-xs text-warm-600 pt-2">
          Have questions?{' '}
          <Link href="/faq#makers" className="underline text-warm-400 hover:text-white">Read the maker FAQ</Link>
          {' '}or{' '}
          <a href="mailto:admin@printmarkethub.com" className="underline text-warm-400 hover:text-white">email us</a>.
        </p>
      </div>

    </div>
  )
}
