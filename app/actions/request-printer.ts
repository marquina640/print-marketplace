'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function requestPrinter(brand: string, model: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const brandTrimmed = brand.trim()
  const modelTrimmed = model.trim()
  if (!brandTrimmed || !modelTrimmed) return { error: 'Brand and model are required' }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'PrintMarketHub <hello@printmarkethub.com>',
      to: 'fermarquina640@gmail.com',
      subject: `Printer request: ${brandTrimmed} ${modelTrimmed}`,
      html: `
        <p>A maker has requested a printer to be added to the list.</p>
        <p><strong>Brand:</strong> ${brandTrimmed}</p>
        <p><strong>Model:</strong> ${modelTrimmed}</p>
        <p><strong>User:</strong> ${user.email} (${user.id})</p>
      `,
    })
    return { ok: true }
  } catch {
    return { error: 'Failed to send request' }
  }
}
