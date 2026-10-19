import Link from 'next/link'

export default async function ListingSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams
  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-ink-900">Payment received!</h1>
      <p className="text-warm-500 text-sm">
        Your payment is held securely. The maker will prepare and ship your item.
        Once you receive it, confirm delivery from My Orders — that is when the maker gets paid.
      </p>
      <div className="flex gap-3 justify-center pt-4">
        <Link href="/orders">
          <button className="px-5 py-2.5 rounded-xl bg-[#D4A017] text-[#1a1535] text-sm font-bold hover:bg-[#c49015] transition-colors">
            Go to My Orders
          </button>
        </Link>
        <Link href="/feed">
          <button className="px-5 py-2.5 rounded-xl border border-warm-300 text-sm font-medium text-ink-900 hover:bg-warm-50">
            Browse more
          </button>
        </Link>
      </div>
    </div>
  )
}
