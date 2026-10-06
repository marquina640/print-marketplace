-- View for admin use: printer_profiles with email visible
CREATE OR REPLACE VIEW printer_profiles_admin AS
SELECT
  pp.*,
  p.email,
  p.created_at AS user_created_at
FROM printer_profiles pp
JOIN profiles p ON p.user_id = pp.user_id;
