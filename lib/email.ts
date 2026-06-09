import { Resend } from 'resend'

const FROM = 'PrintMarketHub <noreply@printmarkethub.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://printmarkethub.com'

/** Wraps content HTML in a clean branded email shell */
function emailTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr>
          <td style="padding-bottom:20px;text-align:center;">
            <span style="font-size:20px;font-weight:900;letter-spacing:-0.5px;color:#1a1625;">
              PrintMarket<span style="color:#D4A017;">Hub</span>
            </span>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;border-radius:16px;border:1px solid #e5e1d8;padding:36px 40px;">
            ${content}
          </td>
        </tr>

        <tr>
          <td style="padding-top:20px;text-align:center;font-size:11px;color:#9e9b94;line-height:1.6;">
            &copy; ${new Date().getFullYear()} PrintMarketHub &middot; Switzerland<br/>
            <a href="${APP_URL}/terms" style="color:#9e9b94;text-decoration:underline;">Terms</a>
            &nbsp;&middot;&nbsp;
            <a href="${APP_URL}/legal/privacy" style="color:#9e9b94;text-decoration:underline;">Privacy</a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton(label: string, url: string): string {
  return `<p style="margin:24px 0 0;">
    <a href="${url}" style="display:inline-block;background:#D4A017;color:#1a1625;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
      ${label}
    </a>
  </p>`
}

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
    await resend.emails.send({ from: FROM, to, subject, html: emailTemplate(html) })
  } catch (err) {
    console.error('[email] send failed:', err)
  }
}

// ─── Typed email helpers ────────────────────────────────────────────────────

export function emailNewQuote({
  to, jobTitle, makerName, price, jobUrl,
}: { to: string; jobTitle: string; makerName: string; price: number; jobUrl: string }) {
  return sendEmail({
    to,
    subject: `New quote for "${jobTitle}"`,
    html: `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1625;">You have a new quote</h2>
      <p style="margin:0 0 20px;color:#6b6760;font-size:14px;line-height:1.6;">
        <strong style="color:#1a1625;">${makerName}</strong> submitted a quote of
        <strong style="color:#1a1625;">CHF ${price.toFixed(2)}</strong> for
        <em>${jobTitle}</em>.
      </p>
      <p style="margin:0;color:#6b6760;font-size:14px;">
        Review the quote, compare with others, and accept when you&apos;re ready.
      </p>
      ${ctaButton('View Quote &rarr;', `${APP_URL}${jobUrl}`)}
    `,
  })
}

export function emailQuoteAccepted({
  to, jobTitle, price, jobUrl,
}: { to: string; jobTitle: string; price: number; jobUrl: string }) {
  return sendEmail({
    to,
    subject: `Your quote for "${jobTitle}" was accepted!`,
    html: `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1625;">Your quote was accepted &#x1F389;</h2>
      <p style="margin:0 0 20px;color:#6b6760;font-size:14px;line-height:1.6;">
        Your quote of <strong style="color:#1a1625;">CHF ${price.toFixed(2)}</strong> for
        <em>${jobTitle}</em> has been accepted. The client will proceed to payment shortly.
      </p>
      <p style="margin:0;color:#6b6760;font-size:14px;">
        Keep an eye on your messages &mdash; the client may want to discuss details before paying.
      </p>
      ${ctaButton('Open Job &rarr;', `${APP_URL}${jobUrl}`)}
    `,
  })
}

export function emailJobPaid({
  to, jobTitle, price, jobUrl,
}: { to: string; jobTitle: string; price: number; jobUrl: string }) {
  return sendEmail({
    to,
    subject: `Payment received - "${jobTitle}" is ready to print`,
    html: `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1625;">Payment confirmed &#x1F4B3;</h2>
      <p style="margin:0 0 20px;color:#6b6760;font-size:14px;line-height:1.6;">
        <strong style="color:#1a1625;">CHF ${price.toFixed(2)}</strong> has been received
        for <em>${jobTitle}</em>. You can start printing now.
      </p>
      ${ctaButton('View Job &rarr;', `${APP_URL}${jobUrl}`)}
    `,
  })
}

export function emailJobShipped({
  to, jobTitle, inPerson, carrier, trackingNumber, jobUrl,
}: { to: string; jobTitle: string; inPerson: boolean; carrier?: string; trackingNumber?: string; jobUrl: string }) {
  const trackingBlock = trackingNumber
    ? `<p style="margin:0 0 20px;background:#f5f4f0;border-radius:8px;padding:12px 16px;font-family:monospace;font-size:14px;color:#1a1625;">
         Tracking: <strong>${trackingNumber}</strong>
       </p>`
    : `<p style="margin:0 0 20px;color:#9e9b94;font-size:14px;font-style:italic;">No tracking number was provided.</p>`

  const body = inPerson
    ? `<p style="margin:0 0 20px;color:#6b6760;font-size:14px;line-height:1.6;">
         Your order <em>${jobTitle}</em> has been <strong style="color:#1a1625;">handed over in person</strong>.
         Please confirm receipt on the platform so the maker gets paid.
       </p>`
    : `<p style="margin:0 0 8px;color:#6b6760;font-size:14px;line-height:1.6;">
         Your order <em>${jobTitle}</em> is on its way${carrier ? ` via <strong style="color:#1a1625;">${carrier}</strong>` : ''}.
       </p>${trackingBlock}`

  return sendEmail({
    to,
    subject: inPerson ? `Order handed over &mdash; "${jobTitle}"` : `Your order has shipped &mdash; "${jobTitle}"`,
    html: `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1625;">
        ${inPerson ? 'Order handed over &#x1F91D;' : 'Your order is on its way &#x1F4E6;'}
      </h2>
      ${body}
      <p style="margin:0;color:#6b6760;font-size:14px;">
        Once it arrives, confirm receipt on PrintMarketHub so the maker gets paid.
      </p>
      ${ctaButton('Confirm Receipt &rarr;', `${APP_URL}${jobUrl}`)}
    `,
  })
}

export function emailDeliveryConfirmed({
  to, jobTitle, jobUrl,
}: { to: string; jobTitle: string; jobUrl: string }) {
  return sendEmail({
    to,
    subject: `Delivery confirmed - payment for "${jobTitle}" is being processed`,
    html: `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1625;">Delivery confirmed &#x2705;</h2>
      <p style="margin:0 0 20px;color:#6b6760;font-size:14px;line-height:1.6;">
        The client confirmed receipt of <em>${jobTitle}</em>. Your payment is on its way to your PayPal account.
      </p>
      <p style="margin:0;color:#6b6760;font-size:14px;">
        Don&apos;t forget to leave a review &mdash; it helps build your reputation on the platform.
      </p>
      ${ctaButton('Leave a Review &rarr;', `${APP_URL}${jobUrl}`)}
    `,
  })
}

export function emailNewMessage({
  to, senderName, jobTitle, preview, jobUrl,
}: { to: string; senderName: string; jobTitle: string; preview: string; jobUrl: string }) {
  const safePreview = preview.length > 200 ? preview.slice(0, 200) + '&hellip;' : preview
  return sendEmail({
    to,
    subject: `New message from ${senderName} - "${jobTitle}"`,
    html: `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1625;">New message &#x1F4AC;</h2>
      <p style="margin:0 0 16px;color:#6b6760;font-size:14px;">
        <strong style="color:#1a1625;">${senderName}</strong> sent you a message about <em>${jobTitle}</em>:
      </p>
      <blockquote style="margin:0 0 20px;padding:12px 16px;background:#f5f4f0;border-left:3px solid #D4A017;border-radius:0 8px 8px 0;color:#1a1625;font-size:14px;line-height:1.6;">
        ${safePreview}
      </blockquote>
      ${ctaButton('Reply &rarr;', `${APP_URL}${jobUrl}`)}
    `,
  })
}

export function emailReviewsPublished({
  to, reviewerName, jobTitle, rating, comment, jobUrl,
}: { to: string; reviewerName: string; jobTitle: string; rating: number; comment: string | null; jobUrl: string }) {
  const stars = '&#x2605;'.repeat(rating) + '&#x2606;'.repeat(5 - rating)
  const commentBlock = comment
    ? `<p style="margin:0;color:#1a1625;font-size:14px;line-height:1.6;">&ldquo;${comment}&rdquo;</p>`
    : `<p style="margin:0;color:#9e9b94;font-size:14px;font-style:italic;">No comment left.</p>`

  return sendEmail({
    to,
    subject: `Your review for "${jobTitle}" is now public`,
    html: `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1625;">Reviews are live &#x2B50;</h2>
      <p style="margin:0 0 16px;color:#6b6760;font-size:14px;line-height:1.6;">
        Both parties have reviewed <em>${jobTitle}</em>. Here&apos;s what
        <strong style="color:#1a1625;">${reviewerName}</strong> said about you:
      </p>
      <div style="background:#f5f4f0;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:20px;color:#D4A017;letter-spacing:2px;">${stars}</p>
        ${commentBlock}
      </div>
      ${ctaButton('View Job &rarr;', `${APP_URL}${jobUrl}`)}
    `,
  })
}
