'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function reviewCertificationRequest(
  requestId: string,
  decision: 'approved' | 'rejected' | 'more_info',
  adminNotes: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not authorized')

  const { data: request } = await supabase
    .from('certification_requests')
    .select('maker_id, requested_level, status')
    .eq('id', requestId).single()

  if (!request) throw new Error('Request not found')
  if (request.status !== 'pending') throw new Error('Request already reviewed')

  // Update request status
  const { error: updateError } = await supabase
    .from('certification_requests')
    .update({ status: decision, admin_notes: adminNotes.trim() || null })
    .eq('id', requestId)

  if (updateError) throw new Error(updateError.message)

  // If approved, bump certification level
  if (decision === 'approved') {
    const { error: certError } = await supabase
      .from('printer_profiles')
      .update({ certification_level: request.requested_level })
      .eq('user_id', request.maker_id)

    if (certError) throw new Error(certError.message)
  }

  revalidatePath('/dashboard/admin/certifications')
  revalidatePath('/dashboard/admin')
}
