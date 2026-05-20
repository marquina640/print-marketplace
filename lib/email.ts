import { Resend } from 'resend'

const FROM = 'PrintMarketHub <noreply@printmarkethub.com>'

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 'your-resend-key-here') {
    console.log(`[email dev] To: ${to} | Subject: ${subject}`)
    return
  }

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error('[email] send failed:', err)
  }
}
