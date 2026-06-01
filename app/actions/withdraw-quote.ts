'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function withdrawQuote(quoteId: string, jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()

  const cookieStore = await cookies()
  const previewUserId = (profile as any)?.role === 'admin'
    ? cookieStore.get('admin_preview_user_id')?.value
    : undefined
  const effectiveUserId = previewUserId ?? user.id

  const admin = createAdminClient()

  // Validate quote belongs to this maker and is still pending
  const { data: quote } = await admin
    .from('quotes').select('printer_id, status').eq('id', quoteId).single()

  if (!quote) throw new Error('Quote not found')
  if ((quote as any).printer_id !== effectiveUserId) throw new Error('Not your quote')
  if ((quote as any).status !== 'pending') throw new Error('Only pending quotes can be withdrawn')

  // Delete the quote
  await admin.from('quotes').delete().eq('id', quoteId)

  // If no pending quotes remain, move job back to 'open'
  const { count } = await admin
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', jobId)
    .eq('status', 'pending')

  if ((count ?? 0) === 0) {
    await admin
      .from('jobs')
      .update({ status: 'open' } as any)
      .eq('id', jobId)
      .eq('status', 'quoted')
  }

  revalidatePath(`/jobs/${jobId}`)
}
