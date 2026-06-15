-- ============================================================
-- 20260616000006_translations_check
-- surveys.translations must be a JSON object (not an array or scalar). The
-- builder writes a well-formed { questions: {...}, meta: {...} } object; this
-- guards against malformed direct writes via the Supabase API.
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'surveys_translations_object') then
    alter table surveys add constraint surveys_translations_object
      check (translations is null or jsonb_typeof(translations) = 'object');
  end if;
end $$;
