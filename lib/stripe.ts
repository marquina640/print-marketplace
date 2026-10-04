import Stripe from 'stripe'

export const PLATFORM_FEE_PERCENT = 0.12

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export function platformFee(amount: number): number {
  return Math.round(amount * PLATFORM_FEE_PERCENT)
}

/** Amount in smallest currency unit (rappen for CHF) */
export function toCents(chf: number): number {
  return Math.round(chf * 100)
}

/**
 * Create a Stripe Express onboarding link for a maker.
 * The maker completes identity/bank details on Stripe's hosted page.
 */
export async function createConnectOnboardingLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string,
): Promise<string> {
  const link = await stripe.accountLinks.create({
    account:     accountId,
    refresh_url: refreshUrl,
    return_url:  returnUrl,
    type:        'account_onboarding',
  })
  return link.url
}

/**
 * Create a new Stripe Express connected account for a maker.
 */
export async function createConnectedAccount(email: string): Promise<string> {
  const account = await stripe.accounts.create({
    type:  'express',
    email,
    capabilities: {
      transfers: { requested: true },
    },
  })
  return account.id
}

/**
 * Look up an existing connected account by email.
 * Returns the account ID if found, null otherwise.
 */
export async function findConnectedAccountByEmail(email: string): Promise<string | null> {
  const accounts = await stripe.accounts.list({ limit: 10 })
  const match = accounts.data.find((a) => a.email === email)
  return match?.id ?? null
}

/**
 * Create a PaymentIntent for the full job amount.
 * We use separate charges + transfers, so no application_fee_amount here.
 */
export async function createPaymentIntent(
  amountChf: number,
  jobId: string,
  jobTitle: string,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const pi = await stripe.paymentIntents.create({
    amount:   toCents(amountChf),
    currency: 'chf',
    metadata: { jobId, jobTitle },
    automatic_payment_methods: { enabled: true },
  })
  return { clientSecret: pi.client_secret!, paymentIntentId: pi.id }
}

/**
 * Transfer maker's share to their connected Stripe account after delivery.
 * Called when customer confirms receipt.
 */
export async function transferToMaker(
  amountChf:        number,
  connectedAccountId: string,
  jobId:            string,
  jobTitle:         string,
): Promise<string> {
  const makerShare = Math.round(toCents(amountChf) * (1 - PLATFORM_FEE_PERCENT))
  const transfer = await stripe.transfers.create({
    amount:      makerShare,
    currency:    'chf',
    destination: connectedAccountId,
    metadata:    { jobId, jobTitle },
  })
  return transfer.id
}

/**
 * Retrieve a connected account's onboarding status.
 */
export async function getConnectedAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId)
  return {
    chargesEnabled:  account.charges_enabled,
    payoutsEnabled:  account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  }
}
