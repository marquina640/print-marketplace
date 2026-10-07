import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'How it Works - PrintMarketHub',
  description: 'PrintMarketHub connects people who need 3D prints with local makers who have printers. Learn how the process works for clients and makers.',
}

const clientSteps = [
  {
    number: '01',
    title: 'Post your request',
    desc: 'Describe your part - material, quantity, deadline, and budget. Upload your STL/3MF/STEP file, or just paste a link from Thingiverse or MakerWorld. Takes about 2 minutes.',
  },
  {
    number: '02',
    title: 'Receive quotes from local makers',
    desc: 'Verified makers near you see your request and send quotes. You\'ll get email notifications for each one. Most requests receive their first quote within a few hours.',
  },
  {
    number: '03',
    title: 'Compare, chat, and choose',
    desc: 'Review maker profiles, star ratings, completed jobs, and machines. Message any maker directly with questions before you decide - no commitment required.',
  },
  {
    number: '04',
    title: 'Accept the best quote',
    desc: 'Found your maker? Accept their quote with one click. All other quotes are automatically declined. The job is locked in and production begins.',
  },
  {
    number: '05',
    title: 'Pay securely',
    desc: 'Your payment is processed securely at checkout. The maker gets paid once you confirm delivery — you\'re never charged for a result you haven\'t approved.',
  },
  {
    number: '06',
    title: 'Receive your print and confirm',
    desc: 'Your maker ships the job. Once it arrives and you\'re happy, confirm delivery in the app. The maker gets paid and you can leave a review.',
  },
]

const makerSteps = [
  {
    number: '01',
    title: 'Set up your profile',
    desc: 'Add your machines, materials, certifications, and a short bio. A complete profile gets significantly more quotes accepted - clients trust makers they can see.',
  },
  {
    number: '02',
    title: 'Browse open requests',
    desc: 'See all open job requests that match your capabilities and location. Filter by material, process, or job type. You only see jobs you can actually fulfil.',
  },
  {
    number: '03',
    title: 'Send a quote',
    desc: 'Name your price, set your lead time, and add any notes for the client. You can ask clarifying questions through the messaging system before committing.',
  },
  {
    number: '04',
    title: 'Get to work',
    desc: 'When the client accepts your quote and pays, you receive a notification. Print the part to spec and prepare it for shipping or pickup.',
  },
  {
    number: '05',
    title: 'Ship and mark as sent',
    desc: 'Send the order and mark it as shipped in the platform. This notifies the client and starts the delivery window.',
  },
  {
    number: '06',
    title: 'Get paid',
    desc: 'Once the client confirms delivery, your payment is automatically sent to your bank account via Stripe. Payouts typically arrive within 1–2 business days.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-16">

      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-warm-100 border border-warm-200 px-4 py-1.5 text-sm font-semibold text-warm-600">
          Simple. Secure. Local.
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-ink-900 tracking-tight leading-tight">
          How PrintMarketHub works
        </h1>
        <p className="text-warm-500 text-base max-w-xl leading-relaxed">
          We connect people who need 3D prints with local makers who have the printers and skills to produce them - quickly, affordably, and securely.
        </p>
      </div>

      {/* Client section */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-warm-200" />
          <h2 className="text-xl font-black text-ink-900 whitespace-nowrap">If you need something printed</h2>
          <div className="h-px flex-1 bg-warm-200" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {clientSteps.map((step) => (
            <div key={step.number} className="rounded-xl border border-warm-200 bg-warm-50 p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl font-black leading-none text-warm-300">{step.number}</span>
              </div>
              <p className="font-bold text-ink-900 mb-1.5">{step.title}</p>
              <p className="text-sm text-warm-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Link href="/jobs/new">
            <Button variant="primary">Post your first request</Button>
          </Link>
        </div>
      </div>

      {/* Maker section */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-warm-200" />
          <h2 className="text-xl font-black text-ink-900 whitespace-nowrap">If you have a printer</h2>
          <div className="h-px flex-1 bg-warm-200" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {makerSteps.map((step) => (
            <div key={step.number} className="rounded-xl border border-warm-200 bg-warm-50 p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl font-black leading-none text-warm-300">{step.number}</span>
              </div>
              <p className="font-bold text-ink-900 mb-1.5">{step.title}</p>
              <p className="text-sm text-warm-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Link href="/for-makers">
            <Button variant="primary">Become a maker</Button>
          </Link>
        </div>
      </div>

      {/* Trust bar */}
      <div className="rounded-xl bg-warm-100 border border-warm-200 p-6">
        <p className="section-label text-center mb-5">Built on trust</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { title: 'Secure payments', desc: 'All payments processed securely via Stripe. The maker gets paid when you confirm delivery.' },
            { title: 'Verified reviews', desc: 'Ratings from real completed jobs only' },
            { title: 'On-platform chat', desc: 'All communication in one place, no phone numbers needed' },
            { title: 'Dispute protection', desc: 'Fair mediation if anything goes wrong - you\'re never left without recourse' },
          ].map((item) => (
            <div key={item.title} className="space-y-1.5">
              <p className="font-semibold text-ink-900 text-sm">{item.title}</p>
              <p className="text-xs text-warm-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ link */}
      <div className="text-center text-sm text-warm-500">
        Still have questions?{' '}
        <Link href="/faq" className="text-ink-600 underline hover:text-ink-800">Read our FAQ</Link>
        {' '}or{' '}
        <a href="mailto:admin@printmarkethub.com" className="text-ink-600 underline hover:text-ink-800">contact us</a>.
      </div>

    </div>
  )
}
