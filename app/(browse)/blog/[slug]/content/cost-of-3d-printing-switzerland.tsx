import Link from 'next/link'

export default function Post() {
  return (
    <div className="space-y-5 text-warm-700 leading-relaxed text-[15px]">
      <p className="text-lg text-warm-700 leading-relaxed">
        3D printing prices vary wildly - from a few dollars to several hundred - and if you&apos;ve ever tried to get a quote online, you&apos;ve probably noticed the numbers rarely make intuitive sense. Here&apos;s a clear breakdown of what actually drives cost, and what you should expect to pay.
      </p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">The 5 factors that affect price</h2>

      <div className="space-y-4">
        <div className="rounded-xl border border-warm-200 bg-warm-50 p-4">
          <p className="font-bold text-ink-900 mb-1">1. Material</p>
          <p className="text-sm">Material is the biggest single driver of cost. PLA is cheap and easy to print; engineering-grade materials like nylon, polycarbonate, or resin require specific machines and more skill to handle reliably.</p>
        </div>
        <div className="rounded-xl border border-warm-200 bg-warm-50 p-4">
          <p className="font-bold text-ink-900 mb-1">2. Print volume and size</p>
          <p className="text-sm">Bigger parts use more filament and take longer to print. A small figurine might take 2 hours; a large mechanical enclosure might take 18. Makers typically factor both material cost and machine time into their quote.</p>
        </div>
        <div className="rounded-xl border border-warm-200 bg-warm-50 p-4">
          <p className="font-bold text-ink-900 mb-1">3. Complexity and supports</p>
          <p className="text-sm">Overhangs and complex geometries require support structures - extra material that gets removed after printing. More supports means more material, more print time, and more post-processing work.</p>
        </div>
        <div className="rounded-xl border border-warm-200 bg-warm-50 p-4">
          <p className="font-bold text-ink-900 mb-1">4. Print quality / layer height</p>
          <p className="text-sm">Finer layer heights (0.1 mm) take significantly longer than standard quality (0.2 mm). For display pieces or detailed models this matters; for functional brackets it usually doesn&apos;t.</p>
        </div>
        <div className="rounded-xl border border-warm-200 bg-warm-50 p-4">
          <p className="font-bold text-ink-900 mb-1">5. Quantity</p>
          <p className="text-sm">Ordering 10 identical parts isn&apos;t 10x the cost of one - setup time is shared and makers can often nest multiple parts on the print bed. Expect a per-unit discount for quantities above 3-5.</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">Typical price ranges by material</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-warm-100 text-left">
              <th className="px-3 py-2 font-bold text-ink-900 rounded-tl-lg">Material</th>
              <th className="px-3 py-2 font-bold text-ink-900">Typical range (small-medium part)</th>
              <th className="px-3 py-2 font-bold text-ink-900 rounded-tr-lg">Best for</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {[
              ['PLA', '$5 - $30', 'Prototypes, decorative, low-stress parts'],
              ['PETG', '$8 - $40', 'General use, food-safe, slightly flexible'],
              ['ABS', '$10 - $45', 'Mechanical parts, heat resistance'],
              ['TPU (flexible)', '$12 - $50', 'Phone cases, gaskets, grips'],
              ['Resin (SLA)', '$15 - $80', 'Ultra-fine detail, miniatures, dental/jewellery'],
              ['Nylon / PA12', '$25 - $120', 'Engineering, load-bearing, impact resistance'],
              ['Polycarbonate', '$30 - $150', 'Extreme heat/impact applications'],
            ].map(([mat, range, use]) => (
              <tr key={mat} className="bg-white">
                <td className="px-3 py-2 font-semibold text-ink-800">{mat}</td>
                <td className="px-3 py-2 text-ink-700">{range}</td>
                <td className="px-3 py-2 text-warm-500">{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-warm-400">Ranges are indicative for a single part roughly 5-15 cm in size. Complex geometry, tight tolerances, or large parts will cost more. Prices may vary by region.</p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">Why local makers can beat online services on price</h2>
      <p>
        International online services (Shapeways, Sculpteo, etc.) add significant overhead - centralised operations, warehouse handling, and long-distance shipping. A local maker has lower overhead and charges only for their time and materials.
      </p>
      <p>
        For standard FDM jobs in PLA or PETG - which covers the vast majority of requests - a local maker on PrintMarketHub will almost always be faster, cheaper, and more flexible than an online service. And because they&apos;re nearby, you can sometimes arrange pickup and skip shipping entirely.
      </p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">How to get an accurate quote</h2>
      <p>
        The single best way to get a fair price is to post your request on PrintMarketHub and let multiple makers compete. You&apos;ll typically receive 3-6 quotes, which gives you a real sense of the market rate for your specific job - no guessing, no overpaying.
      </p>
      <p>
        To get the most accurate quotes, include: your STL file or a Thingiverse link, the material you want, the quantity, any tolerance requirements, and your deadline. The more detail you provide, the fewer back-and-forth questions before production starts.
      </p>

      <div className="mt-8 rounded-2xl bg-[#1a1535] text-white p-6 space-y-3">
        <p className="font-bold text-lg">Find out what your job will cost - for free</p>
        <p className="text-[#CEC8E4] text-sm">Post a request, receive quotes from makers near you, and compare. No commitment required.</p>
        <Link href="/jobs/new"
          className="inline-block rounded-xl bg-[#D4A017] text-[#1a1535] font-bold px-5 py-2.5 text-sm hover:bg-[#c49015] transition-colors">
          Get quotes →
        </Link>
      </div>
    </div>
  )
}
