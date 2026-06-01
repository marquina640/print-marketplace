'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { filterContactInfo } from '@/lib/contact-filter'
import { notifyMessageReceived } from './notifications'

export async function sendMessage({
  jobId,
  senderId,
  receiverId,
  content,
}: {
  jobId: string
  senderId: string
  receiverId: string
  content: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { filtered, wasModified, removedTypes } = filterContactInfo(content.trim())

  const { data, error } = await supabase
    .from('messages')
    .insert({
      job_id:      jobId,
      sender_id:   senderId,
      receiver_id: receiverId,
      content:     filtered,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Fire email notification to the receiver (non-blocking)
  notifyMessageForReceiver({ jobId, senderId, receiverId, content: filtered }).catch(() => {})

  return { message: data, wasModified, removedTypes }
}

// Only email once per hour per thread - avoids spamming during active conversations
const EMAIL_COOLDOWN_MINUTES = 60

async function notifyMessageForReceiver({
  jobId, senderId, receiverId, content,
}: {
  jobId: string; senderId: string; receiverId: string; content: string
}) {
  try {
    const admin = createAdminClient()

    // Count messages sent in this thread (same sender→receiver, same job) in the last hour.
    // If more than 1 exists it means we already emailed recently - the current message
    // was just inserted so a count of 1 means it's the first in the cooldown window.
    const since = new Date(Date.now() - EMAIL_COOLDOWN_MINUTES * 60 * 1000).toISOString()
    const { count: recentCount } = await admin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId)
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .gte('created_at', since)

    // recentCount includes the message we just inserted.
    // If it's > 1, an email was already sent within the cooldown window - skip.
    if ((recentCount ?? 0) > 1) return

    const [{ data: job }, { data: senderProfile }, { data: receiverProfile }] = await Promise.all([
      admin.from('jobs').select('title').eq('id', jobId).single(),
      admin.from('profiles').select('display_name, email').eq('user_id', senderId).single(),
      admin.from('profiles').select('email').eq('user_id', receiverId).single(),
    ])

    if (!job || !senderProfile || !receiverProfile?.email) return

    const senderName = (senderProfile as any).display_name ?? (senderProfile as any).email?.split('@')[0] ?? 'Someone'

    await notifyMessageReceived({
      jobId,
      jobTitle:      (job as any).title,
      senderId,
      senderName,
      receiverId,
      receiverEmail: (receiverProfile as any).email,
      content,
    })
  } catch {
    // non-critical
  }
}
