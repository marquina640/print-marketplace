import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/badge'
import { CreateUserForm } from './create-user-form'

export const metadata = { title: 'Users — Admin' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('user_id, email, display_name, role, created_at, onboarding_complete')
    .order('created_at', { ascending: false })

  const allUserIds = users?.map((u) => u.user_id) ?? []

  // Check which users have a printer_profile row
  const { data: printerProfileRows } = allUserIds.length > 0
    ? await supabase.from('printer_profiles').select('user_id').in('user_id', allUserIds)
    : { data: [] }
  const hasProfile = new Set((printerProfileRows ?? []).map((p) => p.user_id))

  // Check which users have at least one machine
  const { data: machineRows } = allUserIds.length > 0
    ? await supabase.from('machines').select('maker_id').in('maker_id', allUserIds)
    : { data: [] }
  const hasMachines = new Set((machineRows ?? []).map((m) => m.maker_id))

  const clients      = users?.filter((u) => u.role === 'client' && u.onboarding_complete) ?? []
  const makers       = users?.filter((u) => u.role === 'printer_owner' && u.onboarding_complete) ?? []
  const admins       = users?.filter((u) => u.role === 'admin') ?? []
  const notOnboarded = users?.filter((u) => u.role !== 'admin' && !u.onboarding_complete) ?? []

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-heading">Users</h1>
          <p className="text-warm-500 text-sm mt-0.5">
            {users?.length ?? 0} total — {clients.length} customers · {makers.length} makers · {notOnboarded.length} not onboarded
          </p>
        </div>
      </div>

      {/* Create user form */}
      <CreateUserForm />

      {/* Not onboarded */}
      {notOnboarded.length > 0 && <UserTable title="Not Onboarded" users={notOnboarded} highlight />}

      {/* Clients */}
      <UserTable title="Customers" users={clients} />

      {/* Makers */}
      <UserTable title="Makers" users={makers} hasProfile={hasProfile} hasMachines={hasMachines} />

      {/* Admins */}
      {admins.length > 0 && <UserTable title="Admins" users={admins} />}
    </div>
  )
}

function Pill({ yes }: { yes: boolean }) {
  return yes
    ? <span className="text-emerald-600 font-medium">✓ Yes</span>
    : <span className="text-red-400 font-medium">✗ No</span>
}

function UserTable({ title, users, highlight, hasProfile, hasMachines }: {
  title: string
  highlight?: boolean
  hasProfile?: Set<string>
  hasMachines?: Set<string>
  users: { user_id: string; email: string; display_name: string | null; role: string; created_at: string; onboarding_complete: boolean | null }[]
}) {
  const showMakerCols = !!(hasProfile || hasMachines)
  const headers = ['Name', 'Email', 'Role', 'Onboarded', ...(showMakerCols ? ['Profile', 'Machines'] : []), 'Joined']

  return (
    <section>
      <h2 className={`text-lg font-semibold mb-3 ${highlight ? 'text-amber-700' : 'text-warm-900'}`}>
        {highlight && <span className="mr-1.5">⚠</span>}
        {title} <span className="text-warm-400 font-normal text-base">({users.length})</span>
      </h2>
      {users.length === 0 ? (
        <div className="card p-6 text-center text-sm text-warm-400">No {title.toLowerCase()} yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-warm-100">
            <thead className="bg-warm-50">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-warm-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-white">
              {users.map((u) => (
                <tr key={u.user_id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-ink-900">
                    {u.display_name ?? <span className="text-warm-400 italic">No name</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-warm-600">{u.email}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.role} /></td>
                  <td className="px-4 py-3 text-sm">
                    {u.onboarding_complete
                      ? <span className="text-emerald-600 font-medium">✓ Yes</span>
                      : <span className="text-warm-400">Pending</span>
                    }
                  </td>
                  {showMakerCols && (
                    <>
                      <td className="px-4 py-3 text-sm"><Pill yes={hasProfile?.has(u.user_id) ?? false} /></td>
                      <td className="px-4 py-3 text-sm"><Pill yes={hasMachines?.has(u.user_id) ?? false} /></td>
                    </>
                  )}
                  <td className="px-4 py-3 text-sm text-warm-400">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
