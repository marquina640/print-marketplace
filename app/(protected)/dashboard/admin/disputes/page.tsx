import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'
import { ResolveDisputeButton } from './resolve-dispute-button'

export const metadata = { title: 'Disputes - Admin' }

export default async function AdminDisputesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()

  const { data: disputes } = await admin
    .from('disputes')
    .select('*')
    .order('created_at', { ascending: false })

  const jobIds = [...new Set((disputes ?? []).map((d) => (d as any).job_id))]
  const clientIds = [...new Set((disputes ?? []).map((d) => (d as any).client_id))]

  const { data: jobs } = jobIds.length > 0
    ? await admin.from('jobs').select('id, title, stripe_session_id').in('id', jobIds)
    : { data: [] }

  const { data: clients } = clientIds.length > 0
    ? await admin.from('profiles').select('user_id, display_name, email').in('user_id', clientIds)
    : { data: [] }

  const jobMap    = Object.fromEntries((jobs ?? []).map((j) => [j.id, j]))
  const clientMap = Object.fromEntries((clients ?? []).map((c) => [(c as any).user_id, c]))

  const open     = (disputes ?? []).filter((d) => (d as any).status === 'open')
  const resolved = (disputes ?? []).filter((d) => (d as any).status !== 'open')

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="section-heading">Disputes</h1>
        <p className="text-warm-500 text-sm mt-0.5">
          {open.length} open · {resolved.length} resolved
        </p>
      </div>

      {open.length === 0 && resolved.length === 0 && (
        <div className="card p-8 text-center text-warm-400 text-sm">No disputes yet.</div>
      )}

      {open.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-orange-700">Open ({open.length})</h2>
          <div className="space-y-3">
            {open.map((d: any) => (
              <DisputeCard key={d.id} dispute={d} job={jobMap[d.job_id]} client={clientMap[d.client_id]} />
            ))}
          </div>
        </section>
      )}

      {resolved.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-warm-500">Resolved ({resolved.length})</h2>
          <div className="space-y-3">
            {resolved.map((d: any) => (
              <DisputeCard key={d.id} dispute={d} job={jobMap[d.job_id]} client={clientMap[d.client_id]} resolved />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function DisputeCard({ dispute, job, client, resolved }: {
  dispute: any
  job: any
  client: any
  resolved?: boolean
}) {
  return (
    <div className={`card p-5 space-y-3 ${resolved ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="font-semibold text-warm-900 text-sm">
            {job ? (
              <Link href={`/jobs/${job.id}`} className="hover:underline" target="_blank">
                {job.title}
              </Link>
            ) : 'Unknown job'}
          </p>
          <p className="text-xs text-warm-500">
            By {client?.display_name ?? client?.email ?? 'Unknown'} · {formatDate(dispute.created_at)}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          dispute.status === 'open'
            ? 'bg-orange-100 text-orange-700'
            : dispute.status === 'resolved'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-warm-100 text-warm-500'
        }`}>
          {dispute.status}
        </span>
      </div>

      <div className="rounded-lg bg-warm-50 border border-warm-100 px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-warm-600">Reason</p>
        <p className="text-sm text-warm-900">{dispute.reason}</p>
        {dispute.details && (
          <>
            <p className="text-xs font-semibold text-warm-600 pt-1">Details</p>
            <p className="text-sm text-warm-700">{dispute.details}</p>
          </>
        )}
      </div>

      {!resolved && <ResolveDisputeButton disputeId={dispute.id} hasStripeSession={!!(job as any)?.stripe_session_id} warningSentAt={dispute.warning_sent_at ?? null} />}
      {dispute.resolved_at && (
        <p className="text-xs text-warm-400">Resolved on {formatDate(dispute.resolved_at)}</p>
      )}
    </div>
  )
}
