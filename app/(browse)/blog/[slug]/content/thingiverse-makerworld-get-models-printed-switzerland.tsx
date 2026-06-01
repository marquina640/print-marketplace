import Link from 'next/link'

export default function Post() {
  return (
    <div className="space-y-5 text-warm-700 leading-relaxed text-[15px]">
      <p className="text-lg text-warm-700 leading-relaxed">
        Thingiverse and MakerWorld are home to millions of free 3D models — everything from cable clips and wall mounts to cosplay armour and architectural models. The problem: they&apos;re designed for people who already have a printer. If you don&apos;t, they can feel frustratingly out of reach. Here&apos;s how to go from download link to finished part.
      </p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">What are Thingiverse and MakerWorld?</h2>
      <p>
        <strong>Thingiverse</strong> (thingiverse.com) is the oldest and most widely-used repository for free 3D models, operated by MakerBot. With over 3 million designs uploaded by the community, it&apos;s the first place most people look. Search quality is imperfect but the sheer volume means you can usually find what you need.
      </p>
      <p>
        <strong>MakerWorld</strong> (makerworld.com) is Bambu Lab&apos;s platform — newer, faster, and with better curation. Models are tested and rated by community members, so quality is generally more consistent. If you want something mechanical and functional, MakerWorld is often the better starting point.
      </p>
      <p>
        Other good sources: <strong>Printables</strong> (by Prusa), <strong>MyMiniFactory</strong>, and <strong>Cults3D</strong> for premium/paid models.
      </p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">How to find a good model</h2>
      <p>Use the search bar with specific terms. Instead of searching &quot;hook&quot;, try &quot;wall hook 3mm screw&quot; or &quot;pegboard hook 6mm&quot;. The more specific, the better the match.</p>
      <p>On any model page, look for:</p>
      <ul className="list-disc pl-5 space-y-1.5 mt-2">
        <li><strong>Likes / downloads</strong> — popular models have been tested by many people, reducing the chance of print failures</li>
        <li><strong>Comments</strong> — scan for reports of print issues or requests for modifications</li>
        <li><strong>Remixes</strong> — often an improved version of the original exists</li>
        <li><strong>Print settings</strong> — look for the recommended layer height, infill, and support settings in the description</li>
      </ul>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">Things to check before ordering a print</h2>
      <div className="space-y-3">
        {[
          ['Dimensions', 'Most model pages list the dimensions. Make sure the part will fit where you intend. If you need a specific size, mention it in your request — many makers can scale models up or down.'],
          ['Supports required', 'If the model description says it needs supports, expect it to cost a bit more and have slightly rougher surfaces where the supports were removed.'],
          ['Material recommendation', 'Functional parts (brackets, clips, hinges) should generally be printed in PETG or ABS, not PLA. Decorative parts are fine in PLA. Check if the model page mentions a recommendation.'],
          ['License', 'Most models on Thingiverse are Creative Commons licensed, meaning you can have them printed for personal use. If you plan to resell the printed objects, check the license terms.'],
        ].map(([title, desc]) => (
          <div key={title as string} className="flex gap-3 rounded-xl border border-warm-100 bg-warm-50 p-4">
            <span className="text-green-500 font-bold text-lg leading-none mt-0.5">✓</span>
            <div>
              <p className="font-semibold text-ink-900 text-sm">{title}</p>
              <p className="text-sm text-warm-600 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">Step-by-step: submitting a Thingiverse link on PrintMarketHub</h2>
      <p>
        You don&apos;t need to download anything. PrintMarketHub lets you paste the URL directly from your browser.
      </p>
      <ol className="list-decimal pl-5 space-y-3 mt-2">
        <li>
          <strong>Find your model</strong> on Thingiverse, MakerWorld, or Printables. Copy the URL from your browser — it looks like <code className="bg-warm-100 px-1.5 py-0.5 rounded text-xs">https://www.thingiverse.com/thing:3201412</code>
        </li>
        <li>
          <strong>Go to <Link href="/jobs/new" className="text-ink-600 underline">Post a Request</Link></strong> on PrintMarketHub and log in or create a free account
        </li>
        <li>
          <strong>In the &quot;3D Model&quot; section</strong>, click &quot;Paste a link&quot; instead of &quot;Upload file&quot; and paste your URL. A preview image will auto-fill.
        </li>
        <li>
          <strong>Fill in the details</strong>: material preference, quantity, deadline, budget. Mention any notes (e.g. &quot;scale to 80%&quot; or &quot;print in black PETG&quot;)
        </li>
        <li>
          <strong>Submit</strong> — local makers will receive your request and send quotes. Most jobs hear back within a few hours.
        </li>
      </ol>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">What happens after you submit?</h2>
      <p>
        Makers browse open requests on their dashboard. When they see yours, they can download the file from the link you provided, check if they have the right material, and send you a quote with their price and lead time. You&apos;ll get an email notification for each quote.
      </p>
      <p>
        Compare the quotes — check not just price but also the maker&apos;s profile, past reviews, and the machines they use. A maker with a high-quality printer and good reviews is usually worth a few extra francs over the cheapest option.
      </p>
      <p>
        Once you accept a quote, pay through the platform, and the maker gets to work. When your part arrives, confirm delivery and the payment is released. Done.
      </p>

      <div className="mt-8 rounded-2xl bg-[#1a1535] text-white p-6 space-y-3">
        <p className="font-bold text-lg">Have a Thingiverse or MakerWorld link ready?</p>
        <p className="text-[#CEC8E4] text-sm">Paste it into your request and get quotes from local Swiss makers within hours.</p>
        <Link href="/jobs/new"
          className="inline-block rounded-xl bg-[#D4A017] text-[#1a1535] font-bold px-5 py-2.5 text-sm hover:bg-[#c49015] transition-colors">
          Post a request →
        </Link>
      </div>
    </div>
  )
}
