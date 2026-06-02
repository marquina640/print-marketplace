import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CertificationBadge, JobTypeBadge, MaterialBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCertificationLevel, MANUFACTURING_PROCESSES } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { InviteToJobButton } from '@/components/makers/invite-to-job-button'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MakerProfilePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: printerProfile },
    { data: machines },
    { data: portfolio },
    { data: reviews },
    { data: baseProfile },
  ] = await Promise.all([
    supabase.from('printer_profiles').select('*').eq('user_id', id).single(),
    supabase.from('machines').select('*').eq('maker_id', id).eq('is_active', true).order('created_at'),
    supabase.from('portfolio_items').select('*').eq('maker_id', id)
      .order('is_featured', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('reviews').select('*, profiles:reviewer_id(display_name, email)')
      .eq('reviewee_id', id).eq('is_public', true).order('created_at', { ascending: false }),
    supabase.from('profiles').select('display_name, email, created_at').eq('user_id', id).single(),
  ])

  if (!printerProfile) notFound()

  const certLevel = printerProfile.certification_level ?? 0
  const cert = getCertificationLevel(certLevel)
  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const featuredPortfolio = portfolio?.filter((p) => p.is_featured) ?? []
  const otherPortfolio    = portfolio?.filter((p) => !p.is_featured) ?? []
  const displayPortfolio  = [...featuredPortfolio, ...otherPortfolio]

  const isOwnProfile = user?.id === id
  const isGuest = !user

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-black text-ink-950 tracking-tight">
                {printerProfile.display_name}
              </h1>
              <CertificationBadge level={certLevel} size="md" />
            </div>

            <p className="text-warm-500 text-sm">
              {printerProfile.city}
              {printerProfile.service_radius_km && ` · ${printerProfile.service_radius_km} km radius`}
            </p>

            {avgRating && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-gold-500 font-bold">{avgRating}</span>
                <div className="flex text-gold-400 text-sm">
                  {'★'.repeat(Math.round(parseFloat(avgRating)))}
                  <span className="text-warm-200">{'★'.repeat(5 - Math.round(parseFloat(avgRating)))}</span>
                </div>
                <span className="text-xs text-warm-400">({reviews?.length} review{reviews?.length !== 1 ? 's' : ''})</span>
              </div>
            )}

            {printerProfile.description && (
              <p className="mt-4 text-warm-600 text-sm leading-relaxed max-w-lg">
                {printerProfile.description}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 flex-shrink-0">
            {isGuest && (
              <Link href="/signup">
                <Button variant="gold" className="w-full sm:w-auto">Sign up to Request a Quote</Button>
              </Link>
            )}
            {!isGuest && !isOwnProfile && (
              <>
                <Link href={`/jobs/new?maker=${id}`}>
                  <Button variant="gold" className="w-full sm:w-auto">Post a new request</Button>
                </Link>
                <InviteToJobButton
                  makerId={id}
                  makerName={printerProfile.display_name ?? 'this maker'}
                />
              </>
            )}
            {isOwnProfile && (
              <Link href="/profile/setup">
                <Button variant="outline" size="sm">Edit Profile</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-warm-100 flex flex-wrap gap-3">
          {printerProfile.pickup        && <ServiceChip label="Pickup"          icon="📦" />}
          {printerProfile.local_delivery && <ServiceChip label="Local Delivery" icon="🚗" />}
          {printerProfile.shipping       && <ServiceChip label="Ships"          icon="✈️" />}
          {printerProfile.design_services && <ServiceChip label="Design Help"   icon="✏️" />}
        </div>
      </div>

      {/* Certification */}
      <div className="rounded-2xl border-2 border-warm-200 bg-white overflow-hidden">
        <div className="px-6 py-4 bg-warm-50 border-b border-warm-200">
          <p className="text-xs font-bold uppercase tracking-widest text-warm-400">Certification</p>
        </div>
        <div className="px-6 py-5 flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="h-14 w-14 rounded-2xl bg-ink-900 flex items-center justify-center text-2xl">
              {cert.icon}
            </div>
          </div>
          <div>
            <p className="font-bold text-ink-900 text-lg">{cert.name}</p>
            <p className="text-sm text-warm-500 mt-1 max-w-md">{cert.description}</p>
            <div className="mt-3 flex gap-2">
              {[0,1,2,3].map((l) => (
                <div key={l} className={`h-2 flex-1 rounded-full ${l <= certLevel ? 'bg-ink-800' : 'bg-warm-200'}`} />
              ))}
            </div>
            <p className="text-xs text-warm-400 mt-1">Level {certLevel} of 3</p>
          </div>
        </div>
      </div>

      {/* Machines */}
      {machines && machines.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-ink-900 mb-4">Equipment</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {machines.map((m) => (
              <div key={m.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink-900">{m.brand} {m.model}</p>
                    <p className="text-xs text-warm-400 mt-0.5">
                      {MANUFACTURING_PROCESSES.find((p) => p.value === m.process)?.label ?? m.process}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-warm-500">
                  {m.build_volume_x && m.build_volume_y && m.build_volume_z && (
                    <span><span className="font-medium text-warm-700">Build</span> {m.build_volume_x}×{m.build_volume_y}×{m.build_volume_z} mm</span>
                  )}
                  {m.nozzle_diameter && (
                    <span><span className="font-medium text-warm-700">Nozzle</span> ⌀{m.nozzle_diameter} mm</span>
                  )}
                  {m.tolerance_mm && (
                    <span><span className="font-medium text-warm-700">Tolerance</span> ±{m.tolerance_mm} mm</span>
                  )}
                  {m.min_layer_height && m.max_layer_height && (
                    <span><span className="font-medium text-warm-700">Layer</span> {m.min_layer_height}–{m.max_layer_height} mm</span>
                  )}
                </div>
                {m.notes && <p className="mt-2 text-xs text-warm-400 italic">{m.notes}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Capabilities */}
      <section>
        <h2 className="text-lg font-bold text-ink-900 mb-4">Capabilities</h2>
        <div className="card p-5 space-y-4">
          {printerProfile.materials?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-warm-400 mb-2">Materials</p>
              <div className="flex flex-wrap gap-1.5">
                {printerProfile.materials.map((m: string) => <MaterialBadge key={m} material={m} />)}
              </div>
            </div>
          )}
          {printerProfile.colors?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-warm-400 mb-2">Colors</p>
              <div className="flex flex-wrap gap-1.5">
                {printerProfile.colors.map((c: string) => (
                  <span key={c} className="rounded-full border border-warm-200 bg-white px-2.5 py-0.5 text-xs text-warm-600">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Portfolio */}
      {displayPortfolio.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-ink-900 mb-4">Portfolio</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayPortfolio.map((item) => (
              <div key={item.id} className="card overflow-hidden group">
                <div className="relative">
                  <img src={item.image_url} alt={item.title}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                  {item.is_featured && (
                    <span className="absolute top-2 left-2 rounded-full bg-gold-500 text-white px-2 py-0.5 text-xs font-bold">★</span>
                  )}
                  <div className="absolute bottom-2 right-2">
                    <JobTypeBadge type={item.job_type} />
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-ink-900 text-sm">{item.title}</p>
                  {item.description && <p className="text-xs text-warm-500 mt-0.5 line-clamp-2">{item.description}</p>}
                  {item.material && <p className="text-xs text-warm-400 mt-1">{item.material}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-ink-900 mb-4">
            Reviews <span className="text-warm-400 font-normal text-base">({reviews.length})</span>
          </h2>
          <div className="space-y-3">
            {reviews.map((r) => {
              const reviewer = r.profiles as { display_name: string | null; email: string } | null
              return (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-ink-900">
                      {reviewer?.display_name ?? reviewer?.email ?? 'Anonymous'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div className="flex text-gold-400 text-sm">
                        {'★'.repeat(r.rating)}
                        <span className="text-warm-200">{'★'.repeat(5 - r.rating)}</span>
                      </div>
                      <span className="text-xs text-warm-400">{formatDate(r.created_at)}</span>
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-warm-600">{r.comment}</p>}
                </div>
              )
            })}
          </div>
        </section>
      )}

      <p className="text-xs text-warm-400 text-center pb-4">
        Member since {formatDate(baseProfile?.created_at ?? '')}
      </p>
    </div>
  )
}

function ServiceChip({ label, icon }: { label: string; icon: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-warm-200 bg-warm-50 px-3 py-1 text-xs font-medium text-warm-700">
      {icon} {label}
    </span>
  )
}
