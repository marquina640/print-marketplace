'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  emailNewQuote,
  emailQuoteAccepted,
  emailJobPaid,
  emailJobShipped,
  emailDeliveryConfirmed,
  emailNewMessage,
  emailReviewsPublished,
} from '@/lib/email'

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
    await (admin as any).from('notifications').insert({
      user_id: userId,
      type,
      title,
      body:    body ?? null,
      link:    link ?? null,
    })
  } catch {
    // notifications are non-critical — never throw
  }
}

// ─── Quote submitted ─────────────────────────────────────────────────────────

export async function notifyNewQuote({
  jobId, jobTitle, makerName, clientId, clientEmail, price,
}: {
  jobId: string; jobTitle: string; makerName: string
  clientId: string; clientEmail: string; price: number
}) {
  await createNotification({
    userId: clientId,
    type:   'new_quote',
    title:  `New quote for "${jobTitle}"`,
    body:   `${makerName} quoted CHF ${price.toFixed(2)}`,
    link:   `/jobs/${jobId}`,
  })
  await emailNewQuote({ to: clientEmail, jobTitle, makerName, price, jobUrl: `/jobs/${jobId}` })
}

// ─── Quote accepted ──────────────────────────────────────────────────────────

export async function notifyQuoteAccepted({
  jobId, jobTitle, printerId, printerEmail, price,
}: {
  jobId: string; jobTitle: string; printerId: string; printerEmail: string; price: number
}) {
  await createNotification({
    userId: printerId,
    type:   'quote_accepted',
    title:  'Your quote was accepted!',
    body:   `CHF ${price.toFixed(2)} — ${jobTitle}`,
    link:   `/jobs/${jobId}`,
  })
  await emailQuoteAccepted({ to: printerEmail, jobTitle, price, jobUrl: `/jobs/${jobId}` })
}

// ─── Payment received (maker notified) ──────────────────────────────────────

export async function notifyJobPaid({
  jobId, jobTitle, printerId, printerEmail, price,
}: {
  jobId: string; jobTitle: string; printerId: string; printerEmail: string; price: number
}) {
  await createNotification({
    userId: printerId,
    type:   'job_paid',
    title:  'Payment received — start printing!',
    body:   `CHF ${price.toFixed(2)} is held in escrow for "${jobTitle}"`,
    link:   `/jobs/${jobId}`,
  })
  await emailJobPaid({ to: printerEmail, jobTitle, price, jobUrl: `/jobs/${jobId}` })
}

// ─── Job shipped (client notified) ──────────────────────────────────────────

export async function notifyJobShipped({
  jobId, jobTitle, clientId, clientEmail, inPerson, carrier, trackingNumber,
}: {
  jobId: string; jobTitle: string; clientId: string; clientEmail: string
  inPerson: boolean; carrier?: string; trackingNumber?: string
}) {
  const body = inPerson
    ? `"${jobTitle}" has been handed over in person.`
    : `"${jobTitle}" is on its way${carrier ? ` via ${carrier}` : ''}${trackingNumber ? ` — tracking: ${trackingNumber}` : ''}`

  await createNotification({
    userId: clientId,
    type:   'job_shipped',
    title:  inPerson ? 'Order handed over!' : 'Your order has shipped!',
    body,
    link:   `/jobs/${jobId}`,
  })
  await emailJobShipped({ to: clientEmail, jobTitle, inPerson, carrier, trackingNumber, jobUrl: `/jobs/${jobId}` })
}

// ─── Delivery confirmed (maker notified) ─────────────────────────────────────

export async function notifyDeliveryConfirmed({
  jobId, jobTitle, printerId, printerEmail,
}: {
  jobId: string; jobTitle: string; printerId: string; printerEmail: string
}) {
  await createNotification({
    userId: printerId,
    type:   'job_delivered',
    title:  'Delivery confirmed!',
    body:   `The client confirmed receipt of "${jobTitle}". Your payment is being processed.`,
    link:   `/jobs/${jobId}`,
  })
  await emailDeliveryConfirmed({ to: printerEmail, jobTitle, jobUrl: `/jobs/${jobId}` })
}

// ─── New message ─────────────────────────────────────────────────────────────

export async function notifyMessageReceived({
  jobId, jobTitle, senderId, senderName, receiverId, receiverEmail, content,
}: {
  jobId: string; jobTitle: string; senderId: string; senderName: string
  receiverId: string; receiverEmail: string; content: string
}) {
  await createNotification({
    userId: receiverId,
    type:   'new_message',
    title:  `New message from ${senderName}`,
    body:   content.length > 80 ? content.slice(0, 80) + '…' : content,
    link:   `/messages/${jobId}`,
  })
  await emailNewMessage({
    to:         receiverEmail,
    senderName,
    jobTitle,
    preview:    content,
    jobUrl:     `/messages/${jobId}`,
  })
}

// ─── Reviews published (both parties notified) ───────────────────────────────

export async function notifyReviewsPublished({
  jobId, jobTitle,
  party1: { userId: u1, email: e1, reviewerName: r1, rating: rat1, comment: com1 },
  party2: { userId: u2, email: e2, reviewerName: r2, rating: rat2, comment: com2 },
}: {
  jobId: string; jobTitle: string
  party1: { userId: string; email: string; reviewerName: string; rating: number; comment: string | null }
  party2: { userId: string; email: string; reviewerName: string; rating: number; comment: string | null }
}) {
  await Promise.all([
    createNotification({
      userId: u1,
      type:   'review_published',
      title:  `Reviews for "${jobTitle}" are now public`,
      link:   `/jobs/${jobId}`,
    }),
    createNotification({
      userId: u2,
      type:   'review_published',
      title:  `Reviews for "${jobTitle}" are now public`,
      link:   `/jobs/${jobId}`,
    }),
    // u1 sees what r2 wrote about them, and vice-versa
    emailReviewsPublished({ to: e1, reviewerName: r2, jobTitle, rating: rat2, comment: com2, jobUrl: `/jobs/${jobId}` }),
    emailReviewsPublished({ to: e2, reviewerName: r1, jobTitle, rating: rat1, comment: com1, jobUrl: `/jobs/${jobId}` }),
  ])
}

// ─── Mark notifications read ─────────────────────────────────────────────────

export async function markNotificationsRead(ids: string[]) {
  if (ids.length === 0) return
  const supabase = await createClient()
  await (supabase as any).from('notifications').update({ is_read: true }).in('id', ids)
}
