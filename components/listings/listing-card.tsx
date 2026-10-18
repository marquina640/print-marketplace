import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface ListingCardProps {
  listing: {
    id: string
    title: string
    price: number
    currency: string
    photos: string[]
    category: string | null
    shipping_available: boolean
    pickup_available: boolean
    local_delivery_available: boolean
    maker_id: string
    maker_name: string | null
    maker_city: string | null
  }
}

export function ListingCard({ listing }: ListingCardProps) {
  const photo = listing.photos[0] ?? null

  const delivery = [
    listing.shipping_available && 'Shipping',
    listing.pickup_available && 'Pickup',
    listing.local_delivery_available && 'Local delivery',
  ].filter(Boolean).join(' · ')

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="rounded-2xl overflow-hidden border border-warm-200 bg-white hover:shadow-md transition-shadow">
        <div className="aspect-square bg-warm-100 overflow-hidden">
          {photo ? (
            <img
              src={photo}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-warm-300 text-4xl">
              📦
            </div>
          )}
        </div>
        <div className="p-3">
          {listing.category && (
            <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest mb-0.5">
              {listing.category}
            </p>
          )}
          <p className="font-semibold text-ink-900 text-sm leading-snug line-clamp-2">{listing.title}</p>
          <p className="text-xs text-warm-500 mt-0.5">
            by {listing.maker_name ?? 'Maker'}
            {listing.maker_city ? ` · ${listing.maker_city}` : ''}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-ink-900">{formatCurrency(listing.price, listing.currency)}</span>
            {delivery && (
              <span className="text-[10px] text-warm-400">{delivery}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
