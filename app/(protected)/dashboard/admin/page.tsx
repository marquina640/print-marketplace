import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { AdminPreviewButtons } from './preview-buttons'
import { CertificationPanel } from './certification-panel'
import { MarkPayoutButton } from '@/app/(protected)/jobs/[id]/mark-payout-button'

export const metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  function effectiveStatus(j: { status: string; created_at: string }) {
    if (j.status === 'open' && new Date(j.created_at) < sevenDaysAgo) return 'delisted'
    return j.status
  }

  const [
    { count: userCount },
    { count: jobCount },
    { count: quoteCount },
    { count: messageCount },
    { data: recentUsers },
    { data: recentJobs },
    { data: recentQuotes },
    { data: settings },
    { data: allMakers },
    { count: pendingCerts },
    { data: previewClients },
    { data: previewMakers },
    { data: pendingPayouts },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('jobs').select('*', { count: 'exact', head: true }),
    supabase.from('quotes').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('quotes').select('*, jobs(title), profiles:printer_id(email)').order('created_at', { ascending: false }).limit(10),
    supabase.from('platform_settings').select('*').order('key'),
    supabase.from('printer_profiles')
      .select('user_id, display_name, city, certification_level, printer_models, profiles!inner(email)')
      .order('certification_level', { ascending: false }),
    supabase.from('certification_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('user_id, display_name, email, role').eq('role', 'client').ilike('email', '%@test.com').order('created_at', { ascending: false }).limit(10),
    supabase.from('profiles').select('user_id, display_name, email, role').eq('role', 'printer_owner').ilike('email', '%@test.com').order('created_at', { ascending: false }).limit(10),
    (supabase as any).from('jobs')
      .select('*, quotes!inner(price, printer_id, profiles:printer_id(display_name, email))')
      .eq('status', 'delivered')
      .is('payout_at', null)
      .eq('quotes.status', 'accepted')
      .order('delivered_at', { ascending: true }),
  ])

  const roleCounts = {
    client: recentUsers?.filter((u) => u.role === 'client').length ?? 0,
    printer_owner: recentUsers?.filter((u) => u.role === 'printer_owner').length ?? 0,
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform overview and management</p>
      </div>

      {/* Preview Mode */}
      <AdminPreviewButtons
        clients={(previewClients ?? []).map((u) => ({ user_id: u.user_id, display_name: u.display_name, email: u.email, role: u.role }))}
        makers={(previewMakers ?? []).map((u) => ({ user_id: u.user_id, display_name: u.display_name, email: u.email, role: u.role }))}
      />

      {/* Pending Payouts */}
      {pendingPayouts && pendingPayouts.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-lg font-semibold text-ink-900">Pending Payouts</h2>
            <span className="rounded-full bg-red-500 text-white text-xs font-bold px-2 py-0.5">
              {pendingPayouts.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingPayouts.map((job: any) => {
              const acceptedQuote = Array.isArray(job.quotes) ? job.quotes[0] : job.quotes
              const makerProfile  = acceptedQuote?.profiles as { display_name: string | null; email: string } | null
              const makerName     = makerProfile?.display_name ?? makerProfile?.email ?? 'maker'
              return (
                <div key={job.id} className="card p-5 border-l-4 border-emerald-400">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <Link href={`/jobs/${job.id}`} className="font-semibold text-ink-900 hover:underline">
                        {job.title}
                      </Link>
                      <p className="text-xs text-warm-500 mt-0.5">
                        Maker: <span className="font-medium text-ink-700">{makerName}</span>
                        {' · '}Delivered {formatDate((job as any).delivered_at)}
                        {' · '}<span className="font-bold text-emerald-700">{formatCurrency(acceptedQuote?.price ?? 0)}</span>
                      </p>
                    </div>
                    <MarkPayoutButton
                      jobId={job.id}
                      makerName={makerName}
                      amount={acceptedQuote?.price ?? 0}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Maker Certification */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-ink-900">Maker Certifications</h2>
          <p className="text-xs text-warm-500 mt-0.5">Assign certification levels to maker profiles. Changes take effect immediately.</p>
        </div>
        <CertificationPanel makers={(allMakers ?? []).map((m) => ({
          user_id: m.user_id,
          display_name: m.display_name,
          city: m.city,
          certification_level: m.certification_level ?? 0,
          printer_models: m.printer_models ?? [],
          email: (m.profiles as any)?.email,
        }))} />
      </section>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',    value: userCount    ?? 0 },
          { label: 'Total Requests',  value: jobCount     ?? 0 },
          { label: 'Total Quotes',   value: quoteCount   ?? 0 },
          { label: 'Cert. Pending',  value: pendingCerts ?? 0, highlight: (pendingCerts ?? 0) > 0 },
        ].map((s) => (
          <div key={s.label} className={`card p-4 ${(s as any).highlight ? 'border-amber-300 bg-amber-50' : ''}`}>
            <p className="text-xs text-warm-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${(s as any).highlight ? 'text-amber-600' : 'text-ink-900'}`}>
              {s.value.toLocaleString()}
            </p>
            {(s as any).highlight && (
              <Link href="/dashboard/admin/certifications"
                className="text-xs text-amber-600 hover:text-amber-700 font-medium mt-1 inline-block">
                Review queue →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Users Table */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Email', 'Role', 'Display Name', 'Joined'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {recentUsers?.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.role ? (
                        <StatusBadge status={u.role} />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.display_name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Jobs Table */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Requests</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Title', 'Material', 'Budget', 'Status', 'Posted'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {recentJobs?.map((j) => (
                  <tr key={j.id} className="hover:bg-indigo-50 cursor-pointer group">
                    <td className="px-4 py-3 text-sm font-medium max-w-[200px] truncate">
                      <Link href={`/jobs/${j.id}`} className="text-indigo-600 hover:underline group-hover:text-indigo-700">
                        {j.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{j.material}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(j.budget)}</td>
                    <td className="px-4 py-3"><StatusBadge status={effectiveStatus(j)} /></td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(j.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Quotes Table */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Quotes</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Request', 'Maker', 'Price', 'Lead Time', 'Status', 'Submitted'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {recentQuotes?.map((q) => {
                  const job = q.jobs as { title: string } | null
                  const printer = q.profiles as { email: string } | null
                  return (
                    <tr key={q.id} className="hover:bg-indigo-50 cursor-pointer group">
                      <td className="px-4 py-3 text-sm font-medium max-w-[180px] truncate">
                        <Link href={`/jobs/${q.job_id}`} className="text-indigo-600 hover:underline group-hover:text-indigo-700">
                          {job?.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">{printer?.email}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(q.price)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{q.lead_time_days}d</td>
                      <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-400">{formatDate(q.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Platform Settings */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Settings</h2>
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Key', 'Value', 'Description'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {settings?.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{s.key}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {JSON.stringify(s.value)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{s.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
