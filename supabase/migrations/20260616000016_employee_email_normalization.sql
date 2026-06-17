-- ============================================================
-- 20260616000016_employee_email_normalization
-- Normalize employee email addresses before uniqueness checks.
-- ============================================================

create or replace function normalize_employee_email()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  NEW.email := lower(trim(NEW.email));
  return NEW;
end;
$$;

drop trigger if exists normalize_employee_email_before_write on employees;
create trigger normalize_employee_email_before_write
  before insert or update of email on employees
  for each row execute function normalize_employee_email();
