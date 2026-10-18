import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils'
import { ListingPurchaseButton } from './listing-purchase-button'
import { FollowButton } from '@/components/listings/follow-button'

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  const { data: listing } = await admin
    .from('listings')
    .select('*, profiles!maker_id(display_name, city, avatar_url)')
    .eq('id', id)
    .single()

  if (!listing || listing.status !== 'active') return notFound()

  const maker = (listing as any).profiles ?? {}

  // Check if user follows this maker
  let isFollowing = false
  if (user) {
    const { data: follow } = await admin.from('follows')
      .select('id').eq('follower_id', user.id).eq('maker_id', listing.maker_id).single()
    isFollowing = !!follow
  }

  const delivery = [
    listing.shipping_available && `Shipping${listing.shipping_price > 0 ? ` (+${formatCurrency(listing.shipping_price, listing.currency)})` : ' (free)'}`,
    listing.pickup_available && 'Pickup',
    listing.local_delivery_available && 'Local delivery',
  ].filter(Boolean) as string[]

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Photos */}
        <div className="space-y-2">
          {listing.photos.length > 0 ? (
            <>
              <div className="aspect-square rounded-2xl overflow-hidden bg-warm-100">
                <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" id="main-photo" />
              </div>
              {listing.photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {listing.photos.slice(1).map((url: string, i: number) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-warm-100 cursor-pointer">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square rounded-2xl bg-warm-100 flex items-center justify-center text-6xl">📦</div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {listing.category && (
            <p className="text-xs font-bold text-warm-400 uppercase tracking-widest">{listing.category}</p>
          )}
          <h1 className="text-2xl font-bold text-ink-900">{listing.title}</h1>
          <p className="text-3xl font-bold text-ink-900">{formatCurrency(listing.price, listing.currency)}</p>

          {listing.description && (
            <p className="text-sm text-warm-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
          )}

          {/* Delivery */}
          <div className="rounded-xl bg-warm-50 border border-warm-200 p-4">
            <p className="text-xs font-bold text-warm-500 uppercase tracking-widest mb-2">Delivery options</p>
            <ul className="space-y-1">
              {delivery.map(d => (
                <li key={d} className="text-sm text-warm-700 flex items-center gap-2">
                  <span className="text-green-500">✓</span> {d}
                </li>
              ))}
            </ul>
          </div>

          {/* Maker */}
          <div className="flex items-center justify-between">
            <Link href={`/makers/${listing.maker_id}`} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-warm-200 flex-shrink-0">
                {maker.avatar_url
                  ? <img src={maker.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-warm-400 text-sm font-bold">
                      {(maker.display_name ?? '?')[0]?.toUpperCase()}
                    </div>
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900 group-hover:underline">{maker.display_name ?? 'Maker'}</p>
                {maker.city && <p className="text-xs text-warm-500">{maker.city}</p>}
              </div>
            </Link>
            {user && user.id !== listing.maker_id && (
              <FollowButton makerId={listing.maker_id} initialFollowing={isFollowing} userId={user.id} />
            )}
          </div>

          {/* Buy */}
          {user && user.id !== listing.maker_id ? (
            <ListingPurchaseButton listing={listing} userId={user.id} />
          ) : !user ? (
            <Link href="/login">
              <button className="w-full rounded-xl bg-ink-900 text-white py-3 font-semibold text-sm hover:bg-ink-700 transition-colors">
                Sign in to purchase
              </button>
            </Link>
          ) : (
            <p className="text-sm text-warm-400 text-center">This is your listing.</p>
          )}
        </div>
      </div>
    </div>
  )
}
