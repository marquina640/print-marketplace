import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-indigo-600 text-lg">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          PrintMarketHub
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  )
}
