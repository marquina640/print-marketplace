import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata = { title: 'All Listings - Admin' }

export default async function AdminListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()

  const { data: listings } = await admin
    .from('listings')
    .select(`
      id, title, price, currency, status, created_at, photos,
      shipping_available, pickup_available, local_delivery_available,
      profiles:maker_id(display_name, email, is_test)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  const real  = (listings ?? []).filter((l) => !(l.profiles as any)?.is_test)
  const tests = (listings ?? []).filter((l) =>  (l.profiles as any)?.is_test)

  function statusColor(status: string) {
    if (status === 'active')   return 'bg-green-100 text-green-700'
    if (status === 'inactive') return 'bg-warm-100 text-warm-500'
    return 'bg-yellow-100 text-yellow-700'
  }

  function Table({ rows }: { rows: typeof real }) {
    if (rows.length === 0) return <p className="text-sm text-warm-400 py-4">No listings.</p>
    return (
      <div className="overflow-x-auto rounded-xl border border-warm-200">
        <table className="w-full text-sm">
          <thead className="bg-warm-50 text-warm-500 uppercase text-[11px] tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Maker</th>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Delivery</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {rows.map((l) => {
              const maker = l.profiles as { display_name: string | null; email: string } | null
              const photo = (l.photos as string[] | null)?.[0]
              const delivery = [
                l.pickup_available && 'Pickup',
                l.local_delivery_available && 'Local',
                l.shipping_available && 'Ship',
              ].filter(Boolean).join(' · ')

              return (
                <tr key={l.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-4 py-3 text-warm-700">
                    <div className="font-medium text-ink-900">{maker?.display_name ?? '—'}</div>
                    <div className="text-xs text-warm-400">{maker?.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {photo && (
                        <img src={photo} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      )}
                      <span className="font-medium text-ink-900">{l.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-900 font-medium">
                    {formatCurrency(l.price, l.currency)}
                  </td>
                  <td className="px-4 py-3 text-warm-600 text-xs">{delivery || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusColor(l.status)}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-warm-400 text-xs">{formatDate(l.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">All Listings</h1>
        <p className="text-sm text-warm-500 mt-1">{real.length} real · {tests.length} test</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-semibold text-ink-800">Real Listings</h2>
        <Table rows={real} />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-semibold text-warm-500">Test Listings</h2>
        <Table rows={tests} />
      </div>
    </div>
  )
}
