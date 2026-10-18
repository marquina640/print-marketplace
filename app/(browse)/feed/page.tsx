import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FeedClient } from './feed-client'

export const metadata = { title: 'Feed' }

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  // Followed maker IDs (only if logged in)
  let followedMakerIds: string[] = []
  if (user) {
    const { data: follows } = await admin
      .from('follows').select('maker_id').eq('follower_id', user.id)
    followedMakerIds = follows?.map(f => f.maker_id) ?? []
  }

  // All active listings with maker info
  const { data: listings } = await admin
    .from('listings')
    .select('*, profiles!maker_id(display_name, city, latitude, longitude)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(200)

  const flat = (listings ?? []).map((l: any) => ({
    ...l,
    maker_name: l.profiles?.display_name ?? null,
    maker_city: l.profiles?.city ?? null,
    maker_lat:  l.profiles?.latitude ?? null,
    maker_lng:  l.profiles?.longitude ?? null,
  }))

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Browse prints</h1>
          <p className="text-sm text-warm-500 mt-1">Ready-made and made-to-order prints from local makers.</p>
        </div>
        <Link href="/jobs/new" className="flex-shrink-0">
          <button className="rounded-xl bg-[#D4A017] text-[#1a1535] px-4 py-2.5 text-sm font-bold hover:bg-[#c49015] transition-colors whitespace-nowrap">
            + Post a request
          </button>
        </Link>
      </div>
      <FeedClient
        allListings={flat}
        followedMakerIds={followedMakerIds}
        userId={user?.id ?? null}
      />
    </div>
  )
}
