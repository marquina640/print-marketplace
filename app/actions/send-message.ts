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

async function notifyMessageForReceiver({
  jobId, senderId, receiverId, content,
}: {
  jobId: string; senderId: string; receiverId: string; content: string
}) {
  try {
    const admin = createAdminClient()

    const [{ data: job }, { data: senderProfile }, { data: receiverProfile }] = await Promise.all([
      admin.from('jobs').select('title').eq('id', jobId).single(),
      admin.from('profiles').select('display_name, email').eq('user_id', senderId).single(),
      admin.from('profiles').select('email').eq('user_id', receiverId).single(),
    ])

    if (!job || !senderProfile || !receiverProfile?.email) return

    const senderName = senderProfile.display_name ?? senderProfile.email?.split('@')[0] ?? 'Someone'

    await notifyMessageReceived({
      jobId,
      jobTitle:      job.title,
      senderId,
      senderName,
      receiverId,
      receiverEmail: receiverProfile.email,
      content,
    })
  } catch {
    // non-critical
  }
}
