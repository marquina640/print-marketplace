import Link from 'next/link'

export default function Post() {
  return (
    <div className="space-y-5 text-warm-700 leading-relaxed text-[15px]">
      <p className="text-lg text-warm-700 leading-relaxed">
        You own a 3D printer. You know how to use it. But a client wants a part that&apos;s 40 cm wide, and your bed tops out at 25. Or you need 50 identical pieces by Friday and your single printer would take a week. The obvious answer seems to be buying a bigger machine - but that&apos;s rarely the right move.
      </p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">The "just buy a bigger printer" trap</h2>
      <p>
        Large-format FDM printers - the kind with 400 mm+ build volumes - typically start at $800 and go well past $2,000 for anything reliable. They take longer to heat up, require more calibration, eat more electricity, and need more space. For the occasional oversized job, you&apos;re paying a high fixed cost to handle a problem that comes up maybe once a month.
      </p>
      <p>
        Resin printers with large build plates have the same problem. A large Elegoo Saturn or Phrozen Sonic Mega costs serious money, needs ventilation, and the resin itself has a shelf life. Buying one to handle a single big order is rarely good economics.
      </p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">What you actually need is access, not ownership</h2>
      <p>
        There&apos;s a maker somewhere near you with exactly the printer you need. Someone running a Bambu X1 with a 256 mm bed, or a large-format CoreXY with a 400 x 400 build plate. They&apos;ve already absorbed the cost of the machine. They know how to use it. They can take your file and have the part ready in days.
      </p>
      <p>
        PrintMarketHub connects you with those makers. You post the job, they quote it, you pay once and receive the part. No capital outlay, no machine learning curve, no half-finished calibration prints cluttering your workspace.
      </p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">When does outsourcing make sense for a maker?</h2>
      <div className="space-y-3">
        {[
          ['Your bed is too small', 'The print exceeds your build volume - even with splitting it into parts would introduce visible seam lines or weaken the structure. A maker with a larger bed can do it in one go.'],
          ['You\'re at capacity', 'You have 3 printers running and a queue of jobs. A new order arrives that you could technically take but would delay everything else. Outsource it and keep your existing clients happy.'],
          ['You don\'t have the right material', 'The client needs flexible TPU or high-temp ASA and you only stock PLA and PETG. Rather than buying a full spool of a material you\'ll rarely use, find a maker who already runs it.'],
          ['It\'s a one-off large job', 'A client wants a single large enclosure or display piece. Buying a new machine for one job and then letting it sit is a poor return. Pay a specialist for the print and keep your overheads low.'],
          ['You need faster turnaround', 'Parallel production across multiple makers is often faster than queuing on a single machine. For batch orders, splitting across makers on the platform can cut lead times significantly.'],
        ].map(([title, desc]) => (
          <div key={title as string} className="flex gap-3 rounded-xl border border-warm-200 bg-warm-50 p-4">
            <span className="text-[#D4A017] font-bold text-lg leading-none mt-0.5 flex-shrink-0">→</span>
            <div>
              <p className="font-semibold text-ink-900 text-sm">{title}</p>
              <p className="text-sm text-warm-600 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">How to post a job as a maker</h2>
      <p>
        Using PrintMarketHub as a client is exactly the same whether you own zero printers or ten. Create a free account (or log in), post your request with the file, material, dimensions, and deadline, and wait for quotes to come in.
      </p>
      <p>
        Because you already understand print tolerances, layer heights, and material properties, you&apos;ll be able to write a much more precise brief than a typical customer - which means quotes come back more accurate and the chances of a reprint drop significantly.
      </p>
      <p>
        You can also see the maker&apos;s machine list on their profile. If you need the job on a specific machine type - say, a CoreXY for speed or a resin printer for surface quality - you can check before accepting a quote.
      </p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">The numbers</h2>
      <p>
        Compare the real cost of outsourcing vs. buying:
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-warm-100 text-left">
              <th className="px-3 py-2 font-bold text-ink-900 rounded-tl-lg">Scenario</th>
              <th className="px-3 py-2 font-bold text-ink-900">Buy a large printer</th>
              <th className="px-3 py-2 font-bold text-ink-900 rounded-tr-lg">Outsource on PrintMarketHub</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {[
              ['Upfront cost', '$800 - $2,000+', '$0'],
              ['Single large print', 'Built-in (after machine cost)', '$30 - $120 typical'],
              ['Setup and calibration time', '2 - 8 hours', '0 hours'],
              ['Ongoing maintenance', 'Yes', 'Not your problem'],
              ['Space required', 'Additional workspace', 'None'],
              ['Flexibility (materials)', 'Limited to what you buy', 'Access to any material any maker stocks'],
            ].map(([scenario, buy, outsource]) => (
              <tr key={scenario} className="bg-white">
                <td className="px-3 py-2 font-semibold text-ink-800">{scenario}</td>
                <td className="px-3 py-2 text-warm-600">{buy}</td>
                <td className="px-3 py-2 text-emerald-700 font-medium">{outsource}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-warm-400">Break-even on a large printer typically requires dozens of large-format jobs per year. For most hobbyists and small operations, outsourcing wins on economics.</p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">You can be both a maker and a client</h2>
      <p>
        PrintMarketHub lets you switch roles with one click. Log in as a client to post jobs that exceed your capacity. Switch to maker mode to take jobs that match your setup. Many people on the platform do both - outsourcing the jobs that don&apos;t fit their machine and picking up jobs that do.
      </p>
      <p>
        It&apos;s a flexible model that lets your printer earn money on jobs it&apos;s good at, without forcing you to turn down work it can&apos;t handle.
      </p>

      <div className="mt-8 rounded-2xl bg-[#1a1535] text-white p-6 space-y-3">
        <p className="font-bold text-lg">Have a job that&apos;s too big for your printer?</p>
        <p className="text-[#CEC8E4] text-sm">Post it on PrintMarketHub and get quotes from makers who have exactly the machine you need.</p>
        <Link href="/jobs/new"
          className="inline-block rounded-xl bg-[#D4A017] text-[#1a1535] font-bold px-5 py-2.5 text-sm hover:bg-[#c49015] transition-colors">
          Post a request →
        </Link>
      </div>
    </div>
  )
}
