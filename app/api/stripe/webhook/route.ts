import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { transferToMaker, PLATFORM_FEE_PERCENT, REFERRAL_FEE_PERCENT } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY
  const webhookSecret        = process.env.STRIPE_WEBHOOK_SECRET
  const webhookSecretConnect = process.env.STRIPE_WEBHOOK_SECRET_CONNECT

  if (!secret || (!webhookSecret && !webhookSecretConnect)) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = new Stripe(secret)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  // Try the connect secret first (account.updated), then the account secret (checkout events)
  let event: Stripe.Event | null = null
  for (const s of [webhookSecretConnect, webhookSecret]) {
    if (!s) continue
    try {
      event = stripe.webhooks.constructEvent(body, sig, s)
      break
    } catch {
      // try next secret
    }
  }

  if (!event) {
    console.error('Webhook signature error: no matching secret')
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  // When Stripe approves or restricts a connected account, update onboarding status
  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    const complete = account.details_submitted && (account.charges_enabled || account.payouts_enabled)
    const admin = createAdminClient()
    await admin
      .from('printer_profiles')
      .update({ stripe_onboarding_complete: complete } as any)
      .eq('stripe_account_id', account.id)

    // If account just became complete, release any pending payouts for this maker
    if (complete) {
      const { data: pp } = await admin
        .from('printer_profiles')
        .select('user_id, fee_waiver_until, referral_commission_until, referral_free_jobs_remaining')
        .eq('stripe_account_id', account.id)
        .single()

      if (pp) {
        // Find delivered jobs with no payout yet where this maker is the quote winner
        const { data: pendingQuotes } = await admin
          .from('quotes')
          .select('job_id, price, currency')
          .eq('printer_id', (pp as any).user_id)
          .eq('status', 'accepted')

        if (pendingQuotes?.length) {
          const jobIds = pendingQuotes.map((q: any) => q.job_id)
          const { data: deliveredJobs } = await admin
            .from('jobs')
            .select('id, title')
            .in('id', jobIds)
            .eq('status', 'delivered')
            .is('payout_at', null)

          for (const job of deliveredJobs ?? []) {
            const quote = pendingQuotes.find((q: any) => q.job_id === (job as any).id)
            if (!quote?.price) continue

            const feeWaiverUntil   = (pp as any).fee_waiver_until   as string | null
            const commissionUntil  = (pp as any).referral_commission_until as string | null
            const freeJobsLeft     = (pp as any).referral_free_jobs_remaining as number | null
            let effectiveFee = PLATFORM_FEE_PERCENT
            if (feeWaiverUntil && new Date(feeWaiverUntil) > new Date()) effectiveFee = 0
            else if (commissionUntil && new Date(commissionUntil) > new Date()) effectiveFee = REFERRAL_FEE_PERCENT
            else if (freeJobsLeft != null && freeJobsLeft > 0) effectiveFee = REFERRAL_FEE_PERCENT

            const currency = (quote as any).currency ?? 'CHF'
            try {
              await transferToMaker(quote.price, account.id, (job as any).id, (job as any).title, effectiveFee, currency)
              const makerShare = (quote.price * (1 - effectiveFee)).toFixed(2)
              await admin.from('jobs').update({
                payout_at: new Date().toISOString(),
                status:    'completed',
              } as any).eq('id', (job as any).id)
              await admin.from('notifications').insert({
                user_id: (pp as any).user_id,
                type:    'payout_sent',
                title:   'Payment sent!',
                body:    `${currency} ${makerShare} for "${(job as any).title}" has been sent to your bank account.`,
                link:    `/jobs/${(job as any).id}`,
              })
            } catch (err) {
              console.error('Deferred payout failed for job', (job as any).id, err)
            }
          }
        }
      }
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const jobId = session.metadata?.jobId
    if (!jobId) {
      console.error('Webhook: no jobId in session metadata')
      return NextResponse.json({ ok: true })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('jobs')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_session_id: session.id,
      } as any)
      .eq('id', jobId)

    if (error) {
      console.error('Webhook DB update error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Job ${jobId} marked as paid`)
  }

  return NextResponse.json({ ok: true })
}
