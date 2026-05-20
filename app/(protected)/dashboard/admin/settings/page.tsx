import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Platform Settings — Admin' }

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: settings } = await supabase.from('platform_settings').select('*').order('key')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Platform Settings</h1>
        <p className="text-warm-500 text-sm mt-0.5">Global configuration values for the platform.</p>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-warm-100">
          <thead className="bg-warm-50">
            <tr>
              {['Key', 'Value', 'Description'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-warm-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-50 bg-white">
            {settings?.length === 0 && (
              <tr><td colSpan={3} className="px-5 py-8 text-sm text-warm-400 text-center">No settings configured.</td></tr>
            )}
            {settings?.map((s) => (
              <tr key={s.id} className="hover:bg-warm-50 transition-colors">
                <td className="px-5 py-3 text-sm font-mono text-ink-900">{s.key}</td>
                <td className="px-5 py-3 text-sm text-warm-700">{JSON.stringify(s.value)}</td>
                <td className="px-5 py-3 text-sm text-warm-500">{s.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
