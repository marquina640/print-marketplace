import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils'
import { ConfirmListingReceipt } from './confirm-listing-receipt'
import { ListingReviewForm } from './listing-review-form'

export const metadata = { title: 'My Orders' }

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: orders } = await admin
    .from('listing_orders')
    .select('*, listings(title, photos, maker_id, profiles!maker_id(display_name, city))')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  const orderIds = (orders ?? []).map(o => o.id)
  const { data: reviews } = orderIds.length
    ? await admin.from('listing_reviews').select('order_id').in('order_id', orderIds)
    : { data: [] }

  const reviewedOrderIds = new Set((reviews ?? []).map(r => r.order_id))

  const pending   = (orders ?? []).filter(o => ['pending', 'paid'].includes(o.status))
  const completed = (orders ?? []).filter(o => ['delivered', 'completed'].includes(o.status))

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-ink-900">My Orders</h1>
        <p className="text-sm text-warm-500 mt-1">Track your purchases and confirm receipt to release payment to makers.</p>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-warm-600 uppercase tracking-wide">Awaiting delivery</h2>
          {pending.map(order => {
            const listing = (order.listings as any)
            const maker   = listing?.profiles
            const photo   = listing?.photos?.[0]
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-warm-200 p-4 flex gap-4 items-start">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-warm-100 flex-shrink-0">
                  {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink-900 text-sm truncate">{listing?.title ?? 'Listing'}</p>
                  <p className="text-sm text-warm-500">{maker?.display_name}{maker?.city ? `, ${maker.city}` : ''}</p>
                  <p className="text-sm font-medium text-ink-900 mt-0.5">{formatCurrency(order.amount, order.currency)}</p>
                  {order.selected_variation && (
                    <p className="text-xs text-warm-400 mt-0.5 capitalize">{order.selected_variation}</p>
                  )}
                  <div className="mt-3">
                    <ConfirmListingReceipt orderId={order.id} />
                  </div>
                  <p className="text-xs text-warm-400 mt-2">Confirm receipt once you receive your item to release payment to the maker.</p>
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-warm-600 uppercase tracking-wide">Completed</h2>
          {completed.map(order => {
            const listing      = (order.listings as any)
            const maker        = listing?.profiles
            const photo        = listing?.photos?.[0]
            const alreadyReviewed = reviewedOrderIds.has(order.id)
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-warm-200 p-4 flex gap-4 items-start">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-warm-100 flex-shrink-0">
                  {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink-900 text-sm truncate">{listing?.title ?? 'Listing'}</p>
                      <p className="text-sm text-warm-500">{maker?.display_name}{maker?.city ? `, ${maker.city}` : ''}</p>
                      <p className="text-sm font-medium text-ink-900 mt-0.5">{formatCurrency(order.amount, order.currency)}</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">Delivered</span>
                  </div>
                  {!alreadyReviewed && listing?.maker_id ? (
                    <ListingReviewForm orderId={order.id} makerId={listing.maker_id} />
                  ) : alreadyReviewed ? (
                    <p className="text-xs text-warm-400 mt-2">You reviewed this order.</p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {(orders ?? []).length === 0 && (
        <div className="text-center py-16 text-warm-400">
          <p className="text-sm">No orders yet.</p>
          <Link href="/feed" className="mt-3 inline-block text-sm text-ink-600 underline">Browse prints</Link>
        </div>
      )}
    </div>
  )
}
