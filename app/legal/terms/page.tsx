import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service | PrintMarketHub' }

const LAST_UPDATED = '20 May 2025'

export default function TermsPage() {
  return (
    <article className="prose-legal">
      <LegalHeader title="Terms of Service" updated={LAST_UPDATED} />

      <Section n="1" title="Acceptance of Terms">
        <p>By accessing or using the PrintMarketHub platform ("Platform", "Service") operated by PrintMarketHub ("Company", "we", "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you must not use the Platform.</p>
        <p>These Terms apply to all users including clients who post jobs ("Clients") and makers who fulfil orders ("Makers"). Additional terms apply to Makers and are set out in the Maker / Seller Terms.</p>
      </Section>

      <Section n="2" title="Platform Role - Marketplace Intermediary">
        <p>PrintMarketHub operates exclusively as a <strong>marketplace intermediary</strong>. We connect Clients seeking 3D printing services with independent Makers. We do not manufacture, inspect, ship, or take possession of any physical goods.</p>
        <p>PrintMarketHub is not a party to any contract formed between a Client and a Maker. We do not guarantee the quality, safety, legality, or timely delivery of any goods or services transacted through the Platform.</p>
      </Section>

      <Section n="3" title="Account Registration">
        <p>You must create an account to use the Platform. You agree to provide accurate, current, and complete information and to keep it updated. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account.</p>
        <p>You must be at least 18 years of age or the legal age of majority in your jurisdiction to register. By registering, you represent that you meet this requirement.</p>
        <p>We reserve the right to suspend or terminate any account that violates these Terms, provides false information, or engages in fraudulent activity.</p>
      </Section>

      <Section n="4" title="Job Posting and Quoting">
        <p>Clients may post manufacturing jobs including specifications, reference images, and 3D model files (STL, STEP, 3MF, OBJ, ZIP). By posting a job, the Client warrants that they own or have the right to use all uploaded files and that the requested item is lawful.</p>
        <p>Makers may submit quotes on open jobs. Quotes are binding offers. A contract between Client and Maker is formed when a Client accepts a quote.</p>
        <p>Quotes expire after 3 days unless otherwise agreed. PrintMarketHub does not guarantee response times or the number of quotes received.</p>
      </Section>

      <Section n="5" title="Payments">
        <p>All payments are processed through <strong>Stripe, Inc.</strong> pursuant to Stripe's own Terms of Service. By making or receiving payments on the Platform, you agree to be bound by Stripe's applicable policies.</p>
        <p>Upon quote acceptance, the Client's payment is collected by Stripe. The Maker's payout is processed via Stripe once the Client confirms delivery or the dispute resolution period expires.</p>
        <p>PrintMarketHub charges a <strong>12% platform commission</strong> on each successfully completed transaction. This commission is deducted from the Maker's payout upon completion. Rates may be updated with 30 days' written notice.</p>
        <p>Payments are processed in the currency selected by the Client. Supported payment methods include credit/debit card and bank transfer as made available by Stripe for your region.</p>
      </Section>

      <Section n="6" title="File Uploads and Intellectual Property">
        <p>You retain ownership of all 3D model files, designs, and content you upload to the Platform ("User Content"). By uploading, you grant PrintMarketHub a limited, non-exclusive licence to store, process, and display your content solely as necessary to operate the Platform.</p>
        <p>3D model files uploaded by Clients are accessible only to the Maker assigned to the relevant job. Files are not shared with other users, third parties, or competing bidders. For full details see our Privacy Policy.</p>
        <p>You must not upload files that infringe any third-party intellectual property rights, including patents, trademarks, or copyrights. This includes unlicensed replicas of branded, patented, or copyright-protected objects.</p>
        <p>PrintMarketHub respects intellectual property rights. We will respond to valid DMCA or equivalent notices and may remove infringing content and terminate repeat infringers' accounts.</p>
      </Section>

      <Section n="7" title="Prohibited Content and Conduct">
        <p>The following are strictly prohibited on the Platform:</p>
        <ul>
          <li>Weapons, weapon components, or items designed to cause bodily harm</li>
          <li>Items that are illegal in Switzerland or the recipient's jurisdiction</li>
          <li>Counterfeit goods or unlicensed replicas of trademarked products</li>
          <li>Items that infringe third-party intellectual property rights</li>
          <li>Dangerous, toxic, or hazardous products not clearly disclosed</li>
          <li>Adult content, hate speech, or material that promotes discrimination</li>
          <li>Fraudulent listings or misrepresentations</li>
          <li>Any activity that circumvents Platform security or payment systems</li>
        </ul>
        <p>We reserve the right to remove any listing, file, or content that we determine, in our sole discretion, violates these Terms or applicable law.</p>
      </Section>

      <Section n="8" title="Moderation and Account Termination">
        <p>PrintMarketHub may, without prior notice, remove content, suspend, or permanently terminate any account that violates these Terms, poses a risk to other users, or is subject to a legal order.</p>
        <p>Users may appeal account suspensions by contacting <a href="mailto:admin@printmarkethub.com">admin@printmarkethub.com</a>. Appeals are reviewed within 10 business days.</p>
        <p>Upon termination, your right to use the Platform ceases immediately. Provisions that by their nature should survive termination (including IP ownership, limitation of liability, and governing law) shall survive.</p>
      </Section>

      <Section n="9" title="No Guarantee of Dimensional Accuracy">
        <p>PrintMarketHub makes no representation or warranty regarding the dimensional accuracy, structural integrity, material properties, or fitness for purpose of any manufactured part. Dimensional tolerance, surface finish, and mechanical performance are the sole responsibility of the Maker.</p>
        <p>Clients should verify that the specifications provided in their job posting are complete and accurate before accepting a quote.</p>
      </Section>

      <Section n="10" title="Limitation of Liability">
        <p>To the fullest extent permitted by Swiss law, PrintMarketHub, its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of the Platform.</p>
        <p>Our aggregate liability to you for any direct damages shall not exceed the total fees paid by you to PrintMarketHub in the 12 months preceding the claim.</p>
        <p>Nothing in these Terms excludes liability for death or personal injury caused by our negligence, or for fraud or wilful misconduct.</p>
      </Section>

      <Section n="11" title="Governing Law and Dispute Resolution">
        <p>These Terms are governed by Swiss law. The courts of the Canton of Zurich shall have exclusive jurisdiction over any dispute arising from or in connection with these Terms, subject to mandatory consumer protection provisions that may apply in your country of residence.</p>
        <p>Disputes between Clients and Makers are handled through the Platform's dispute resolution process described in the Refund & Dispute Policy. PrintMarketHub's role in such disputes is that of a neutral facilitator, not an arbitrator.</p>
      </Section>

      <Section n="12" title="Changes to These Terms">
        <p>We may update these Terms from time to time. We will provide at least 14 days' notice of material changes via email or in-platform notification. Your continued use of the Platform after the effective date constitutes acceptance of the revised Terms.</p>
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
