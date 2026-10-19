import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MessageThread } from '@/components/messages/message-thread'

interface PageProps {
  params: Promise<{ userId: string }>
}

export default async function DirectMessagePage({ params }: PageProps) {
  const { userId: otherUserId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const admin = createAdminClient()

  if (!isAdmin) {
    // Regular user can only access if admin has sent them a message
    const { count } = await admin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .is('job_id', null)
      .eq('sender_id', otherUserId)
      .eq('receiver_id', user.id)

    if (!count || count === 0) redirect('/messages')
  }

  // Fetch the other party's profile
  const { data: otherProfile } = await admin
    .from('profiles')
    .select('display_name, email, role')
    .eq('user_id', otherUserId)
    .single()

  if (!otherProfile) notFound()

  const otherName = (otherProfile as any).display_name ?? (otherProfile as any).email?.split('@')[0] ?? 'User'

  // Fetch all direct messages between these two users
  const { data: messages } = await admin
    .from('messages')
    .select('*')
    .is('job_id', null)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/messages" className="text-sm text-gray-500 hover:text-gray-900">← Messages</Link>
        <span className="text-gray-300">|</span>
        <div>
          <p className="text-sm font-semibold text-gray-900">{otherName}</p>
          <p className="text-xs text-gray-500">{(otherProfile as any).email}</p>
        </div>
      </div>

      <MessageThread
        jobId={null}
        currentUserId={user.id}
        receiverId={otherUserId}
        threadTitle={`Chat with ${otherName}`}
        initialMessages={messages ?? []}
      />
    </div>
  )
}
