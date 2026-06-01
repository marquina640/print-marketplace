-- Add currency support to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'CHF';

-- Add includes_shipping flag to quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS includes_shipping BOOLEAN NOT NULL DEFAULT false;
