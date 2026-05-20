import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export const metadata = { title: 'All Requests — Admin' }

export default async function AdminJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, profiles!client_id(display_name, email, is_test)')
    .order('created_at', { ascending: false })
    .limit(100)

  const real  = jobs?.filter((j) => !(j.profiles as any)?.is_test) ?? []
  const tests = jobs?.filter((j) =>  (j.profiles as any)?.is_test) ?? []

  function JobTable({ rows }: { rows: typeof real }) {
    if (rows.length === 0) return <p className="text-sm text-warm-400 py-4">No requests.</p>
    return (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-warm-100">
            <thead className="bg-warm-50">
              <tr>
                {['Title', 'Customer', 'Material', 'Budget', 'Status', 'Posted'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-warm-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50 bg-white">
              {rows.map((j) => {
                const client = j.profiles as { display_name: string | null; email: string } | null
                return (
                  <tr key={j.id} className="hover:bg-warm-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-ink-900 max-w-[200px] truncate">
                      <Link href={`/jobs/${j.id}`} className="hover:underline">{j.title}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-600 max-w-[160px] truncate">
                      {client?.display_name ?? client?.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-600">{j.material}</td>
                    <td className="px-4 py-3 text-sm text-warm-600">{j.budget ? formatCurrency(j.budget) : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                    <td className="px-4 py-3 text-sm text-warm-400">{formatDate(j.created_at)}</td>
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
        <h1 className="text-2xl font-bold text-ink-900">All Requests</h1>
        <p className="text-warm-500 text-sm mt-0.5">{real.length} real · {tests.length} test</p>
      </div>

      <section>
        <h2 className="text-base font-semibold text-ink-800 mb-3">Real Requests</h2>
        <JobTable rows={real} />
      </section>

      <section>
        <h2 className="text-base font-semibold text-warm-500 mb-3">Test Requests</h2>
        <JobTable rows={tests} />
      </section>
    </div>
  )
}
