'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  makerId: string
  userId: string
  initialFollowing: boolean
}

export function FollowButton({ makerId, userId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading]     = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', userId).eq('maker_id', makerId)
    } else {
      await supabase.from('follows').insert({ follower_id: userId, maker_id: makerId })
    }
    setFollowing(f => !f)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
        following
          ? 'bg-warm-100 text-warm-700 hover:bg-red-50 hover:text-red-600 border border-warm-200'
          : 'bg-ink-900 text-white hover:bg-ink-700'
      }`}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
