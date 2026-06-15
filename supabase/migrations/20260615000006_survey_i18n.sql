-- ============================================================
-- 20260615000006_survey_i18n
-- Multi-language surveys.
--   employees.locale   — preferred language for invitations + survey page
--   surveys.translations — per-question + meta translations keyed by locale:
--     { "questions": { "<question_id>": { "fr": "...", "ar": "..." } },
--       "meta": { "fr": { "title": "...", "description": "..." } } }
-- Supported locales: en (default), ar (RTL), fr, de, es, pt.
-- ============================================================

alter table employees add column if not exists locale text default 'en'
  check (locale in ('en','ar','fr','de','es','pt'));

alter table surveys add column if not exists translations jsonb default '{}'::jsonb;
