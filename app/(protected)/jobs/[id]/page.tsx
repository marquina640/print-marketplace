import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { QuoteForm } from '@/components/quotes/quote-form'
import { StatusBadge, MaterialBadge, CertificationBadge, JobTypeBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, formatFileSize } from '@/lib/utils'
import { AcceptQuoteButton } from './accept-quote-button'
import { ReviewForm } from './review-form'
import { PaymentButton } from '@/components/payments/payment-button'
import { MarkShippedButton } from './mark-shipped-button'
import { ConfirmReceiptButton } from './confirm-receipt-button'
import { MarkPayoutButton } from './mark-payout-button'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ payment?: string }>
}

export default async function JobDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { payment } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()

  const cookieStore = await cookies()
  const previewAs     = profile?.role === 'admin' ? cookieStore.get('admin_preview_as')?.value : undefined
  const previewUserId = profile?.role === 'admin' ? cookieStore.get('admin_preview_user_id')?.value : undefined
  const viewMode      = profile?.role !== 'admin' ? cookieStore.get('view_mode')?.value : undefined
  const viewModeRole  = viewMode === 'maker' ? 'printer_owner' : viewMode === 'client' ? 'client' : null
  const effectiveRole = previewAs ?? viewModeRole ?? profile?.role
  const effectiveUserId = previewUserId ?? user.id

  const { data: job } = await supabase.from('jobs').select('*').eq('id', id).single()
  if (!job) notFound()

  const isOwner   = job.client_id === effectiveUserId
  const isPrinter = effectiveRole === 'printer_owner'
  const isAdmin   = profile?.role === 'admin'

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, profiles:printer_id(display_name, email)')
    .eq('job_id', id)
    .order('created_at', { ascending: false })

  // Fetch cert levels separately (no FK from quotes → printer_profiles)
  const printerIds = [...new Set(quotes?.map((q) => q.printer_id) ?? [])]
  const { data: printerProfiles } = printerIds.length > 0
    ? await supabase.from('printer_profiles').select('user_id, certification_level').in('user_id', printerIds)
    : { data: [] }
  const certByPrinter = Object.fromEntries(
    (printerProfiles ?? []).map((p) => [p.user_id, p.certification_level ?? 0])
  )

  const myQuote         = isPrinter ? (quotes?.find((q) => q.printer_id === effectiveUserId) ?? null) : null
  const acceptedQuote   = quotes?.find((q) => q.status === 'accepted') ?? null
  const acceptedPrinter = acceptedQuote?.printer_id

  const visibleQuotes = isOwner || isAdmin
    ? quotes ?? []
    : isPrinter
    ? (myQuote ? [myQuote] : [])
    : []

  const canSeeFiles = isOwner || isAdmin || (isPrinter && user.id === acceptedPrinter)
  const { data: files } = canSeeFiles
    ? await supabase.from('job_files').select('*').eq('job_id', id)
    : { data: [] }

  const now = new Date()
  function isExpired(q: { status: string; expires_at?: string | null }) {
    if (q.status !== 'pending') return false
    return !!(q as any).expires_at && new Date((q as any).expires_at) < now
  }
  function expiryLabel(q: { expires_at?: string | null }): string | null {
    const exp = (q as any).expires_at
    if (!exp) return null
    const diff = new Date(exp).getTime() - now.getTime()
    if (diff <= 0) return 'Expired'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    if (h >= 24) return `Valid for ${Math.floor(h / 24)}d ${h % 24}h`
    if (h > 0) return `Expires in ${h}h ${m}m`
    return `Expires in ${m}m`
  }

  const canSubmitQuote    = isPrinter && !isOwner && job.status === 'open'
  const canAcceptQuote    = isOwner && job.status === 'open'
  const canMarkShipped    = isPrinter && effectiveUserId === acceptedPrinter && (job as any).status === 'paid'
  const canConfirmReceipt = isOwner && (job as any).status === 'shipped'
  const needsPayout       = isAdmin && (job as any).status === 'delivered' && !(job as any).payout_at

  // Reviews show after delivered or completed
  const isCompleted   = job.status === 'completed' || (job as any).status === 'delivered'
  const isParticipant = isOwner || (isPrinter && user.id === acceptedPrinter)

  const { data: myReview } = isCompleted && isParticipant
    ? await supabase.from('reviews').select('*').eq('job_id', id).eq('reviewer_id', user.id).single()
    : { data: null }

  const { data: publicReviews } = isCompleted
    ? await supabase.from('reviews').select('*, profiles:reviewer_id(display_name,email)')
        .eq('job_id', id).eq('is_public', true)
    : { data: [] }

  const revieweeId    = isOwner ? (acceptedPrinter ?? '') : job.client_id
  const revieweeLabel = isOwner
    ? ((acceptedQuote?.profiles as { display_name: string | null; email: string } | null)?.display_name ?? 'the printer')
    : 'the client'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href={isOwner ? '/dashboard/client' : '/jobs'}
        className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-900">
        ← Back
      </Link>

      {payment === 'success' && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-semibold text-emerald-900">Payment received!</p>
            <p className="text-sm text-emerald-700">Your funds are held in escrow. The maker will now prepare and ship your order.</p>
          </div>
        </div>
      )}
      {payment === 'cancelled' && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
          <p className="text-sm font-medium text-amber-800">Payment was cancelled. You can try again whenever you're ready.</p>
        </div>
      )}

      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-warm-900 leading-tight">{job.title}</h1>
          <StatusBadge status={job.status} />
        </div>
        <p className="text-warm-600 mb-6 whitespace-pre-wrap leading-relaxed">{job.description}</p>

        <div className="flex flex-wrap gap-2 mb-5">
          <MaterialBadge material={job.material} />
          {(job as any).job_type && <JobTypeBadge type={(job as any).job_type} />}
          {job.color && (
            <span className="rounded-full border border-warm-200 px-2.5 py-0.5 text-xs text-warm-600">{job.color}</span>
          )}
          {job.shipping_required && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700">Shipping OK</span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <Stat label="Quantity"  value={job.quantity.toString()} />
          <Stat label="Budget"    value={formatCurrency(job.budget)} />
          <Stat label="Deadline"  value={formatDate(job.deadline)} />
          <Stat label="Location"  value={job.location ?? '—'} />
        </div>
        <p className="text-xs text-warm-400">Posted {formatDate(job.created_at)}</p>
      </div>

      {/* File warning for makers */}
      {isPrinter && canSeeFiles && files && files.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
          <svg className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Customer files — handle with care</p>
            <p className="text-xs text-amber-700 mt-0.5">
              These files are shared with you to fulfil this request only. Do not share, resell, or reuse them for any other purpose.
            </p>
          </div>
        </div>
      )}

      {/* Files */}
      {canSeeFiles && files && files.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-warm-900 mb-4">Attached Files</h2>
          <ul className="space-y-2">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-xl bg-warm-50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="h-4 w-4 text-ink-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-warm-700 truncate">{f.file_name}</span>
                  {f.file_size && <span className="text-xs text-warm-400 flex-shrink-0">{formatFileSize(f.file_size)}</span>}
                </div>
                <a href={f.file_url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-ink-600 hover:text-ink-700 font-medium ml-2">Download</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quotes + Submit form */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <h2 className="font-semibold text-warm-900">
            {isOwner || isAdmin ? `Quotes (${visibleQuotes.length})` : 'Your Quote'}
          </h2>

          {visibleQuotes.length === 0 ? (
            <div className="card p-8 text-center text-sm text-warm-400">
              {isPrinter ? 'You haven\'t submitted a quote yet.' : 'No quotes received yet.'}
            </div>
          ) : (
            visibleQuotes.map((q) => {
              const printer   = q.profiles as { display_name: string | null; email: string } | null
              const certLevel = certByPrinter[q.printer_id] ?? 0
              return (
                <div key={q.id} className="card p-5">
                  {/* Quote image */}
                  {q.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={q.image_url} alt="Model preview"
                      className="w-full h-48 object-cover rounded-xl mb-4" />
                  )}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-bold text-warm-900 text-lg">{formatCurrency(q.price)}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Link href={`/makers/${q.printer_id}`} className="text-sm text-ink-600 hover:text-ink-800 font-medium hover:underline">
                          {printer?.display_name ?? printer?.email}
                        </Link>
                        <CertificationBadge level={certLevel} size="sm" />
                        <span className="text-xs text-warm-400">{q.lead_time_days}d lead</span>
                      </div>
                    </div>
                    <StatusBadge status={isExpired(q) ? 'expired' : q.status} />
                  </div>
                  {q.message && (
                    <p className="text-sm text-warm-600 mb-2">{q.message}</p>
                  )}
                  {q.price_justification && (
                    <div className="rounded-lg bg-warm-50 border border-warm-200 px-3 py-2.5 mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-warm-400 mb-1">Price breakdown</p>
                      <p className="text-sm text-warm-700 leading-relaxed">{q.price_justification}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-warm-400">{formatDate(q.created_at)}</p>
                    {q.status === 'pending' && (
                      <p className={`text-xs font-medium ${isExpired(q) ? 'text-red-500' : 'text-warm-400'}`}>
                        · {expiryLabel(q)}
                      </p>
                    )}
                  </div>

                  {canAcceptQuote && q.status === 'pending' && !isExpired(q) && (
                    <div className="mt-3 pt-3 border-t border-warm-100">
                      <AcceptQuoteButton
                        jobId={job.id}
                        quoteId={q.id}
                        printerId={q.printer_id}
                        printerEmail={(q.profiles as { email: string } | null)?.email}
                        priceAmount={q.price}
                        jobTitle={job.title}
                      />
                    </div>
                  )}
                  {q.status === 'accepted' && (isOwner || isAdmin || (isPrinter && q.printer_id === effectiveUserId)) && (
                    <div className="mt-3 pt-3 border-t border-warm-100 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/messages/${job.id}`}>
                          <Button variant="outline" size="sm">Open Messages</Button>
                        </Link>
                      </div>

                      {/* Step 1: Client pays */}
                      {isOwner && !(job as any).paid_at && (
                        <div className="rounded-xl border border-gold-300 bg-gold-50 p-4">
                          <p className="text-sm font-semibold text-ink-900 mb-1">Confirm your order</p>
                          <p className="text-xs text-warm-600 mb-3">Pay now to hold funds in escrow. The maker gets paid once you confirm delivery.</p>
                          <PaymentButton jobId={job.id} amount={q.price} />
                        </div>
                      )}

                      {/* Step 2: Paid — maker ships */}
                      {(job as any).status === 'paid' && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
                          <p className="text-sm font-semibold text-blue-900">Payment received — waiting for shipment</p>
                          {canMarkShipped && (
                            <>
                              <p className="text-xs text-blue-700">Ship the order and mark it as shipped so the client knows it's on the way.</p>
                              <MarkShippedButton jobId={job.id} />
                            </>
                          )}
                          {isOwner && <p className="text-xs text-blue-700">The maker will mark your order as shipped once it's dispatched.</p>}
                        </div>
                      )}

                      {/* Step 3: Shipped — client confirms receipt */}
                      {(job as any).status === 'shipped' && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                          <p className="text-sm font-semibold text-amber-900">
                            {(job as any).in_person_delivery ? 'Order handed over in person' : 'Order shipped'} — awaiting confirmation
                          </p>
                          {/* Shipping details */}
                          {!(job as any).in_person_delivery && ((job as any).shipping_carrier || (job as any).tracking_number) && (
                            <div className="rounded-lg bg-white border border-amber-100 px-3 py-2 text-xs text-warm-700 space-y-1">
                              {(job as any).shipping_carrier && (
                                <p><span className="font-medium">Carrier:</span> {(job as any).shipping_carrier}</p>
                              )}
                              {(job as any).tracking_number && (
                                <p><span className="font-medium">Tracking:</span> <span className="font-mono">{(job as any).tracking_number}</span></p>
                              )}
                              {(job as any).shipped_date && (
                                <p><span className="font-medium">Shipped on:</span> {new Date((job as any).shipped_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                              )}
                            </div>
                          )}
                          {canConfirmReceipt && (
                            <>
                              <p className="text-xs text-amber-700">Once you've received your order, confirm receipt to release payment to the maker.</p>
                              <ConfirmReceiptButton jobId={job.id} />
                            </>
                          )}
                          {isPrinter && <p className="text-xs text-amber-700">Waiting for the client to confirm they received the order.</p>}
                        </div>
                      )}

                      {/* Step 4: Delivered — admin pays out */}
                      {(job as any).status === 'delivered' && !(job as any).payout_at && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                          <p className="text-sm font-semibold text-emerald-900">Delivered — payout pending</p>
                          {isAdmin && (
                            <>
                              <p className="text-xs text-emerald-700">
                                Client confirmed receipt. Send {formatCurrency(q.price)} to the maker, then mark payout as sent.
                              </p>
                              <MarkPayoutButton
                                jobId={job.id}
                                makerName={(q.profiles as { display_name: string | null; email: string } | null)?.display_name ?? 'maker'}
                                amount={q.price}
                              />
                            </>
                          )}
                          {!isAdmin && <p className="text-xs text-emerald-700">Receipt confirmed. Payment is being processed by the platform.</p>}
                        </div>
                      )}

                      {/* Payout complete */}
                      {(job as any).payout_at && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 font-medium">
                          ✓ Payout sent to maker on {formatDate((job as any).payout_at)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {canSubmitQuote && (
          <div className="lg:col-span-2">
            <div className="card p-5">
              <QuoteForm jobId={job.id} printerId={effectiveUserId} existingQuote={myQuote} />
            </div>
          </div>
        )}
      </div>

      {/* Reviews section */}
      {isCompleted && (
        <div className="space-y-4">
          <h2 className="font-semibold text-warm-900">Reviews</h2>

          {/* Public reviews */}
          {publicReviews && publicReviews.length > 0 && (
            <div className="space-y-3">
              {publicReviews.map((r) => {
                const reviewer = r.profiles as { display_name: string | null; email: string } | null
                return (
                  <div key={r.id} className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-warm-900">
                        {reviewer?.display_name ?? reviewer?.email}
                      </p>
                      <div className="flex text-gold-500">
                        {'★'.repeat(r.rating)}
                        <span className="text-warm-200">{'★'.repeat(5 - r.rating)}</span>
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-warm-600">{r.comment}</p>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Leave review form */}
          {isParticipant && revieweeId && (
            <div className="card p-5">
              <ReviewForm
                jobId={job.id}
                revieweeId={revieweeId}
                revieweeLabel={revieweeLabel}
                existingReview={myReview ?? null}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-warm-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-warm-900">{value}</p>
    </div>
  )
}
