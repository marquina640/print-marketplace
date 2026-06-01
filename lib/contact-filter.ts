/**
 * Filters contact information from chat messages to prevent off-platform deals.
 * Runs both client-side (for instant feedback) and server-side (enforcement).
 */

const RULES: { pattern: RegExp; label: string }[] = [
  // Email addresses
  { pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g, label: 'email' },

  // URLs
  { pattern: /https?:\/\/[^\s]+/gi, label: 'link' },
  { pattern: /\bwww\.[^\s]{2,}/gi,  label: 'link' },

  // WhatsApp
  { pattern: /\bwa\.me\/[^\s]*/gi,    label: 'contact' },
  { pattern: /\bwhatsapp\b/gi,        label: 'contact' },

  // Telegram
  { pattern: /\bt\.me\/[^\s]*/gi,     label: 'contact' },
  { pattern: /\btelegram\b/gi,        label: 'contact' },

  // Instagram / TikTok / Snapchat
  { pattern: /\binstagram\.com\/[^\s]*/gi, label: 'contact' },
  { pattern: /\bsnapchat\b/gi,            label: 'contact' },
  { pattern: /\btiktok\b/gi,              label: 'contact' },

  // Phone - international (+XX …)
  { pattern: /\+\d{1,3}[\s\-.]?\(?\d{1,4}\)?[\s\-.]?\d{2,4}[\s\-.]?\d{2,4}[\s\-.]?\d{0,4}/g, label: 'phone' },

  // Phone - Swiss mobile (07X XXX XX XX)
  { pattern: /\b07\d[\s.]?\d{3}[\s.]?\d{2}[\s.]?\d{2}\b/g, label: 'phone' },

  // Phone - generic 10-digit blocks
  { pattern: /\b\d{3}[\s\-.]?\d{3}[\s\-.]?\d{4}\b/g, label: 'phone' },

  // Social @handle (must come last - only block if next to a keyword to reduce false positives)
  { pattern: /\b(?:ig|insta|snap|tg|signal)\s*[:=]?\s*@?[A-Za-z0-9._]{3,}/gi, label: 'contact' },
]

export function filterContactInfo(text: string): {
  filtered: string
  wasModified: boolean
  removedTypes: string[]
} {
  let result = text
  const removedTypes: string[] = []

  for (const { pattern, label } of RULES) {
    const before = result
    result = result.replace(pattern, `[${label} removed]`)
    if (result !== before && !removedTypes.includes(label)) {
      removedTypes.push(label)
    }
  }

  return { filtered: result, wasModified: result !== text, removedTypes }
}
