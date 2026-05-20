import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Acceptable Use Policy | PrintMarketHub' }

const LAST_UPDATED = '20 May 2025'

export default function AcceptableUsePage() {
  return (
    <article>
      <LegalHeader title="Acceptable Use Policy" updated={LAST_UPDATED} />

      <p className="text-sm text-warm-600 mb-8 leading-relaxed">
        This Acceptable Use Policy ("AUP") defines conduct and content that is prohibited on the PrintMarketHub platform. All users — Clients, Makers, and visitors — must comply with this policy. Violations may result in immediate account suspension or termination.
      </p>

      <Section n="1" title="Prohibited Items and Services">
        <p>The following categories of items may not be listed, requested, designed, manufactured, or facilitated through the Platform:</p>

        <SubSection title="Weapons and Dangerous Items">
          <ul>
            <li>Firearms, firearm components, suppressors, or any part that converts a legal firearm to fire automatically</li>
            <li>Items designed to defeat metal detectors, security screening, or ballistic protection</li>
            <li>Bladed or impact weapons designed primarily to harm persons</li>
            <li>Explosive devices, components, or triggering mechanisms</li>
            <li>Items designed to administer controlled substances without consent</li>
          </ul>
        </SubSection>

        <SubSection title="Illegal Products">
          <ul>
            <li>Any item whose manufacture, possession, or distribution is illegal under Swiss law or the law of the destination country</li>
            <li>Counterfeit currency, documents, or identity materials</li>
            <li>Items used to facilitate human trafficking, illegal surveillance, or stalking</li>
          </ul>
        </SubSection>

        <SubSection title="Intellectual Property Violations">
          <ul>
            <li>Unauthorised replicas of trademarked products (e.g. branded logo items, counterfeit goods)</li>
            <li>Reproductions of copyright-protected characters, sculptures, or designs without a valid licence</li>
            <li>Items based on third-party patent-protected designs without authorisation</li>
            <li>Files that reproduce the proprietary designs of another party</li>
          </ul>
        </SubSection>

        <SubSection title="Hazardous and Deceptive Products">
          <ul>
            <li>Items intended to contaminate food, water supplies, or air</li>
            <li>Products misrepresented as certified, safety-tested, or medically approved without valid certification</li>
            <li>Items designed to deceive consumers regarding their material, origin, or function</li>
          </ul>
        </SubSection>
      </Section>

      <Section n="2" title="Prohibited Conduct">
        <p>The following conduct is prohibited regardless of whether the associated content is otherwise permitted:</p>
        <ul>
          <li>Creating multiple accounts to evade a suspension or ban</li>
          <li>Manipulating the Platform's rating or review system</li>
          <li>Attempting to conduct transactions outside the Platform to avoid commission fees</li>
          <li>Harassing, threatening, or abusing other users</li>
          <li>Posting false, misleading, or deceptive information in job listings or quotes</li>
          <li>Uploading malicious files, scripts, or exploits</li>
          <li>Scraping, reverse engineering, or copying Platform content without written permission</li>
          <li>Using the Platform for money laundering or other financial crimes</li>
          <li>Impersonating another user, company, or public figure</li>
        </ul>
      </Section>

      <Section n="3" title="User-Generated Content">
        <p>All content posted on the Platform — including job descriptions, profile bios, images, messages, and reviews — must be accurate, lawful, and respectful. You must not post:</p>
        <ul>
          <li>Content that is defamatory, discriminatory, or promotes hatred based on race, gender, religion, nationality, sexual orientation, or disability</li>
          <li>Sexually explicit content</li>
          <li>Content that infringes any third-party rights</li>
          <li>Spam, unsolicited promotions, or off-platform solicitations</li>
        </ul>
        <p>PrintMarketHub reserves the right to remove any content that violates this policy or that we determine, in our sole discretion, to be harmful, offensive, or contrary to the interests of the Platform community.</p>
      </Section>

      <Section n="4" title="Intellectual Property Reporting">
        <p>If you believe a listing, file, or piece of content on the Platform infringes your intellectual property rights, please submit a report to <a href="mailto:admin@printmakerhub.com" className="text-ink-700 underline underline-offset-2 hover:text-gold-600">admin@printmakerhub.com</a> including:</p>
        <ul>
          <li>A description of the copyrighted work or trademark claimed to be infringed</li>
          <li>A link or description of the infringing material</li>
          <li>Your contact information and a statement confirming you have a good-faith belief of infringement</li>
        </ul>
        <p>We will review and respond to valid IP notices within 10 business days.</p>
      </Section>

      <Section n="5" title="Enforcement">
        <p>Violations of this AUP may result in:</p>
        <ul>
          <li>Removal of the offending content or listing</li>
          <li>Formal warning to the account holder</li>
          <li>Temporary suspension of account privileges</li>
          <li>Permanent account termination</li>
          <li>Reporting to relevant law enforcement authorities</li>
          <li>Legal action where appropriate</li>
        </ul>
        <p>PrintMarketHub will cooperate fully with law enforcement agencies investigating illegal use of our Platform. Where legally required or permitted, we will disclose user data to such authorities.</p>
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
      <div className="space-y-4 text-sm text-warm-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-ink-900">
        {children}
      </div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-warm-200 bg-white p-4">
      <p className="font-bold text-ink-800 text-xs uppercase tracking-wide mb-2">{title}</p>
      <div className="text-sm text-warm-700 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">{children}</div>
    </div>
  )
}
