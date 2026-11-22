-- Sync auth.users.email -> profiles.email whenever a user confirms an email change.
-- The existing handle_new_user trigger covers INSERT; this covers UPDATE.
create or replace function sync_user_email()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = new.email
    where user_id = new.id;
  end if;
  return new;
end;
$$;

create or replace trigger on_auth_user_email_updated
  after update on auth.users
  for each row execute function sync_user_email();
