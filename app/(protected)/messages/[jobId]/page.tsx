import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MessageThread } from '@/components/messages/message-thread'

interface PageProps {
  params: Promise<{ jobId: string }>
}

export default async function MessageThreadPage({ params }: PageProps) {
  const { jobId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, client_id, accepted_quote_id')
    .eq('id', jobId)
    .single()

  if (!job) notFound()

  // Find the accepted quote to get the printer
  const { data: acceptedQuote } = await supabase
    .from('quotes')
    .select('printer_id, profiles:printer_id(display_name, email)')
    .eq('job_id', jobId)
    .eq('status', 'accepted')
    .single()

  if (!acceptedQuote) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <p className="text-gray-500">Messaging is only available after a quote has been accepted.</p>
          <Link href={`/jobs/${jobId}`} className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-700">
            View job →
          </Link>
        </div>
      </div>
    )
  }

  const isClient = job.client_id === user.id
  const isPrinter = acceptedQuote.printer_id === user.id

  if (!isClient && !isPrinter) redirect('/messages')

  const receiverId = isClient ? acceptedQuote.printer_id : job.client_id

  const { data: printerProfile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('user_id', acceptedQuote.printer_id)
    .single()

  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('user_id', job.client_id)
    .single()

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })

  const otherPartyName = isClient
    ? (printerProfile?.display_name ?? printerProfile?.email ?? 'Printer Owner')
    : (clientProfile?.display_name ?? clientProfile?.email ?? 'Customer')

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/messages" className="text-sm text-gray-500 hover:text-gray-900">← Messages</Link>
        <span className="text-gray-300">|</span>
        <div>
          <p className="text-sm font-semibold text-gray-900">{job.title}</p>
          <p className="text-xs text-gray-500">with {otherPartyName}</p>
        </div>
      </div>

      <MessageThread
        jobId={jobId}
        currentUserId={user.id}
        receiverId={receiverId}
        jobTitle={job.title}
        initialMessages={messages ?? []}
      />
    </div>
  )
}
