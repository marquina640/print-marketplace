import Stripe from 'stripe'

export const PLATFORM_FEE_PERCENT = 0.12
export const REFERRAL_FEE_PERCENT = 0.08       // maker pays 8% on commission jobs
export const REFERRAL_COMMISSION_PERCENT = 0.05 // influencer earns 5% of job value

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export function platformFee(amount: number): number {
  return Math.round(amount * PLATFORM_FEE_PERCENT)
}

const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND', 'BIF', 'CLP', 'GNF', 'MGA', 'PYG', 'RWF', 'UGX', 'XAF', 'XOF'])

/** Amount in smallest currency unit (e.g. cents for USD/CHF, whole units for JPY) */
export function toCents(amount: number, currency = 'CHF'): number {
  if (ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())) return Math.round(amount)
  return Math.round(amount * 100)
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
 * country should be an ISO 3166-1 alpha-2 code (e.g. 'CH', 'DE', 'EE').
 * Defaults to the platform country (CH) if not provided.
 */
export async function createConnectedAccount(email: string, country = 'CH'): Promise<string> {
  const account = await stripe.accounts.create({
    type:  'express',
    email,
    country,
    capabilities: {
      transfers: { requested: true },
    },
  })
  return account.id
}

/**
 * Look up an existing connected account by email (paginates all accounts).
 * Returns the most recently created account ID if found, null otherwise.
 */
export async function findConnectedAccountByEmail(email: string): Promise<string | null> {
  let startingAfter: string | undefined
  while (true) {
    const page = await stripe.accounts.list({ limit: 100, starting_after: startingAfter })
    const match = page.data.find((a) => a.email === email)
    if (match) return match.id
    if (!page.has_more) break
    startingAfter = page.data[page.data.length - 1].id
  }
  return null
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
  amount:             number,
  connectedAccountId: string,
  jobId:              string,
  jobTitle:           string,
  feePercent:         number = PLATFORM_FEE_PERCENT,
  currency:           string = 'CHF',
): Promise<string> {
  const makerShare = Math.round(toCents(amount, currency) * (1 - feePercent))
  const transfer = await stripe.transfers.create({
    amount:      makerShare,
    currency:    currency.toLowerCase(),
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
