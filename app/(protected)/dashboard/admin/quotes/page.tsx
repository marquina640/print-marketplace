import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'

export const metadata = { title: 'All Quotes - Admin' }

export default async function AdminQuotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()

  const { data: quotes } = await admin
    .from('quotes')
    .select(`
      id, price, currency, status, created_at, lead_time_days, message,
      jobs!job_id(id, title, client_id, profiles!client_id(display_name, email)),
      profiles!printer_id(display_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  const real  = (quotes ?? []).filter((q) => {
    const client = (q.jobs as any)?.profiles
    return !client?.is_test
  })
  const tests = (quotes ?? []).filter((q) => {
    const client = (q.jobs as any)?.profiles
    return !!client?.is_test
  })

  function QuoteTable({ rows }: { rows: typeof real }) {
    if (rows.length === 0) return <p className="text-sm text-warm-400 py-4">No quotes.</p>
    return (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-warm-100">
            <thead className="bg-warm-50">
              <tr>
                {['Job', 'Customer', 'Maker', 'Price', 'Lead', 'Status', 'Submitted'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-warm-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50 bg-white">
              {rows.map((q) => {
                const job    = q.jobs as any
                const client = job?.profiles as { display_name: string | null; email: string } | null
                const maker  = q.profiles as { display_name: string | null; email: string } | null
                const currency = (q as any).currency ?? 'CHF'
                return (
                  <tr key={q.id} className="hover:bg-warm-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-ink-900 max-w-[200px] truncate">
                      {job?.id ? (
                        <Link href={`/jobs/${job.id}`} className="hover:underline">
                          {job.title ?? '—'}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-600 max-w-[140px] truncate">
                      {client?.display_name ?? client?.email ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-600 max-w-[140px] truncate">
                      {maker?.display_name ?? maker?.email ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-ink-900 whitespace-nowrap">
                      {formatCurrency(q.price, currency)}
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-500 whitespace-nowrap">
                      {(q as any).lead_time_days ? `${(q as any).lead_time_days}d` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-400 whitespace-nowrap">
                      {formatDate(q.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">All Quotes</h1>
        <p className="text-warm-500 text-sm mt-0.5">{real.length} real · {tests.length} test</p>
      </div>

      <section>
        <h2 className="text-base font-semibold text-ink-800 mb-3">Real Quotes</h2>
        <QuoteTable rows={real} />
      </section>

      <section>
        <h2 className="text-base font-semibold text-warm-500 mb-3">Test Quotes</h2>
        <QuoteTable rows={tests} />
      </section>
    </div>
  )
}
