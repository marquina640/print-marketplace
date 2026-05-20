import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Impressum | PrintMarketHub' }

const LAST_UPDATED = '20 May 2025'

export default function ImpressumPage() {
  return (
    <article>
      <LegalHeader title="Impressum" updated={LAST_UPDATED} />

      <p className="text-sm text-warm-600 mb-8 leading-relaxed">
        This legal notice is provided in accordance with Swiss law and the European e-commerce directive. The Impressum identifies the responsible operator of the PrintMarketHub platform.
      </p>

      <div className="grid sm:grid-cols-2 gap-5 mb-10">
        <InfoCard title="Company">
          <Row label="Name" value="PrintMarketHub" />
          <Row label="Founded" value="2025" />
          <Row label="Country" value="Switzerland" />
        </InfoCard>

        <InfoCard title="Contact">
          <Row label="Email" value="admin@printmakerhub.com" link="mailto:admin@printmakerhub.com" />
          <Row label="Website" value="www.printmarkethub.com" link="https://www.printmarkethub.com" />
        </InfoCard>
      </div>

      <Section n="1" title="Platform Description">
        <p>PrintMarketHub operates as an online marketplace connecting clients who require custom 3D printed parts with independent makers (3D printer operators). The platform facilitates job postings, quote submissions, secure payment processing, and order tracking.</p>
        <p>PrintMarketHub acts exclusively as an intermediary and is not a manufacturer, shipper, or guarantor of any goods or services transacted through the platform.</p>
      </Section>

      <Section n="2" title="Disclaimer">
        <p>Despite careful content review, we assume no liability for the content of external links. The operators of linked pages are solely responsible for their content.</p>
        <p>All content published on this platform is protected by copyright. Any reproduction, distribution, or public display requires the prior written consent of PrintMarketHub, unless expressly permitted by law.</p>
      </Section>

      <Section n="3" title="Dispute Resolution">
        <p>The European Commission provides an online dispute resolution platform for consumer disputes at <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.</p>
        <p>We are not obligated to participate in dispute resolution before a consumer arbitration board, but we are willing to seek an amicable resolution directly. Please contact us at <a href="mailto:admin@printmakerhub.com">admin@printmakerhub.com</a> in the first instance.</p>
      </Section>

      <Section n="4" title="Applicable Law">
        <p>This Impressum and all related legal matters are governed by Swiss law. The place of jurisdiction is the Canton of Zurich, Switzerland.</p>
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
      <div className="space-y-3 text-sm text-warm-700 leading-relaxed [&_a]:text-ink-700 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-gold-600">
        {children}
      </div>
    </section>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-warm-200 bg-white p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-warm-400 mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-warm-400 w-28 flex-shrink-0">{label}</span>
      {link ? (
        <a href={link} className="text-ink-700 underline underline-offset-2 hover:text-gold-600 font-medium">{value}</a>
      ) : (
        <span className="text-ink-800 font-medium">{value}</span>
      )}
    </div>
  )
}
