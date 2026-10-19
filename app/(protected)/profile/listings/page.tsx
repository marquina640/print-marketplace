import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ListingsManager } from './listings-manager'

export const metadata = { title: 'My Listings' }

export default async function ListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  const cookieStore = await cookies()
  const previewUserId = profile?.role === 'admin' ? cookieStore.get('admin_preview_user_id')?.value : undefined
  const effectiveUserId = previewUserId ?? user.id

  if (profile?.role !== 'printer_owner' && profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: listings } = await admin
    .from('listings')
    .select('*')
    .eq('maker_id', effectiveUserId)
    .order('created_at', { ascending: false })

  const hasListings = (listings ?? []).length > 0

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900">My Listings</h1>
        <p className="text-sm text-warm-500 mt-1">
          Your designs, ready to buy. Customers near you can browse, pay, and arrange a local handoff or delivery.
        </p>
      </div>

      {!hasListings && (
        <div className="rounded-2xl border border-gold-200 bg-gold-50 p-5 space-y-2">
          <p className="text-sm font-semibold text-ink-900">Turn your prints into a passive income stream</p>
          <p className="text-sm text-warm-600 leading-relaxed">
            Add a photo, a title, and a price. Your listing goes live instantly and shows up to customers in your area.
            No waiting for a custom request. Someone sees it, pays for it, and picks it up or receives it locally.
          </p>
        </div>
      )}

      <ListingsManager effectiveUserId={effectiveUserId} initialListings={listings ?? []} />
    </div>
  )
}
