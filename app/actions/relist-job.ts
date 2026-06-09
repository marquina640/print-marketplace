'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function relistJob(jobId: string) {
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
  const { data: job } = await admin.from('jobs').select('*').eq('id', jobId).single()
  if (!job) throw new Error('Job not found')
  if ((job as any).client_id !== effectiveUserId && (profile as any)?.role !== 'admin') {
    throw new Error('Not authorised')
  }
  if ((job as any).status !== 'open') throw new Error('Only open jobs can be relisted')

  await admin.from('jobs').update({ created_at: new Date().toISOString() } as any).eq('id', jobId)

  revalidatePath('/dashboard/client')
  revalidatePath(`/jobs/${jobId}`)
}
