-- ============================================================
-- 20260616000008_email_status
-- Per-token email delivery status so failed survey emails can be retried
-- individually (not all-or-nothing).
-- ============================================================

alter table survey_tokens add column if not exists email_status text default 'pending'
  check (email_status in ('pending', 'sent', 'failed'));
alter table survey_tokens add column if not exists email_error text;

create index if not exists survey_tokens_email_status on survey_tokens (email_status);
