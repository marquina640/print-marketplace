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
      <h1 className="text-2xl font-bold text-ink-900">Order placed!</h1>
      <p className="text-warm-500 text-sm">
        Your payment was successful. The maker will be in touch about your order.
      </p>
      <div className="flex gap-3 justify-center pt-4">
        <Link href="/feed">
          <button className="px-5 py-2.5 rounded-xl border border-warm-300 text-sm font-medium text-ink-900 hover:bg-warm-50">
            Browse more
          </button>
        </Link>
        <Link href="/messages">
          <button className="px-5 py-2.5 rounded-xl bg-ink-900 text-white text-sm font-medium hover:bg-ink-700">
            Message maker
          </button>
        </Link>
      </div>
    </div>
  )
}
