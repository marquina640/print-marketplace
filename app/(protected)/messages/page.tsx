import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { formatRelativeTime } from '@/lib/utils'

export const metadata = { title: 'Messages' }

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  const cookieStore = await cookies()
  const previewUserId = profile?.role === 'admin' ? cookieStore.get('admin_preview_user_id')?.value : undefined
  const effectiveUserId = previewUserId ?? user.id

  // Get all jobs where the effective user is either the client or the accepted printer
  const { data: clientJobs } = await supabase
    .from('jobs')
    .select('id, title, status, accepted_quote_id')
    .eq('client_id', effectiveUserId)
    .not('accepted_quote_id', 'is', null)

  const { data: printerQuotes } = await supabase
    .from('quotes')
    .select('job_id, jobs(id, title, status, client_id)')
    .eq('printer_id', effectiveUserId)
    .eq('status', 'accepted')

  const jobIds = [
    ...(clientJobs?.map((j) => j.id) ?? []),
    ...(printerQuotes?.map((q) => q.job_id) ?? []),
  ]

  const { data: lastMessages } = jobIds.length > 0
    ? await supabase
        .from('messages')
        .select('*')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Build thread map: jobId → latest message
  const threadMap = new Map<string, typeof lastMessages extends (infer T)[] ? T : never>()
  lastMessages?.forEach((m) => {
    if (!threadMap.has(m.job_id)) threadMap.set(m.job_id, m)
  })

  type JobThread = {
    jobId: string
    title: string
    lastMessage: (typeof lastMessages extends (infer T)[] ? T : never) | undefined
  }

  const threads: JobThread[] = []

  clientJobs?.forEach((j) => {
    threads.push({ jobId: j.id, title: j.title, lastMessage: threadMap.get(j.id) })
  })
  printerQuotes?.forEach((q) => {
    const job = q.jobs as { id: string; title: string } | null
    if (job && !threads.find((t) => t.jobId === job.id)) {
      threads.push({ jobId: job.id, title: job.title, lastMessage: threadMap.get(job.id) })
    }
  })

  // Sort by last message time
  threads.sort((a, b) => {
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

      {threads.length === 0 ? (
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
          {threads.map((t) => (
            <Link
              key={t.jobId}
              href={`/messages/${t.jobId}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
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
          ))}
        </div>
      )}
    </div>
  )
}
