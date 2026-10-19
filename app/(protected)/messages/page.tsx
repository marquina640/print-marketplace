import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EmptyState } from '@/components/ui/empty-state'
import { formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Messages' }

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  const cookieStore = await cookies()
  const previewUserId = profile?.role === 'admin' ? cookieStore.get('admin_preview_user_id')?.value : undefined
  const effectiveUserId = previewUserId ?? user.id

  const admin = createAdminClient()

  // Use admin client for all data queries so admin preview mode bypasses RLS
  const db = admin

  // --- Job-based threads ---
  const { data: clientJobs } = await db
    .from('jobs')
    .select('id, title, status, accepted_quote_id')
    .eq('client_id', effectiveUserId)
    .not('accepted_quote_id', 'is', null)
    .not('status', 'in', '("delivered","completed")')

  // For makers: find jobs where their quote is the accepted one (by accepted_quote_id)
  // This is more reliable than checking quote.status which can get stuck
  const { data: makerQuoteIds } = await db
    .from('quotes')
    .select('id')
    .eq('printer_id', effectiveUserId)

  const makerQIds = (makerQuoteIds ?? []).map((q) => q.id)

  const { data: makerJobs } = makerQIds.length > 0
    ? await db
        .from('jobs')
        .select('id, title, status, client_id')
        .in('accepted_quote_id', makerQIds)
        .not('status', 'in', '("delivered","completed")')
    : { data: [] }

  const jobIds = [
    ...(clientJobs?.map((j) => j.id) ?? []),
    ...((makerJobs ?? []).map((j) => j.id)),
  ]

  const { data: lastJobMessages } = jobIds.length > 0
    ? await db
        .from('messages')
        .select('*')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const threadMap = new Map<string, typeof lastJobMessages extends (infer T)[] ? T : never>()
  lastJobMessages?.forEach((m) => {
    if (m.job_id && !threadMap.has(m.job_id)) threadMap.set(m.job_id, m)
  })

  type JobThread = {
    kind: 'job'
    jobId: string
    title: string
    lastMessage: (typeof lastJobMessages extends (infer T)[] ? T : never) | undefined
  }

  const jobThreads: JobThread[] = []
  clientJobs?.forEach((j) => {
    jobThreads.push({ kind: 'job', jobId: j.id, title: j.title, lastMessage: threadMap.get(j.id) })
  })
  ;(makerJobs ?? []).forEach((j) => {
    if (!jobThreads.find((t) => t.jobId === j.id)) {
      jobThreads.push({ kind: 'job', jobId: j.id, title: j.title, lastMessage: threadMap.get(j.id) })
    }
  })

  // --- Direct (admin) threads ---
  type DirectThread = {
    kind: 'direct'
    otherUserId: string
    otherName: string
    lastMessage: (typeof lastJobMessages extends (infer T)[] ? T : never) | undefined
  }

  const directThreads: DirectThread[] = []

  const [{ data: sentDirect }, { data: receivedDirect }] = await Promise.all([
    admin.from('messages').select('*').is('job_id', null).eq('sender_id', effectiveUserId).order('created_at', { ascending: false }),
    admin.from('messages').select('*').is('job_id', null).eq('receiver_id', effectiveUserId).order('created_at', { ascending: false }),
  ])
  const directMessages = [...(sentDirect ?? []), ...(receivedDirect ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (directMessages.length > 0) {
    // Group by the other party
    const otherUserIds = new Set<string>()
    const directMap = new Map<string, typeof directMessages[0]>()
    directMessages.forEach((m) => {
      const otherId = m.sender_id === effectiveUserId ? m.receiver_id : m.sender_id
      if (!directMap.has(otherId)) {
        directMap.set(otherId, m)
        otherUserIds.add(otherId)
      }
    })

    if (otherUserIds.size > 0) {
      const { data: otherProfiles } = await admin
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', [...otherUserIds])

      const profileMap = new Map((otherProfiles ?? []).map((p) => [p.user_id, p]))
      otherUserIds.forEach((otherId) => {
        const p = profileMap.get(otherId)
        const name = (p as any)?.display_name ?? (p as any)?.email?.split('@')[0] ?? 'Support'
        directThreads.push({
          kind: 'direct',
          otherUserId: otherId,
          otherName: name,
          lastMessage: directMap.get(otherId),
        })
      })
    }
  }

  type Thread = JobThread | DirectThread

  const allThreads: Thread[] = [...jobThreads, ...directThreads]
  allThreads.sort((a, b) => {
    if (!a.lastMessage) return 1
    if (!b.lastMessage) return -1
    return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 text-sm mt-0.5">Conversations with clients and printer owners</p>
      </div>

      {allThreads.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          }
          title="No conversations yet"
          description="Messaging opens once a quote is accepted on a job."
        />
      ) : (
        <div className="card divide-y divide-gray-100">
          {allThreads.map((t) => {
            const href = t.kind === 'job' ? `/messages/${t.jobId}` : `/messages/direct/${t.otherUserId}`
            const title = t.kind === 'job' ? t.title : t.otherName
            const subtitle = t.kind === 'direct' ? (
              <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                Support chat
              </span>
            ) : null

            return (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
                    {subtitle}
                  </div>
                  {t.lastMessage ? (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {t.lastMessage.sender_id === effectiveUserId ? 'You: ' : ''}
                      {t.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">No messages yet - start the conversation</p>
                  )}
                </div>
                {t.lastMessage && (
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-3">
                    {formatRelativeTime(t.lastMessage.created_at)}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
