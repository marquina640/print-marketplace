import type { Metadata } from 'next'
import Link from 'next/link'
import { FAQSection } from './faq-accordion'

export const metadata: Metadata = {
  title: 'FAQ - PrintMarketHub',
  description: 'Answers to common questions about using PrintMarketHub - for clients and makers alike.',
}

const clientFAQ = [
  {
    q: 'How does PrintMarketHub work?',
    a: (
      <p>
        You post a request describing what you need printed - upload your STL file or paste a link from Thingiverse or MakerWorld. Local makers review your request and send you quotes. You compare them, pick the best one, pay securely, and receive your print. It&apos;s that simple.{' '}
        <Link href="/how-it-works" className="text-ink-600 underline hover:text-ink-800">See the full walkthrough →</Link>
      </p>
    ),
  },
  {
    q: 'Is it safe to pay through the platform?',
    a: <p>Yes. All payments are processed by Stripe - the same technology used by Shopify, Amazon, and thousands of other platforms. The maker gets paid only after you confirm that your print has arrived and you&apos;re happy with it. If something goes wrong before you confirm, you&apos;re covered.</p>,
  },
  {
    q: 'What file formats do you accept?',
    a: (
      <div className="space-y-1">
        <p>You can upload:</p>
        <ul className="list-disc pl-4 space-y-1 mt-2">
          <li><strong>STL</strong> - the most common format, works with almost every slicer</li>
          <li><strong>3MF</strong> - newer format that preserves colour and scale information</li>
          <li><strong>STEP / STP</strong> - ideal for precision mechanical parts</li>
          <li><strong>OBJ</strong> - widely supported, good for organic shapes</li>
          <li><strong>ZIP</strong> - if you have multiple files</li>
        </ul>
        <p className="mt-2">Or simply paste a link from <strong>Thingiverse</strong>, <strong>MakerWorld</strong>, <strong>Printables</strong>, or <strong>MyMiniFactory</strong>.</p>
      </div>
    ),
  },
  {
    q: 'What if my print doesn\'t turn out right?',
    a: <p>You confirm delivery and inspect your order before the maker gets paid. If the print doesn&apos;t match the agreed spec, you can raise a dispute. We review the case and mediate between you and the maker. The maker only gets paid when you&apos;re satisfied - you&apos;re never forced to accept a bad result.</p>,
  },
  {
    q: 'How long does it take to receive my print?',
    a: <p>Most simple jobs receive their first quotes within a few hours. Once you accept a quote and pay, production typically takes 1-3 days depending on size and complexity. Shipping typically adds 1-4 days depending on your location. For urgent jobs, mention your deadline in the request - makers can flag whether they can meet it.</p>,
  },
  {
    q: 'Can I pick up my print in person instead of having it shipped?',
    a: <p>Yes. When posting your request, you can tick &quot;Pickup OK&quot; and makers near you will be able to offer local collection. This can be faster and cheaper for larger prints.</p>,
  },
  {
    q: 'What materials are available?',
    a: (
      <div className="space-y-1">
        <p>Available materials depend on which makers are in your area and their machines. Common options include:</p>
        <ul className="list-disc pl-4 space-y-1 mt-2">
          <li><strong>PLA</strong> - affordable, easy to print, great for decorative or low-stress parts</li>
          <li><strong>PETG</strong> - stronger and more heat-resistant than PLA</li>
          <li><strong>ABS</strong> - tough, good for mechanical parts</li>
          <li><strong>TPU</strong> - flexible, rubber-like material</li>
          <li><strong>Resin (SLA/MSLA)</strong> - ultra-high detail for small parts and miniatures</li>
          <li><strong>Nylon, ASA, Polycarbonate</strong> - engineering-grade, available from certified makers</li>
        </ul>
        <p className="mt-2">Specify your preferred material in the request and makers who can fulfil it will quote you.</p>
      </div>
    ),
  },
  {
    q: 'Do I need an account to post a request?',
    a: <p>You can browse and preview the form as a guest, but you&apos;ll need a free account to submit a request and receive quotes. Registration takes under a minute - no credit card required.</p>,
  },
]

const makerFAQ = [
  {
    q: 'How do I get started as a maker?',
    a: (
      <p>
        Create an account, choose the &quot;Maker&quot; role, and complete your profile - add your machines, the materials you stock, and a short bio. Once your profile is set up, you can browse open requests and start quoting.{' '}
        <Link href="/for-makers" className="text-ink-600 underline hover:text-ink-800">See the full maker guide →</Link>
      </p>
    ),
  },
  {
    q: 'What are the fees?',
    a: <p>It&apos;s free to join and free to quote. PrintMarketHub takes a <strong>12% platform fee</strong> only when a job is successfully completed. There are no monthly subscriptions, no listing fees, and no charges if a job doesn&apos;t go ahead.</p>,
  },
  {
    q: 'How and when do I get paid?',
    a: <p>When a client accepts your quote and pays, Stripe processes the payment. Once the client confirms delivery, Stripe sends the payout (minus the platform fee) to your connected Stripe account. Payouts typically arrive within 2 business days depending on your bank.</p>,
  },
  {
    q: 'Do I need to be a professional printer?',
    a: <p>Not at all. Many of our makers are hobbyists who print from home. As long as you have a reliable printer, produce quality results, and communicate well with clients, you&apos;re welcome. For high-tolerance engineering jobs there&apos;s an optional certification process - but it&apos;s not required for standard prints.</p>,
  },
  {
    q: 'Can I decline jobs or set my own prices?',
    a: <p>Absolutely. You only quote on jobs you want to take. You set your own price for each quote - there&apos;s no price floor or ceiling imposed by the platform. You can also specify lead times and ask clarifying questions before committing.</p>,
  },
  {
    q: 'What if a client disputes my work?',
    a: <p>We mediate disputes fairly based on the agreed job spec. If you delivered what was described and agreed, you&apos;re protected. We recommend keeping all communication on-platform and clarifying any ambiguities before starting a job - this creates a clear record if anything is disputed.</p>,
  },
  {
    q: 'What happens if a client doesn\'t confirm delivery?',
    a: <p>If a client doesn&apos;t confirm delivery within 7 days of the job being marked as shipped, the platform automatically processes the payout to you. This ensures you&apos;re not stuck waiting indefinitely.</p>,
  },
  {
    q: 'Can I pause my account if I\'m too busy?',
    a: <p>Yes. You can simply stop quoting on new jobs at any time - there&apos;s no penalty. You can also update your profile to indicate longer lead times so clients know what to expect.</p>,
  },
]

export default function FAQPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-12">

      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-black text-ink-900 tracking-tight">Frequently asked questions</h1>
        <p className="text-warm-500 text-base">
          Can&apos;t find your answer?{' '}
          <a href="mailto:admin@printmarkethub.com" className="text-ink-600 underline hover:text-ink-800">
            Email us
          </a>{' '}
          and we&apos;ll get back to you within 24 hours.
        </p>
      </div>

      <FAQSection title="For clients" icon="🛒" items={clientFAQ} />
      <FAQSection title="For makers" icon="🖨️" items={makerFAQ} />

      {/* CTA */}
      <div className="rounded-2xl bg-[#1a1535] text-white p-8 text-center space-y-4">
        <p className="text-xl font-bold">Ready to get started?</p>
        <p className="text-[#CEC8E4] text-sm">Join for free - no credit card required.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/signup?role=client"
            className="rounded-xl bg-[#D4A017] text-[#1a1535] font-bold px-5 py-2.5 text-sm hover:bg-[#c49015] transition-colors">
            I need something printed →
          </Link>
          <Link href="/signup?role=maker"
            className="rounded-xl border border-white/20 text-white font-semibold px-5 py-2.5 text-sm hover:bg-white/10 transition-colors">
            I have a printer
          </Link>
        </div>
      </div>

    </div>
  )
}
