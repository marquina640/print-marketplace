import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cookie Policy | PrintMarketHub' }

const LAST_UPDATED = '20 May 2025'

export default function CookiesPage() {
  return (
    <article>
      <LegalHeader title="Cookie Policy" updated={LAST_UPDATED} />

      <Section n="1" title="What Are Cookies">
        <p>Cookies are small text files stored on your device when you visit a website. They allow the site to remember information about your visit, such as your preferences or login state.</p>
        <p>We use cookies and similar technologies (local storage, session storage) to operate the Platform, ensure security, and improve your experience.</p>
      </Section>

      <Section n="2" title="Cookies We Use">
        <div className="overflow-x-auto rounded-xl border border-warm-200">
          <table className="w-full text-xs">
            <thead className="bg-warm-100">
              <tr>
                {['Name', 'Type', 'Purpose', 'Duration'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-bold text-ink-700 border-b border-warm-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {[
                ['sb-auth-token', 'Strictly Necessary', 'Supabase authentication session token. Required to keep you logged in.', 'Session'],
                ['admin_preview_as', 'Strictly Necessary', 'Admin role preview state. Used only by admin accounts.', 'Session'],
                ['admin_preview_user_id', 'Strictly Necessary', 'Admin user preview session. Used only by admin accounts.', 'Session'],
                ['__stripe_mid', 'Functional', 'Stripe fraud detection and payment security.', '1 year'],
                ['__stripe_sid', 'Functional', 'Stripe session identifier for payment processing.', '30 minutes'],
                ['Google Maps', 'Functional', 'Google Maps and Places API session cookies for location features. Set by Google LLC.', 'Session / persistent'],
              ].map(([name, type, purpose, duration], i) => (
                <tr key={i} className="hover:bg-warm-50">
                  <td className="px-4 py-3 font-mono font-semibold text-ink-800 whitespace-nowrap">{name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      type === 'Strictly Necessary'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-ink-50 text-ink-700 border border-ink-200'
                    }`}>
                      {type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-warm-600">{purpose}</td>
                  <td className="px-4 py-3 text-warm-600 whitespace-nowrap">{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section n="3" title="Strictly Necessary Cookies">
        <p>These cookies are essential for the Platform to function. They enable authentication, session management, and security. You cannot opt out of these cookies while using the Platform.</p>
      </Section>

      <Section n="4" title="Functional Cookies">
        <p>Functional cookies are set by us or by third-party services integrated into the Platform (Stripe, Google Maps). They enable payment processing and location features. These cookies are loaded only when you interact with the relevant features.</p>
        <p>We do not use any analytics cookies, advertising cookies, or tracking pixels that monitor your behaviour across third-party websites.</p>
      </Section>

      <Section n="5" title="Third-Party Cookies">
        <p>The following third parties may set cookies when you use their integrated features:</p>
        <ul>
          <li><strong>Stripe, Inc.</strong> — payment processing. Stripe's privacy policy is available at stripe.com/privacy.</li>
          <li><strong>Google LLC</strong> — Maps and Places API for address autocomplete and map display. Google's privacy policy is available at policies.google.com/privacy.</li>
        </ul>
        <p>We do not control the cookies set by these third parties. Please refer to their respective privacy policies for details.</p>
      </Section>

      <Section n="6" title="How to Manage Cookies">
        <p>You can manage or delete cookies through your browser settings. Please note that disabling cookies may affect Platform functionality, including the ability to log in.</p>
        <p>Browser-specific instructions:</p>
        <ul>
          <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
          <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
          <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
          <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
        </ul>
      </Section>

      <Section n="7" title="Changes to This Policy">
        <p>We may update this Cookie Policy as our use of cookies changes. We will notify you of any material changes via in-platform notice.</p>
        <p>For questions, contact <a href="mailto:admin@printmakerhub.com" className="text-ink-700 underline underline-offset-2 hover:text-gold-600">admin@printmakerhub.com</a>.</p>
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
