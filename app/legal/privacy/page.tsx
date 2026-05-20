import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy | PrintMarketHub' }

const LAST_UPDATED = '20 May 2025'

export default function PrivacyPage() {
  return (
    <article>
      <LegalHeader title="Privacy Policy" updated={LAST_UPDATED} />
      <p className="text-sm text-warm-600 mb-8 leading-relaxed">
        This Privacy Policy explains how PrintMarketHub ("we", "us") collects, uses, stores, and shares your personal data. It applies to all users of <strong className="text-ink-900">printmarkethub.com</strong> and is compliant with the <strong className="text-ink-900">EU General Data Protection Regulation (GDPR)</strong> and the <strong className="text-ink-900">Swiss Federal Act on Data Protection (FADP / nDSG)</strong>.
      </p>

      <Section n="1" title="Data Controller">
        <p>The data controller responsible for your personal data is:</p>
        <div className="rounded-xl bg-warm-100 border border-warm-200 px-5 py-4 font-mono text-xs text-ink-700 space-y-0.5">
          <p className="font-bold">PrintMarketHub</p>
          <p>[Street Address]</p>
          <p>[City, Postal Code], Switzerland</p>
          <p>Email: <a href="mailto:admin@printmakerhub.com">admin@printmakerhub.com</a></p>
        </div>
      </Section>

      <Section n="2" title="Data We Collect">
        <p>We collect the following categories of personal data:</p>
        <Table rows={[
          ['Account data', 'Name, email address, password hash, user role, registration date'],
          ['Profile data', 'Display name, city, location coordinates, bio, printer specifications, certification level'],
          ['Job and transaction data', 'Job descriptions, specifications, quotes, accepted prices, payment status, shipping status'],
          ['Uploaded files', '3D model files (STL, STEP, 3MF, OBJ), reference images, and any other files you upload'],
          ['Payment data', 'Payment method type, transaction IDs. Full card details are processed exclusively by Stripe and are never stored by us.'],
          ['Communications', 'Messages sent through the platform between Clients and Makers'],
          ['Location data', 'Address and coordinates you provide for job or profile location purposes'],
          ['Usage data', 'IP address, browser type, pages visited, and interaction logs for security and analytics purposes'],
        ]} />
      </Section>

      <Section n="3" title="Legal Basis for Processing (GDPR Art. 6 / FADP)">
        <Table rows={[
          ['Contract performance', 'Processing necessary to deliver the marketplace service, process payments, and fulfil orders'],
          ['Legitimate interests', 'Fraud prevention, platform security, dispute resolution, improving the service'],
          ['Legal obligation', 'Compliance with Swiss law, tax obligations, and court orders'],
          ['Consent', 'Non-essential cookies, marketing communications (where applicable)'],
        ]} />
      </Section>

      <Section n="4" title="File Confidentiality">
        <p>3D model files and design files uploaded by Clients are treated as confidential. Access is restricted to:</p>
        <ul>
          <li>The uploading Client</li>
          <li>The specific Maker assigned to the relevant job</li>
          <li>PrintMarketHub staff solely for dispute resolution or legal compliance purposes</li>
        </ul>
        <p>Files are stored in a secure, access-controlled cloud storage environment. We do not use uploaded design files for any purpose other than facilitating the requested transaction. Files are not shared with third parties, used for training AI models, or made publicly accessible.</p>
      </Section>

      <Section n="5" title="How We Use Your Data">
        <ul>
          <li>Create and manage your account</li>
          <li>Connect Clients with Makers and facilitate job transactions</li>
          <li>Process payments and manage escrow via Stripe</li>
          <li>Send transactional notifications (job updates, quotes, payment confirmations)</li>
          <li>Resolve disputes between Clients and Makers</li>
          <li>Detect and prevent fraud, abuse, and security incidents</li>
          <li>Comply with legal and regulatory obligations</li>
          <li>Improve and maintain the Platform</li>
        </ul>
      </Section>

      <Section n="6" title="Data Sharing and Sub-processors">
        <p>We share your data with the following third-party service providers solely to operate the Platform:</p>
        <Table rows={[
          ['Stripe, Inc.', 'Payment processing and escrow management', 'United States (SCCs in place)'],
          ['Supabase, Inc.', 'Database hosting and authentication', 'European Union'],
          ['Resend, Inc.', 'Transactional email delivery', 'United States (SCCs in place)'],
          ['Google LLC', 'Maps JavaScript API and Places API for location features', 'United States (SCCs in place)'],
          ['Vercel, Inc.', 'Platform hosting and content delivery', 'United States (SCCs in place)'],
        ]} headers={['Provider', 'Purpose', 'Location']} />
        <p>We do not sell your personal data to third parties. We do not share your data with advertisers.</p>
      </Section>

      <Section n="7" title="International Data Transfers">
        <p>Some of our sub-processors are located outside Switzerland and the European Economic Area. Where data is transferred internationally, we rely on appropriate safeguards including Standard Contractual Clauses (SCCs) approved by the European Commission and recognised by the Swiss Federal Data Protection Commissioner (FDPIC).</p>
      </Section>

      <Section n="8" title="Data Retention">
        <p>We retain your personal data for as long as your account is active and for a period of <strong>5 years</strong> thereafter for legal, tax, and dispute resolution purposes, unless a longer retention period is required by law.</p>
        <p>Uploaded 3D model files are retained for the duration of the relevant job and 12 months thereafter, after which they are permanently deleted unless you request earlier deletion.</p>
      </Section>

      <Section n="9" title="Your Rights">
        <p>Under GDPR and the Swiss FADP, you have the following rights:</p>
        <Table rows={[
          ['Access', 'Request a copy of the personal data we hold about you'],
          ['Rectification', 'Correct inaccurate or incomplete data'],
          ['Erasure', 'Request deletion of your data (subject to legal retention obligations)'],
          ['Portability', 'Receive your data in a structured, machine-readable format'],
          ['Restriction', 'Request that we restrict processing in certain circumstances'],
          ['Objection', 'Object to processing based on legitimate interests'],
          ['Withdrawal of consent', 'Withdraw consent at any time where processing is consent-based'],
        ]} />
        <p>To exercise your rights, email <a href="mailto:admin@printmakerhub.com">admin@printmakerhub.com</a>. We will respond within 30 days. You also have the right to lodge a complaint with the Swiss Federal Data Protection Commissioner (FDPIC) or your national data protection authority.</p>
      </Section>

      <Section n="10" title="Security">
        <p>We implement appropriate technical and organisational measures to protect your data, including TLS encryption in transit, access controls, and regular security reviews. However, no internet-based service can guarantee absolute security.</p>
      </Section>

      <Section n="11" title="Children's Privacy">
        <p>The Platform is not directed at persons under 18 years of age. We do not knowingly collect data from minors. If we become aware that a minor has provided data, we will delete it promptly.</p>
      </Section>

      <Section n="12" title="Changes to This Policy">
        <p>We may update this Privacy Policy periodically. We will notify you of material changes via email or in-platform notice with at least 14 days' notice before the changes take effect.</p>
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
      <div className="space-y-3 text-sm text-warm-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-ink-900 [&_a]:text-ink-700 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-gold-600">
        {children}
      </div>
    </section>
  )
}

function Table({ rows, headers }: { rows: string[][]; headers?: string[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-warm-200 mt-2">
      <table className="w-full text-xs">
        {headers && (
          <thead className="bg-warm-100">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-bold text-ink-700 border-b border-warm-200">{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-warm-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-warm-50">
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-3 text-warm-700 ${j === 0 ? 'font-semibold text-ink-800 whitespace-nowrap' : ''}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
