import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const STEPS = [
  {
    icon: '📡',
    label: 'Step 1',
    title: 'Your request is live',
    desc: 'Verified makers on PrintMarketHub can now see your request and will start sending quotes.',
    bg: 'bg-blue-50 border-blue-100',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    icon: '📬',
    label: 'Step 2',
    title: 'Receive quotes',
    desc: "Usually within a few hours. You'll get an email notification for each new quote — no need to keep checking.",
    bg: 'bg-amber-50 border-amber-100',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  {
    icon: '💬',
    label: 'Step 3',
    title: 'Compare & chat with makers',
    desc: 'Review maker profiles, ratings, and prices. Message any maker directly if you have questions before deciding.',
    bg: 'bg-purple-50 border-purple-100',
    iconBg: 'bg-purple-100 text-purple-600',
  },
  {
    icon: '✅',
    label: 'Step 4',
    title: 'Accept the best quote',
    desc: "Once you've found the right maker, accept their quote to lock in the job. Other quotes are automatically declined.",
    bg: 'bg-green-50 border-green-100',
    iconBg: 'bg-green-100 text-green-600',
  },
  {
    icon: '🔒',
    label: 'Step 5',
    title: 'Pay securely via PayPal',
    desc: "Your payment is processed by PayPal at checkout. The maker gets paid once you confirm your order has arrived.",
    bg: 'bg-indigo-50 border-indigo-100',
    iconBg: 'bg-indigo-100 text-indigo-600',
  },
  {
    icon: '📦',
    label: 'Step 6',
    title: 'Receive your print & confirm',
    desc: "When your order arrives, confirm delivery in the app. The maker gets paid and you can leave a review.",
    bg: 'bg-emerald-50 border-emerald-100',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
]

export default async function JobSubmittedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: job } = await supabase
    .from('jobs')
    .select('title, client_id, image_url')
    .eq('id', id)
    .single()

  if (!job || job.client_id !== user.id) return notFound()

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">

      {/* Hero card */}
      <div className="rounded-2xl overflow-hidden shadow-lg">
        {job.image_url && (
          <div className="relative h-36 overflow-hidden">
            <img src={job.image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a1535]/80" />
          </div>
        )}
        <div className="bg-[#1a1535] px-8 pb-8 pt-6 text-center">
          <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Request submitted!</h1>
          <p className="text-[#D4A017] font-medium text-sm">"{job.title}"</p>
          <p className="text-[#9d97c4] text-xs mt-2">Your request is now live and visible to makers</p>
        </div>
      </div>

      {/* What happens next */}
      <div>
        <h2 className="text-base font-bold text-ink-900 mb-3 px-1">What happens next</h2>
        <div className="space-y-2.5">
          {STEPS.map((step, i) => (
            <div key={i} className={`flex items-start gap-4 rounded-xl border p-4 ${step.bg}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${step.iconBg}`}>
                {step.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest mb-0.5">{step.label}</p>
                <p className="font-semibold text-ink-900 text-sm leading-snug">{step.title}</p>
                <p className="text-sm text-warm-500 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex gap-3 pb-4">
        <Link href={`/jobs/${id}`} className="flex-1">
          <button className="w-full rounded-xl border border-warm-300 bg-white px-4 py-3 text-sm font-semibold text-ink-900 hover:bg-warm-50 transition-colors">
            View my request
          </button>
        </Link>
        <Link href="/jobs/new" className="flex-1">
          <button className="w-full rounded-xl bg-[#D4A017] px-4 py-3 text-sm font-semibold text-[#1a1535] hover:bg-[#c49015] transition-colors">
            Post another →
          </button>
        </Link>
      </div>

    </div>
  )
}
