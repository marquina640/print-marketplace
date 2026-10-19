'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

export async function sendAdminMessage({ toEmail, toName, subject, body }: {
  toEmail: string
  toName: string
  subject: string
  body: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')

  if (!subject.trim() || !body.trim()) throw new Error('Subject and message are required')

  await sendEmail({
    to: toEmail,
    subject: subject.trim(),
    html: `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1625;">Message from PrintMarketHub</h2>
      <p style="margin:0 0 20px;color:#6b6760;font-size:14px;line-height:1.6;">Hi ${toName},</p>
      <div style="white-space:pre-wrap;color:#1a1625;font-size:14px;line-height:1.7;margin:0 0 20px;">${body.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      <p style="margin:0;color:#9e9b94;font-size:12px;">— The PrintMarketHub team</p>
    `,
  })
}
