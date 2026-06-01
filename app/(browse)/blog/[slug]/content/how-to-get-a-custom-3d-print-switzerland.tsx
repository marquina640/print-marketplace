import Link from 'next/link'

export default function Post() {
  return (
    <div className="space-y-5 text-warm-700 leading-relaxed text-[15px]">
      <p className="text-lg text-warm-700 leading-relaxed">
        You have a design - or you found one on Thingiverse - and you want it physically in your hands. The problem: you don&apos;t own a 3D printer. So what are your options, and which one is actually worth using?
      </p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">Option 1: Buy a 3D printer yourself</h2>
      <p>
        Entry-level FDM printers start at around $200-400. If you plan to print dozens of objects over the coming years, it might eventually make sense. But for a one-off part or occasional print, you&apos;re paying for a machine you&apos;ll rarely use - plus the hours of learning curve, failed prints, and calibration headaches.
      </p>
      <p><strong>Good for:</strong> people who want to get into the hobby. <strong>Not ideal for:</strong> one-off projects or people who just want a finished part.</p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">Option 2: FabLabs and makerspaces</h2>
      <p>
        Most cities around the world have at least one FabLab or makerspace where you can use 3D printers on-site. Some offer guided sessions; others let you book machine time independently once you&apos;ve completed an induction.
      </p>
      <p>
        The upside: access to professional machines and expert help on the spot. The downside: you still need to learn the software, you&apos;re limited to their opening hours, and waiting lists for machine time can stretch to days or weeks during busy periods.
      </p>
      <p><strong>Good for:</strong> people who want to learn and tinker. <strong>Not ideal for:</strong> anyone who just wants the finished object without the learning investment.</p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">Option 3: International online printing services</h2>
      <p>
        Services like Shapeways, Sculpteo, or i.materialise let you upload an STL and order prints online. The material variety is impressive - nylon, stainless steel, even ceramic - but the pricing is often steep, lead times can run 1-2 weeks, and shipping a physical object internationally adds cost and can complicate things further.
      </p>
      <p><strong>Good for:</strong> complex engineering materials not available locally. <strong>Not ideal for:</strong> standard PLA/PETG jobs where speed and price matter.</p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">Option 4: A local maker on PrintMarketHub</h2>
      <p>
        This is the option most people don&apos;t know exists. Thousands of people in communities around the world have 3D printers sitting in their homes and workshops - hobbyists, engineers, small businesses - who are happy to print for others in exchange for payment.
      </p>
      <p>
        PrintMarketHub connects you with verified makers near you. You post what you need, receive quotes from multiple makers, compare prices and profiles, then pay securely through the platform. Your money is held in escrow until you confirm the print has arrived and meets the spec.
      </p>
      <p><strong>Good for:</strong> anyone who wants a quality print quickly, without owning a machine or learning anything new.</p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">What files do you need?</h2>
      <p>
        For the best results, provide an <strong>STL</strong>, <strong>3MF</strong>, or <strong>STEP</strong> file - these are the standard formats for 3D printing. If you&apos;ve found a model on Thingiverse, MakerWorld, or Printables, you can simply paste the URL directly into your request. The maker will download the file themselves.
      </p>
      <p>
        If you have a rough sketch or just a description, some makers will even help with basic modelling - just mention it in your request.
      </p>

      <h2 className="text-xl font-bold text-ink-900 mt-8 mb-3">Step-by-step: posting on PrintMarketHub</h2>
      <ol className="list-decimal pl-5 space-y-2">
        <li>Create a free account at <Link href="/signup" className="text-ink-600 underline">printmarkethub.com/signup</Link></li>
        <li>Click &quot;Post a Request&quot; and fill in a short description of your part</li>
        <li>Upload your STL file, or paste a Thingiverse / MakerWorld link</li>
        <li>Specify material, quantity, deadline, and any budget constraints</li>
        <li>Wait for quotes - most requests hear back within a few hours</li>
        <li>Review the quotes, check maker profiles and ratings, and accept the best one</li>
        <li>Pay securely through the platform - funds released only on delivery</li>
      </ol>

      <div className="mt-8 rounded-2xl bg-[#1a1535] text-white p-6 space-y-3">
        <p className="font-bold text-lg">Ready to get your print made?</p>
        <p className="text-[#CEC8E4] text-sm">Post a free request and receive quotes from makers near you within hours.</p>
        <Link href="/jobs/new"
          className="inline-block rounded-xl bg-[#D4A017] text-[#1a1535] font-bold px-5 py-2.5 text-sm hover:bg-[#c49015] transition-colors">
          Post a request →
        </Link>
      </div>
    </div>
  )
}
