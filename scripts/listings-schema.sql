-- Run this in Supabase SQL editor

CREATE TABLE listings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maker_id      UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'CHF',
  photos        TEXT[] NOT NULL DEFAULT '{}',
  category      TEXT,
  shipping_available       BOOLEAN NOT NULL DEFAULT false,
  shipping_price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  pickup_available         BOOLEAN NOT NULL DEFAULT false,
  local_delivery_available BOOLEAN NOT NULL DEFAULT false,
  status        TEXT NOT NULL DEFAULT 'active',  -- active | paused | sold_out
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE follows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  maker_id     UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, maker_id)
);

CREATE TABLE listing_orders (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id               UUID NOT NULL REFERENCES listings(id),
  buyer_id                 UUID NOT NULL REFERENCES profiles(user_id),
  maker_id                 UUID NOT NULL REFERENCES profiles(user_id),
  amount                   NUMERIC(10,2) NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'CHF',
  shipping_method          TEXT NOT NULL,  -- shipping | pickup | local_delivery
  delivery_address         TEXT,
  status                   TEXT NOT NULL DEFAULT 'pending',  -- pending | paid | shipped | delivered | cancelled
  stripe_session_id        TEXT,
  stripe_payment_intent_id TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE listings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows         ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_orders  ENABLE ROW LEVEL SECURITY;

-- Listings: public read of active, maker owns their own
CREATE POLICY "listings_read_active"  ON listings FOR SELECT USING (status = 'active' OR maker_id = auth.uid());
CREATE POLICY "listings_maker_insert" ON listings FOR INSERT WITH CHECK (maker_id = auth.uid());
CREATE POLICY "listings_maker_update" ON listings FOR UPDATE USING (maker_id = auth.uid());
CREATE POLICY "listings_maker_delete" ON listings FOR DELETE USING (maker_id = auth.uid());

-- Follows: anyone can read, auth users manage their own
CREATE POLICY "follows_read"   ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (follower_id = auth.uid());

-- Listing orders: buyer or maker can read their own
CREATE POLICY "orders_read"   ON listing_orders FOR SELECT USING (buyer_id = auth.uid() OR maker_id = auth.uid());
CREATE POLICY "orders_insert" ON listing_orders FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "orders_update" ON listing_orders FOR UPDATE USING (maker_id = auth.uid() OR buyer_id = auth.uid());

-- Storage bucket for listing photos (run separately if bucket doesn't exist)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('listing-photos', 'listing-photos', true);
-- CREATE POLICY "listing_photos_read"   ON storage.objects FOR SELECT USING (bucket_id = 'listing-photos');
-- CREATE POLICY "listing_photos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-photos' AND auth.role() = 'authenticated');
-- CREATE POLICY "listing_photos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
