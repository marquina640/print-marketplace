import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Maker / Seller Terms | PrintMarketHub' }

const LAST_UPDATED = '20 May 2025'

export default function MakerTermsPage() {
  return (
    <article>
      <LegalHeader title="Maker / Seller Terms" updated={LAST_UPDATED} />

      <p className="text-sm text-warm-600 mb-8 leading-relaxed">
        These Maker / Seller Terms ("Maker Terms") apply in addition to the general Terms of Service to all users who register as Makers (printer owners offering manufacturing services) on the PrintMarketHub platform. By activating a Maker account, you agree to these Maker Terms.
      </p>

      <Section n="1" title="Independent Contractor Status">
        <p>Makers are <strong>independent contractors</strong>, not employees, agents, or representatives of PrintMarketHub. PrintMarketHub is a marketplace intermediary only. Nothing in these Maker Terms creates an employment relationship, partnership, or joint venture between PrintMarketHub and the Maker.</p>
        <p>As an independent contractor, you are solely responsible for:</p>
        <ul>
          <li>The quality, safety, and legality of every item you manufacture</li>
          <li>Compliance with all applicable laws and regulations in your jurisdiction</li>
          <li>Your own insurance, including product liability insurance where relevant</li>
          <li>Your own tax obligations, including VAT registration and income reporting</li>
          <li>Your own equipment, materials, workspace, and labour costs</li>
        </ul>
      </Section>

      <Section n="2" title="Platform Commission and Fees">
        <p>PrintMarketHub charges a commission on each successfully completed order. The current commission rate is displayed in your Maker dashboard settings and on our pricing page.</p>
        <p>Commission is deducted automatically from the payment at the time of release. You will receive the net amount (order value minus commission) to your registered payment account via Stripe.</p>
        <p>PrintMarketHub reserves the right to modify commission rates with 30 days' written notice. Continued use of the Platform after the notice period constitutes acceptance of the revised rates.</p>
        <p>No commission is charged on orders that are refunded in full. Partial refunds may result in proportionally reduced commissions at our discretion.</p>
      </Section>

      <Section n="3" title="Manufacturing Quality Standards">
        <p>Makers are solely responsible for the quality of manufactured parts. By accepting a quote and receiving payment, you warrant that:</p>
        <ul>
          <li>You have the equipment, skills, and materials to complete the job as specified</li>
          <li>The part will be manufactured in accordance with the specifications provided in the job posting</li>
          <li>The materials used are as stated in your quote</li>
          <li>The part is safe for its intended use as described by the Client</li>
        </ul>
        <p>PrintMarketHub does not inspect, certify, or warrant any manufactured part. The Maker bears full responsibility for manufacturing quality and fitness for purpose.</p>
      </Section>

      <Section n="4" title="No Guarantee of Dimensional Accuracy">
        <p>PrintMarketHub makes no guarantee regarding the dimensional accuracy, surface finish, structural integrity, or mechanical performance of any manufactured part. Makers must clearly communicate achievable tolerances to Clients in their quote and are responsible for ensuring their machines are calibrated and capable of meeting the stated specifications.</p>
        <p>Disputes arising from dimensional inaccuracies are handled under the Refund & Dispute Policy. Makers may be required to reprint or provide a partial refund where the deviation is material and clearly documented by the Client.</p>
      </Section>

      <Section n="5" title="File Handling and Confidentiality">
        <p>Client 3D model files (STL, STEP, 3MF, OBJ, and others) are shared with you for the sole purpose of manufacturing the requested part. You agree to:</p>
        <ul>
          <li>Use the files only to manufacture parts for the specific job they were shared with</li>
          <li>Not reproduce, distribute, resell, sublicense, or publicly share the files</li>
          <li>Not use the files as templates for other products without explicit written consent from the Client</li>
          <li>Delete or securely destroy files upon completion of the order or upon Client request</li>
          <li>Not claim ownership of or intellectual property rights in Client-supplied files</li>
        </ul>
        <p>Violation of these file confidentiality obligations may result in immediate account termination and legal action.</p>
      </Section>

      <Section n="6" title="Shipping and Delivery Responsibilities">
        <p>Unless the job specifies local pickup only, Makers are responsible for:</p>
        <ul>
          <li>Packaging parts safely and appropriately for transit</li>
          <li>Shipping to the address provided by the Client within the lead time stated in the accepted quote</li>
          <li>Providing a valid tracking number to the Client where available</li>
          <li>Bearing the risk of loss or damage until the package is delivered to the Client's address</li>
        </ul>
        <p>Shipping costs must be clearly stated in the quote. PrintMarketHub is not responsible for customs duties, import taxes, or delays caused by third-party carriers or customs authorities.</p>
      </Section>

      <Section n="7" title="Tax Obligations">
        <p>Makers are solely responsible for determining and fulfilling their tax obligations arising from transactions on the Platform, including income tax and VAT/MWST where applicable. PrintMarketHub does not withhold taxes on behalf of Makers.</p>
        <p>Makers registered for VAT in Switzerland must comply with Swiss VAT law. Makers in other jurisdictions are responsible for compliance with local tax regulations. PrintMarketHub provides transaction records in your dashboard for your bookkeeping purposes.</p>
      </Section>

      <Section n="8" title="Account Requirements">
        <p>To maintain a Maker account in good standing, you must:</p>
        <ul>
          <li>Keep your profile, machine listings, and material capabilities up to date</li>
          <li>Respond to open job quotes within a reasonable time</li>
          <li>Maintain a completion rate and quality rating consistent with platform standards</li>
          <li>Not misrepresent your capabilities, certification level, or equipment</li>
          <li>Comply with all applicable laws governing your manufacturing activities</li>
        </ul>
      </Section>

      <Section n="9" title="Certification Levels">
        <p>PrintMarketHub offers an optional voluntary certification programme. Certification levels are granted by PrintMarketHub following review of benchmark prints submitted by the Maker. Certification is not a guarantee of quality and may be revoked at any time if standards are no longer met or if complaints indicate a material decline in quality.</p>
        <p>Higher certification levels may unlock access to specialised job categories. Certification does not create any employment or agency relationship with PrintMarketHub.</p>
      </Section>

      <Section n="10" title="Suspension and Termination">
        <p>PrintMarketHub may suspend or terminate a Maker account at any time for violations of these Maker Terms, the general Terms of Service, the Acceptable Use Policy, or for:</p>
        <ul>
          <li>Persistent low quality ratings or unresolved client disputes</li>
          <li>Failure to complete accepted orders without reasonable justification</li>
          <li>Fraudulent activity, chargebacks, or payment manipulation</li>
          <li>Breach of file confidentiality obligations</li>
        </ul>
        <p>Upon termination, any pending payouts for completed and confirmed orders will be processed at the next scheduled payout cycle. Payouts for disputed or incomplete orders will be held pending resolution.</p>
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
      <div className="space-y-3 text-sm text-warm-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-ink-900">
        {children}
      </div>
    </section>
  )
}
