// PayPal Commerce Platform API helpers
// Docs: https://developer.paypal.com/docs/multiparty/

export const PLATFORM_FEE_PERCENT = 0.12

const SANDBOX_BASE = 'https://api-m.sandbox.paypal.com'
const LIVE_BASE    = 'https://api-m.paypal.com'

function baseUrl(): string {
  return process.env.PAYPAL_ENV === 'sandbox' ? SANDBOX_BASE : LIVE_BASE
}

// ─── Auth ──────────────────────────────────────────────────────────────────

/** Returns a short-lived OAuth2 access token for our platform account. */
export async function getPayPalToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID ?? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const secret   = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) throw new Error('PayPal credentials not configured')

  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  const data = await res.json() as { access_token?: string; error?: string }
  if (!res.ok || !data.access_token) {
    throw new Error(`PayPal auth failed: ${data.error ?? res.status}`)
  }
  return data.access_token
}

/**
 * Builds the PayPal-Auth-Assertion header so the platform can act on behalf
 * of a connected seller (required for platform-fee orders).
 */
export function buildAuthAssertion(sellerMerchantId: string): string {
  const clientId    = process.env.PAYPAL_CLIENT_ID ?? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ''
  const header      = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64')
  const payload     = Buffer.from(JSON.stringify({ iss: clientId, payer_id: sellerMerchantId })).toString('base64')
  return `${header}.${payload}.`
}

// ─── Partner referrals (maker onboarding) ───────────────────────────────────

export interface PartnerReferralResult {
  actionUrl: string
  referralToken: string
}

/**
 * Creates a PayPal Connected Path onboarding link for a maker.
 * Redirect the maker to `actionUrl` to connect their PayPal account.
 */
export async function createPartnerReferral(
  trackingId: string,   // our internal user_id
  returnUrl:  string,   // where PayPal redirects after onboarding
): Promise<PartnerReferralResult> {
  const token = await getPayPalToken()

  const body = {
    tracking_id: trackingId,
    partner_config_override: {
      return_url: returnUrl,
      return_url_description: 'Return to PrintMarketHub',
    },
    operations: [{
      operation: 'API_INTEGRATION',
      api_integration_preference: {
        rest_api_integration: {
          integration_method:  'PAYPAL',
          integration_type:    'THIRD_PARTY',
          third_party_details: { features: ['PAYMENT', 'REFUND'] },
        },
      },
    }],
    products: ['PPCP'],
    legal_consents: [{ type: 'SHARE_DATA_CONSENT', granted: true }],
  }

  const res = await fetch(`${baseUrl()}/v2/customer/partner-referrals`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify(body),
    cache:   'no-store',
  })

  const data = await res.json() as {
    links?: { href: string; rel: string }[]
    error?: string
    error_description?: string
  }

  if (!res.ok) {
    throw new Error(`Partner referral failed: ${data.error_description ?? data.error ?? res.status}`)
  }

  const actionUrl = data.links?.find((l) => l.rel === 'action_url')?.href ?? ''
  // Extract the referralToken from the action_url for tracking
  const referralToken = new URL(actionUrl).searchParams.get('referralToken') ?? ''

  return { actionUrl, referralToken }
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export interface CreateOrderParams {
  amountValue:       string   // e.g. "100.00"
  currency:          string   // e.g. "CHF"
  description:       string
  jobId:             string
  returnUrl:         string
  cancelUrl:         string
  makerMerchantId?:  string   // Connected maker's PayPal merchant ID (for platform fees)
}

export interface OrderResult {
  orderId:    string
  approveUrl: string
}

/**
 * Creates a PayPal Order.
 * - If `makerMerchantId` is provided and our account has PPCP partner capabilities,
 *   the order pays the maker directly minus our platform fee.
 * - Otherwise the order pays our platform account and we payout the maker manually.
 */
export async function createPayPalOrder(params: CreateOrderParams): Promise<OrderResult> {
  const { amountValue, currency, description, jobId, returnUrl, cancelUrl, makerMerchantId } = params
  const token       = await getPayPalToken()
  const platformFee = (parseFloat(amountValue) * PLATFORM_FEE_PERCENT).toFixed(2)

  const purchaseUnit: Record<string, unknown> = {
    reference_id: `JOB_${jobId}`,
    description,
    amount:       { currency_code: currency, value: amountValue },
  }

  // Only add payee + platform_fees if the maker has connected their PayPal
  if (makerMerchantId) {
    purchaseUnit.payee = { merchant_id: makerMerchantId }
    purchaseUnit.payment_instruction = {
      disbursement_mode: 'INSTANT',
      platform_fees:     [{
        amount: { currency_code: currency, value: platformFee },
      }],
    }
  }

  const orderBody = {
    intent: 'CAPTURE',
    purchase_units: [purchaseUnit],
    application_context: {
      brand_name:          'PrintMarketHub',
      shipping_preference: 'NO_SHIPPING',
      user_action:         'PAY_NOW',
      return_url:          returnUrl,
      cancel_url:          cancelUrl,
    },
  }

  const headers: Record<string, string> = {
    'Content-Type':   'application/json',
    'Authorization':  `Bearer ${token}`,
    'PayPal-Request-Id': `order-${jobId}-${Date.now()}`,
  }

  // If paying on behalf of the maker, add the auth-assertion header
  if (makerMerchantId) {
    headers['PayPal-Auth-Assertion'] = buildAuthAssertion(makerMerchantId)
  }

  const res = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method:  'POST',
    headers,
    body:    JSON.stringify(orderBody),
    cache:   'no-store',
  })

  const data = await res.json() as {
    id?:    string
    links?: { href: string; rel: string }[]
    name?:  string
    message?: string
    details?: unknown[]
  }

  if (!res.ok || !data.id) {
    const msg = data.message ?? data.name ?? String(res.status)
    console.error('PayPal createOrder error:', JSON.stringify(data, null, 2))
    throw new Error(`PayPal order creation failed: ${msg}`)
  }

  const approveUrl = data.links?.find((l) => l.rel === 'approve')?.href ?? ''
  return { orderId: data.id, approveUrl }
}

// ─── Capture ─────────────────────────────────────────────────────────────────

export interface CaptureResult {
  status:    string   // COMPLETED | PENDING | etc.
  payerId?:  string
}

/** Captures a PayPal order after the buyer approves it. */
export async function capturePayPalOrder(orderId: string, makerMerchantId?: string): Promise<CaptureResult> {
  const token = await getPayPalToken()

  const headers: Record<string, string> = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${token}`,
  }

  if (makerMerchantId) {
    headers['PayPal-Auth-Assertion'] = buildAuthAssertion(makerMerchantId)
  }

  const res = await fetch(`${baseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method:  'POST',
    headers,
    body:    '{}',
    cache:   'no-store',
  })

  const data = await res.json() as {
    status?: string
    payer?:  { payer_id?: string }
    name?:   string
    message?: string
    details?: unknown[]
  }

  if (!res.ok) {
    const msg = data.message ?? data.name ?? String(res.status)
    console.error('PayPal capture error:', JSON.stringify(data, null, 2))
    throw new Error(`PayPal capture failed: ${msg}`)
  }

  return {
    status:   data.status ?? 'UNKNOWN',
    payerId:  data.payer?.payer_id,
  }
}

// ─── Webhook verification ────────────────────────────────────────────────────

/** Verifies a PayPal webhook signature. */
export async function verifyWebhookSignature(params: {
  body:                  string
  transmissionId:        string
  transmissionTime:      string
  certUrl:               string
  authAlgo:              string
  transmissionSig:       string
  webhookId:             string
}): Promise<boolean> {
  try {
    const token = await getPayPalToken()
    const res = await fetch(`${baseUrl()}/v1/notifications/verify-webhook-signature`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        transmission_id:   params.transmissionId,
        transmission_time: params.transmissionTime,
        cert_url:          params.certUrl,
        auth_algo:         params.authAlgo,
        transmission_sig:  params.transmissionSig,
        webhook_id:        params.webhookId,
        webhook_event:     JSON.parse(params.body),
      }),
      cache: 'no-store',
    })
    const data = await res.json() as { verification_status?: string }
    return data.verification_status === 'SUCCESS'
  } catch {
    return false
  }
}
