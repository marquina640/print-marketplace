import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Refund & Dispute Policy | PrintMarketHub' }

const LAST_UPDATED = '20 May 2025'

export default function RefundsPage() {
  return (
    <article>
      <LegalHeader title="Refund & Dispute Policy" updated={LAST_UPDATED} />

      <p className="text-sm text-warm-600 mb-8 leading-relaxed">
        This policy explains how PrintMarketHub handles escrow payments, delivery confirmation, refunds, and disputes between Clients and Makers. PrintMarketHub acts as a neutral facilitator - not an arbitrator - in any dispute.
      </p>

      <Section n="1" title="Escrow Mechanism">
        <p>When a Client accepts a Maker's quote, payment is immediately collected by PrintMarketHub via Stripe and held in escrow. The Maker does not receive funds until one of the following occurs:</p>
        <ul>
          <li>The Client confirms successful delivery of the order</li>
          <li>The automatic confirmation period expires without a dispute being raised</li>
          <li>A dispute is resolved in the Maker's favour</li>
        </ul>
        <p>Escrow protects both parties: Clients are assured payment is only released upon satisfactory delivery; Makers are assured payment is secured before production begins.</p>
      </Section>

      <Section n="2" title="Order Lifecycle">
        <div className="rounded-xl border border-warm-200 overflow-hidden">
          {[
            ['1', 'Accepted', 'Client accepts a quote. Stripe payment collected. Funds held in escrow.'],
            ['2', 'In Production', 'Maker begins manufacturing. Escrow funds remain held.'],
            ['3', 'Shipped', 'Maker marks the order as shipped and provides tracking information.'],
            ['4', 'Delivered', 'Client confirms receipt of the order.'],
            ['5', 'Completed', 'PrintMarketHub releases escrow funds to the Maker (less commission).'],
          ].map(([step, status, desc]) => (
            <div key={step} className="flex gap-4 p-4 border-b border-warm-100 last:border-0 hover:bg-warm-50">
              <div className="h-7 w-7 rounded-full bg-gold-400 flex items-center justify-center text-[11px] font-black text-ink-950 flex-shrink-0">{step}</div>
              <div>
                <p className="font-semibold text-ink-800 text-sm">{status}</p>
                <p className="text-xs text-warm-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section n="3" title="Delivery Confirmation">
        <p>Upon receiving their order, Clients must confirm delivery through the Platform. This releases the escrow funds to the Maker.</p>
        <p>If a Client does not confirm delivery within <strong>7 days</strong> of the Maker marking the order as delivered, and no dispute has been opened, PrintMarketHub reserves the right to release the funds to the Maker automatically.</p>
        <p>Clients should inspect their order promptly upon receipt and raise any concerns before confirming delivery.</p>
      </Section>

      <Section n="4" title="Opening a Dispute">
        <p>A Client may open a dispute if:</p>
        <ul>
          <li>The order was not received within the agreed lead time plus a reasonable additional period</li>
          <li>The manufactured part materially differs from the agreed specifications</li>
          <li>The part arrived damaged due to inadequate packaging by the Maker</li>
          <li>The Maker used materials materially different from those stated in the quote</li>
        </ul>
        <p>To open a dispute, the Client must:</p>
        <ol>
          <li>Navigate to the relevant job page and click "Open Dispute"</li>
          <li>Provide a written description of the issue</li>
          <li>Upload photographic or other evidence (required)</li>
        </ol>
        <p>Disputes must be opened <strong>within 7 days</strong> of the order being marked as delivered, or within 14 days of the agreed delivery deadline if the order was never marked as delivered.</p>
      </Section>

      <Section n="5" title="Dispute Resolution Process">
        <p>Once a dispute is opened:</p>
        <ul>
          <li>The escrow funds are frozen pending resolution</li>
          <li>The Maker is notified and has <strong>5 business days</strong> to respond with their position and evidence</li>
          <li>PrintMarketHub reviews all evidence and communicates a recommended resolution within <strong>10 business days</strong></li>
          <li>Both parties are encouraged to accept the recommendation</li>
          <li>If both parties accept, the escrow is distributed accordingly</li>
          <li>If a party rejects the recommendation, they may escalate to formal mediation at their own cost</li>
        </ul>
        <p>PrintMarketHub's role is that of a neutral facilitator. Our recommended resolution is not legally binding but is made in good faith based on the evidence provided.</p>
      </Section>

      <Section n="6" title="Refund Conditions">
        <p>Full refunds to the Client are granted when:</p>
        <ul>
          <li>The Maker cancels or fails to complete the order</li>
          <li>The order is not delivered within 30 days of the agreed deadline and no extension was agreed</li>
          <li>A dispute is resolved entirely in the Client's favour</li>
        </ul>
        <p>Partial refunds may be issued when:</p>
        <ul>
          <li>The order is partially delivered or partially meets specifications</li>
          <li>A dispute is resolved in partial favour of the Client</li>
          <li>The Maker and Client agree on a partial refund</li>
        </ul>
      </Section>

      <Section n="7" title="Non-Refundable Situations">
        <p>Refunds will generally not be issued in the following circumstances:</p>
        <ul>
          <li>The Client provided incorrect or incomplete specifications and the Maker manufactured to those specifications</li>
          <li>The Client changed their mind after production commenced</li>
          <li>Minor dimensional variation within the stated tolerance range of the Maker's equipment</li>
          <li>Dissatisfaction with the aesthetic appearance of a part that was manufactured to specification</li>
          <li>Delays caused by third-party couriers or customs beyond the Maker's control</li>
        </ul>
      </Section>

      <Section n="8" title="Chargebacks">
        <p>If a Client initiates a chargeback with their bank or Stripe without first going through the Platform dispute process, PrintMarketHub reserves the right to:</p>
        <ul>
          <li>Suspend the Client's account pending investigation</li>
          <li>Reverse any platform credits or discounts associated with the transaction</li>
          <li>Share transaction evidence with Stripe and the issuing bank</li>
        </ul>
        <p>Fraudulent chargebacks may result in permanent account termination and recovery proceedings.</p>
      </Section>

      <Section n="9" title="Platform Liability in Disputes">
        <p>PrintMarketHub is not financially liable for the outcome of any transaction between a Client and a Maker. Our liability is limited to the amount of commission fees collected on the disputed transaction. We do not reimburse Clients from our own funds except in cases where the dispute arises from a Platform error or technical failure attributable to PrintMarketHub.</p>
      </Section>

      <Section n="10" title="Contact">
        <p>For questions about this policy or to escalate a dispute, contact us at <a href="mailto:admin@printmakerhub.com" className="text-ink-700 underline underline-offset-2 hover:text-gold-600">admin@printmakerhub.com</a>. Please include your job ID and a summary of the issue.</p>
      </Section>
    </article>
  )
}

function LegalHeader({ title, updated }: { title: string; updated: string }) {
  return (
    <div className="mb-10 pb-8 border-b border-warm-200">
      <p className="text-xs font-bold uppercase tracking-widest text-gold-600 mb-3">PrintMarketHub Legal</p>
      <h1 className="text-3xl font-black text-ink-950 tracking-tight mb-3">{title}</h1>
      <p className="text-sm text-warm-400">Last updated: {updated}</p>
    </div>
  )
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-ink-900 mb-3 flex items-baseline gap-2">
        <span className="text-gold-500 font-mono text-sm">{n}.</span>
        {title}
      </h2>
      <div className="space-y-3 text-sm text-warm-700 leading-relaxed [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-ink-900 [&_a]:text-ink-700 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-gold-600">
        {children}
      </div>
    </section>
  )
}
