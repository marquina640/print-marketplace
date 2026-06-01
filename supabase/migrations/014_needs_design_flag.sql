-- Add needs_design flag to jobs
-- When true, the job is only visible to makers who have design_services = true on their printer_profile
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS needs_design BOOLEAN NOT NULL DEFAULT false;
