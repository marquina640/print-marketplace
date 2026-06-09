export const metadata = { title: 'Terms of Service - PrintMarketHub' }

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-warm-900">Terms of Service</h1>
        <p className="text-warm-500 text-sm mt-2">Last updated: May 2026</p>
      </div>

      <Section title="1. About PrintMarketHub">
        <p>
          PrintMarketHub ("the Platform", "we", "us") is an online marketplace that connects customers
          ("Clients") with independent 3D printing professionals ("Makers"). We are not a party to any
          transaction between Clients and Makers - we provide the tools, secure payment processing, and trust infrastructure
          that make those transactions possible.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <p>
          You must be at least 18 years old to use PrintMarketHub. By creating an account, you confirm
          that all information you provide is accurate and that you have the legal capacity to enter
          into binding agreements.
        </p>
      </Section>

      <Section title="3. Off-Platform Transactions Prohibited">
        <p className="font-semibold text-warm-900 mb-2">
          This is one of our most important rules.
        </p>
        <p>
          Users who are introduced through PrintMarketHub - whether through a job request, quote, or
          any other interaction - are strictly prohibited from conducting transactions outside the
          Platform for any job originating from that introduction.
        </p>
        <ul className="list-disc pl-5 mt-3 space-y-1">
          <li>You may not solicit or accept payment for Platform-introduced work outside of PrintMarketHub.</li>
          <li>You may not share personal contact details (email, phone, WhatsApp, social media) before a job has been paid for through the Platform.</li>
          <li>Attempting to circumvent the Platform's payment system is grounds for immediate account suspension.</li>
        </ul>
        <p className="mt-3">
          We automatically filter contact information from messages to enforce this policy. Repeated
          attempts to share contact details may result in permanent account termination.
        </p>
      </Section>

      <Section title="4. Platform Commission">
        <p>
          PrintMarketHub charges a platform commission on every transaction processed through the
          Platform. This fee is automatically deducted from the payment before funds are transferred
          to the Maker. The current rate is published on the{' '}
          <a href="/for-makers" className="underline">For Makers</a> page and in the Maker Terms.
        </p>
        <p className="mt-2">
          This fee covers payment processing, buyer protection, dispute resolution infrastructure,
          and platform maintenance.
        </p>
      </Section>

      <Section title="5. How Payments Work">
        <p>
          All payments are processed by Stripe, Inc. on behalf of the Maker. The Client pays at checkout
          and the Maker receives their payout via Stripe once the Client confirms delivery.
        </p>
        <ul className="list-disc pl-5 mt-3 space-y-1">
          <li>Clients must confirm receipt within a reasonable time after delivery.</li>
          <li>If a Client does not confirm within 14 days of the marked ship date, the payout is processed to the Maker automatically.</li>
          <li>Chargebacks initiated outside the Platform's dispute process may result in account suspension.</li>
        </ul>
      </Section>

      <Section title="6. Reviews">
        <p>
          After a job is completed, both parties are required to leave a review. Reviews are private
          until both parties have submitted theirs, after which they are published simultaneously.
          Users with 3 or more unreviewed completed jobs will be blocked from posting new requests
          or submitting new quotes until reviews are completed.
        </p>
        <p className="mt-2">
          Reviews must be honest and based on your genuine experience. Fake, misleading, or
          retaliatory reviews are prohibited and may be removed.
        </p>
      </Section>

      <Section title="7. Maker Obligations">
        <p>Makers agree to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Accurately represent their capabilities, equipment, and certifications.</li>
          <li>Fulfil accepted orders to the agreed specification, timeline, and quality.</li>
          <li>Connect a valid Stripe account to receive payments.</li>
          <li>Maintain professional communication with Clients through the Platform.</li>
          <li>Handle Client-provided files with confidentiality and not reuse them for any other purpose.</li>
        </ul>
      </Section>

      <Section title="8. Client Obligations">
        <p>Clients agree to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Provide accurate and complete information when posting a request.</li>
          <li>Only upload files they have the right to use and reproduce.</li>
          <li>Pay promptly once a quote is accepted.</li>
          <li>Confirm receipt honestly and in a timely manner after delivery.</li>
          <li>Not request prints of illegal, dangerous, or infringing items.</li>
        </ul>
      </Section>

      <Section title="9. Prohibited Content">
        <p>You may not use PrintMarketHub to print or facilitate the printing of:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Weapons, weapon components, or anything designed to cause harm.</li>
          <li>Counterfeit goods or items that infringe third-party intellectual property.</li>
          <li>Anything illegal under Swiss law or the law of the user's jurisdiction.</li>
        </ul>
      </Section>

      <Section title="10. Disputes">
        <p>
          If a dispute arises between a Client and a Maker, both parties should first attempt to
          resolve it through the Platform's messaging system. If unresolved, either party may contact
          PrintMarketHub support. We reserve the right to make final decisions on payment outcomes in
          disputed transactions, including partial refunds where appropriate.
        </p>
      </Section>

      <Section title="11. Certification">
        <p>
          Maker certification levels are awarded by PrintMarketHub based on verified experience,
          portfolio quality, and track record. Providing false information to obtain certification
          is grounds for immediate removal of certification and possible account suspension.
        </p>
      </Section>

      <Section title="12. Limitation of Liability">
        <p>
          PrintMarketHub is a marketplace platform. We are not responsible for the quality,
          safety, legality, or delivery of any items produced by Makers. Our liability is limited
          to the platform fee collected on the transaction in question.
        </p>
      </Section>

      <Section title="13. Termination">
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms, engage
          in fraudulent activity, or damage the integrity of the marketplace. Users may delete
          their account at any time, subject to completion of any active transactions.
        </p>
      </Section>

      <Section title="14. Changes to These Terms">
        <p>
          We may update these Terms from time to time. Significant changes will be communicated
          via email or a notice on the Platform. Continued use of PrintMarketHub after changes
          take effect constitutes acceptance of the revised Terms.
        </p>
      </Section>

      <Section title="15. Governing Law">
        <p>
          These Terms are governed by the laws of Switzerland. Any disputes shall be subject to
          the exclusive jurisdiction of the courts of Switzerland.
        </p>
      </Section>

      <div className="border-t border-warm-100 pt-6">
        <p className="text-sm text-warm-500">
          Questions? Contact us at{' '}
          <a href="mailto:legal@printmarkethub.com" className="text-ink-600 hover:underline">
            legal@printmarkethub.com
          </a>
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-warm-900">{title}</h2>
      <div className="text-sm text-warm-600 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}
