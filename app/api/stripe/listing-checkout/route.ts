import { NextRequest, NextResponse } from 'next/server'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, toCents, platformFee } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { listingId, shippingMethod, deliveryAddress, selectedVariation } = await req.json()
    if (!listingId || !shippingMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin  = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Fetch listing
    const { data: listing } = await admin.from('listings').select('*').eq('id', listingId).single()
    if (!listing || listing.status !== 'active') {
      return NextResponse.json({ error: 'Listing not available' }, { status: 404 })
    }
    if (listing.maker_id === user.id) {
      return NextResponse.json({ error: 'Cannot purchase your own listing' }, { status: 400 })
    }

    // Validate delivery method
    const validMethods: Record<string, boolean> = {
      shipping:       listing.shipping_available,
      pickup:         listing.pickup_available,
      local_delivery: listing.local_delivery_available,
    }
    if (!validMethods[shippingMethod]) {
      return NextResponse.json({ error: 'Invalid delivery method' }, { status: 400 })
    }

    // Fetch maker Stripe account
    const { data: makerProfile } = await admin
      .from('printer_profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('user_id', listing.maker_id)
      .single()

    if (!makerProfile?.stripe_account_id) {
      return NextResponse.json({ error: 'Maker has not completed Stripe setup' }, { status: 400 })
    }

    // If the flag is stale (account connected but flag not set), verify live with Stripe
    if (!makerProfile.stripe_onboarding_complete) {
      try {
        const account = await stripe.accounts.retrieve(makerProfile.stripe_account_id)
        if (account.details_submitted && account.charges_enabled) {
          await admin.from('printer_profiles')
            .update({ stripe_onboarding_complete: true } as any)
            .eq('user_id', listing.maker_id)
        } else {
          return NextResponse.json({ error: 'Maker has not completed Stripe setup' }, { status: 400 })
        }
      } catch (stripeErr) {
        console.error('listing-checkout: stripe account retrieve failed:', makerProfile.stripe_account_id, stripeErr instanceof Error ? stripeErr.message : String(stripeErr))
        return NextResponse.json({ error: 'Maker has not completed Stripe setup' }, { status: 400 })
      }
    }

    const shippingFee = shippingMethod === 'shipping' ? (listing.shipping_price ?? 0) : 0
    const totalAmount = listing.price + shippingFee
    const currency    = listing.currency.toLowerCase()
    const totalCents  = toCents(totalAmount, currency)
    const feeCents    = platformFee(totalCents)

    // Create order record first
    const { data: order, error: orderErr } = await admin.from('listing_orders').insert({
      listing_id:         listingId,
      buyer_id:           user.id,
      maker_id:           listing.maker_id,
      amount:             totalAmount,
      currency:           listing.currency,
      shipping_method:    shippingMethod,
      delivery_address:   deliveryAddress ?? null,
      selected_variation: selectedVariation ?? null,
      status:             'pending',
    }).select('id').single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Could not create order' }, { status: 500 })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode:                'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency,
          product_data: { name: listing.title },
          unit_amount: totalCents,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: feeCents,
        transfer_data: { destination: makerProfile.stripe_account_id },
      },
      metadata: { order_id: order.id, listing_id: listingId },
      success_url: `${appUrl}/listings/${listingId}/success?order=${order.id}`,
      cancel_url:  `${appUrl}/listings/${listingId}`,
    })

    // Save session ID to order
    await admin.from('listing_orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('listing-checkout error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
