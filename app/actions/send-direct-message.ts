'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export async function sendDirectMessage({
  receiverId,
  content,
}: {
  receiverId: string
  content: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (!content.trim()) throw new Error('Message cannot be empty')

  const admin = createAdminClient()

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    // Regular user can only reply if admin has already sent them a message in this direct thread
    const { count } = await admin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .is('job_id', null)
      .eq('sender_id', receiverId)
      .eq('receiver_id', user.id)

    if (!count || count === 0) throw new Error('Not authorized')
  }

  const { data, error } = await admin
    .from('messages')
    .insert({
      job_id:      null,
      sender_id:   user.id,
      receiver_id: receiverId,
      content:     content.trim(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Non-blocking email notification to receiver
  notifyDirectMessageReceiver({ senderId: user.id, receiverId, content: content.trim() }).catch(() => {})

  return { message: data }
}

async function notifyDirectMessageReceiver({
  senderId,
  receiverId,
  content,
}: {
  senderId: string
  receiverId: string
  content: string
}) {
  try {
    const admin = createAdminClient()

    // 1-hour cooldown per sender→receiver pair to avoid spamming
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await admin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .is('job_id', null)
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .gte('created_at', since)

    if ((recentCount ?? 0) > 1) return

    const [{ data: senderProfile }, { data: receiverProfile }] = await Promise.all([
      admin.from('profiles').select('display_name, email, role').eq('user_id', senderId).single(),
      admin.from('profiles').select('email').eq('user_id', receiverId).single(),
    ])

    if (!receiverProfile?.email) return

    const senderName = (senderProfile as any)?.role === 'admin'
      ? 'PrintMarketHub Support'
      : ((senderProfile as any)?.display_name ?? 'A user')

    await sendEmail({
      to: (receiverProfile as any).email,
      subject: `New message from ${senderName}`,
      html: `
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1625;">You have a new message</h2>
        <p style="margin:0 0 4px;color:#6b6760;font-size:14px;">From: <strong>${senderName}</strong></p>
        <div style="margin:12px 0;padding:12px 16px;background:#f9f8f6;border-left:3px solid #1a1625;border-radius:0 8px 8px 0;color:#1a1625;font-size:14px;line-height:1.6;white-space:pre-wrap;">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.printmarkethub.com'}/messages/direct/${senderId}" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#1a1625;color:#fff;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">Reply →</a>
      `,
    })
  } catch {
    // non-critical
  }
}
