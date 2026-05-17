'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string
  type: string
  title: string
  body?: string
  link?: string
}) {
  try {
    const admin = createAdminClient()
    await (admin as any).from('notifications').insert({ user_id: userId, type, title, body: body ?? null, link: link ?? null })
  } catch {
    // notifications are non-critical — never throw
  }
}

export async function notifyNewQuote({
  jobId,
  jobTitle,
  makerName,
  clientId,
  clientEmail,
  price,
}: {
  jobId: string
  jobTitle: string
  makerName: string
  clientId: string
  clientEmail: string
  price: number
}) {
  await createNotification({
    userId: clientId,
    type: 'new_quote',
    title: `New quote for "${jobTitle}"`,
    body: `${makerName} quoted CHF ${price.toFixed(2)}`,
    link: `/jobs/${jobId}`,
  })

  await sendEmail({
    to: clientEmail,
    subject: `New quote for "${jobTitle}"`,
    html: `
      <p>Hi,</p>
      <p><strong>${makerName}</strong> submitted a quote of <strong>CHF ${price.toFixed(2)}</strong> for your job <em>${jobTitle}</em>.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}">View the quote →</a></p>
    `,
  })
}

export async function notifyQuoteAccepted({
  jobId,
  jobTitle,
  printerId,
  printerEmail,
  price,
}: {
  jobId: string
  jobTitle: string
  printerId: string
  printerEmail: string
  price: number
}) {
  await createNotification({
    userId: printerId,
    type: 'quote_accepted',
    title: `Your quote was accepted!`,
    body: `CHF ${price.toFixed(2)} — ${jobTitle}`,
    link: `/jobs/${jobId}`,
  })

  await sendEmail({
    to: printerEmail,
    subject: `Your quote for "${jobTitle}" was accepted!`,
    html: `
      <p>Great news!</p>
      <p>Your quote of <strong>CHF ${price.toFixed(2)}</strong> for <em>${jobTitle}</em> was accepted.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}">Open the job to start the conversation →</a></p>
    `,
  })
}

export async function markNotificationsRead(ids: string[]) {
  if (ids.length === 0) return
  const supabase = await createClient()
  await (supabase as any).from('notifications').update({ is_read: true }).in('id', ids)
}
