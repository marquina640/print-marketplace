'use server'

import { createClient } from '@/lib/supabase/server'
import { filterContactInfo } from '@/lib/contact-filter'

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

  return { message: data, wasModified, removedTypes }
}
