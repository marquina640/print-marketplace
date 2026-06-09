import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient }      from '@/lib/supabase/admin'
import { verifyWebhookSignature } from '@/lib/paypal'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  const body      = await req.text()

  // Verify signature if webhook ID is configured
  if (webhookId && webhookId !== 'REPLACE_WITH_WEBHOOK_ID') {
    const valid = await verifyWebhookSignature({
      body,
      webhookId,
      transmissionId:   req.headers.get('paypal-transmission-id')   ?? '',
      transmissionTime: req.headers.get('paypal-transmission-time') ?? '',
      certUrl:          req.headers.get('paypal-cert-url')          ?? '',
      authAlgo:         req.headers.get('paypal-auth-algo')         ?? '',
      transmissionSig:  req.headers.get('paypal-transmission-sig')  ?? '',
    })
    if (!valid) {
      console.error('PayPal webhook signature invalid')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  }

  let event: { event_type?: string; resource?: Record<string, unknown> }
  try { event = JSON.parse(body) } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = createAdminClient()

  switch (event.event_type) {
    case 'CHECKOUT.ORDER.APPROVED': {
      // Fallback: mark payment as pending if we somehow missed the capture redirect
      const orderId = (event.resource?.id as string | undefined)
      if (orderId) {
        const { data: job } = await admin
          .from('jobs')
          .select('id, status')
          .eq('paypal_order_id' as any, orderId)
          .single()
        // Only update if still in accepted state (not yet captured via redirect)
        if (job && (job as any).status === 'accepted') {
          console.log(`Webhook: Order ${orderId} approved for job ${job.id} — capture pending`)
        }
      }
      break
    }

    case 'PAYMENT.CAPTURE.COMPLETED': {
      // Backup handler: mark job paid if the redirect capture failed
      const orderId = (event.resource?.supplementary_data as any)?.related_ids?.order_id
        ?? (event.resource as any)?.id
      if (orderId) {
        await admin
          .from('jobs')
          .update({ status: 'paid', paid_at: new Date().toISOString() } as any)
          .eq('paypal_order_id' as any, orderId)
          .eq('status', 'accepted') // only if not already updated
      }
      break
    }

    case 'PAYMENT.CAPTURE.DENIED':
    case 'PAYMENT.CAPTURE.REVERSED': {
      const orderId = (event.resource as any)?.id
      if (orderId) {
        await admin
          .from('jobs')
          .update({ status: 'accepted' } as any)
          .eq('paypal_order_id' as any, orderId)
          .eq('status', 'paid')
        console.log(`Webhook: Payment reversed for order ${orderId}`)
      }
      break
    }

    default:
      // Ignore other event types
      break
  }

  return NextResponse.json({ ok: true })
}
