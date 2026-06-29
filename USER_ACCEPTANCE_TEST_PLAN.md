# PrimePulseQ Complete User Acceptance Test Plan

Use this guide to test every implemented PrimePulseQ feature. Run destructive,
billing, email, webhook, retention, and scheduled-job tests only in a staging
workspace with disposable accounts and data.

## 1. Test preparation

Prepare the following before testing:

- A desktop browser and a mobile browser, or responsive browser emulation.
- Two Supabase user accounts in separate workspaces for tenant-isolation tests.
- An owner account and non-owner accounts on Free, Starter, Growth, and
  Enterprise tiers.
- At least six employee email addresses that the tester can access.
- Employees configured with English, Arabic, French, German, Spanish, and
  Portuguese locales.
- A verified Resend sender for delivery tests. The Resend sandbox sender is
  acceptable only for limited staging tests.
- Paddle sandbox products, prices, webhook secret, and customer portal access.
- Test Slack and Microsoft Teams incoming webhook URLs.
- An Anthropic key for live AI tests. Also test once without the key.
- A configured `CRON_SECRET`, `UNSUBSCRIBE_SECRET`, `RATE_LIMIT_SALT`, and
  `SETUP_SECRET` in staging.
- Database access for verifying RLS, scheduled cleanup, and anonymous storage.

Apply all Supabase migrations in filename order, configure the environment from
`.env.example`, install dependencies, and start the app. Before manual testing,
run:

```text
npm run typecheck
npm test
npm run lint
npm run build
```

Record the browser, viewport, account tier, test data, expected result, actual
result, and screenshots for every failure.

## 2. Public website and navigation

### Landing page

1. Open `/` while signed out.
2. Verify the logo, product name, hero copy, feature sections, how-it-works
   section, calls to action, and footer render correctly.
3. Use every navigation link and call-to-action button.
4. Verify links open the intended public, login, signup, or pricing page.
5. Sign in and open `/` again.
6. Verify the app redirects to `/dashboard`.

### Pricing

1. Open `/pricing` while signed out and while signed in.
2. Verify every plan displays its price, limits, and feature list.
3. Verify public plan buttons lead to the correct signup or billing flow.
4. Compare the advertised limits with the limits shown inside the app.

### Trust, privacy, and legal pages

1. Open `/trust`, `/privacy`, and `/terms` without signing in.
2. Verify all content, headings, links, and contact details render.
3. Verify the trust and privacy pages clearly explain that answers are not
   stored with employee identity.
4. Confirm each page remains readable at 320 px width.

### Crawler rules

1. Open `/robots.txt`.
2. Verify public marketing pages are allowed.
3. Verify survey-token, API, authentication, billing, and authenticated app
   routes are disallowed.

## 3. Authentication and session handling

### Email signup

1. Open `/signup` and create a workspace with valid details.
2. Verify the confirmation state and confirmation email flow.
3. Verify a profile row is created automatically after signup.
4. Try missing fields, an invalid email, a weak password, and an existing email.
5. Verify errors are understandable and do not expose internal details.

### Google and Microsoft OAuth

1. Start Google sign-in from login and signup.
2. Complete the provider flow and verify `/auth/callback` creates a session and
   redirects to the dashboard.
3. Repeat with Microsoft/Azure sign-in.
4. Cancel each provider flow and verify the app returns to a usable auth page.
5. Test a callback with a missing or invalid code and verify a safe error state.

### Login, logout, and route protection

1. Log in with valid credentials and verify the dashboard opens.
2. Try invalid credentials and verify a clear error.
3. Log out from desktop navigation and mobile navigation.
4. While signed out, directly open `/dashboard`, `/surveys`, `/employees`,
   `/analytics`, `/actions`, and `/settings`.
5. Verify every authenticated route redirects to login and does not reveal
   workspace data.
6. Sign in and open `/login`, `/signup`, and `/forgot-password`.
7. Verify authenticated users are redirected away from auth entry pages.

### Password recovery

1. Submit an account email at `/forgot-password`.
2. Open the reset email and verify the link reaches `/reset-password` with a
   valid recovery session.
3. Try mismatched, weak, and valid new passwords.
4. Verify the old password stops working and the new password works.
5. Open an expired or reused recovery link and verify a safe error state.

## 4. Owner bootstrap

Use a fresh staging database for this test.

1. Set `SETUP_SECRET` and sign in as the intended owner.
2. Send `POST /api/setup/owner` with JSON containing the correct secret.
3. Verify the profile becomes owner with Enterprise access.
4. Repeat the same request and verify it is idempotent.
5. Sign in as another user and try the same request.
6. Verify the second user cannot claim ownership.
7. Try a missing secret, wrong secret, non-JSON body, signed-out request, and a
   deployment where `SETUP_SECRET` is unset.
8. Verify each request fails with the expected safe status and message.
9. Verify an `owner.claimed` audit entry was created.

## 5. Dashboard

### Empty workspace

1. Open the dashboard in a new workspace.
2. Verify loading completes and all counts are zero.
3. Verify onboarding guidance links to employees and survey creation.
4. Use every dashboard action and navigation link.

### Populated workspace

1. Add active and inactive employees, draft and active surveys, and responses.
2. Verify active-survey, employee, response, and response-rate values are
   consistent with the database.
3. Verify recent surveys are ordered newest first and link to survey details.
4. Confirm loading and empty states do not flash indefinitely when data is slow
   or unavailable.

## 6. Employee management

### Add, search, filter, activate, and remove

1. Add an employee with name, email, department, role, and locale.
2. Verify the employee appears and receives the welcome email.
3. Add an email containing uppercase letters and surrounding whitespace.
4. Verify it is normalized to lowercase and trimmed.
5. Try adding the same normalized email again and verify duplicate prevention.
6. Search by name and email, then filter by each available department.
7. Toggle an employee inactive and active; verify counts and badges update.
8. Remove an employee, confirm the warning, and verify the row disappears.
9. Verify the row is soft-deleted and inactive in the database.
10. Verify corresponding employee audit events exist.

### CSV import

1. Import a CSV with header `name,email,department,role,locale` and valid rows.
2. Verify the imported count and employee values.
3. Test blank email, invalid email, duplicate-in-file, already-existing email,
   unknown locale, quoted fields, blank optional fields, and mixed line endings.
4. Verify per-row imported, skipped, and error results.
5. Try more than 5,000 rows and verify rejection.
6. Reach the plan limit during an import and verify remaining rows are skipped
   with a plan-limit explanation.

### Employee plan limits

1. Verify Free blocks the 26th active employee.
2. Verify Starter blocks the 101st and Growth blocks the 501st.
3. Verify Enterprise and owner accounts are unlimited.
4. Verify deactivating or soft-deleting an employee frees a slot.
5. Verify limits hold for direct Supabase writes as well as browser actions.

## 7. Survey builder, templates, and translations

### Survey creation

1. Open `/surveys/new` and try saving without a title.
2. Create each question type: 1–10 scale, yes/no, multiple choice, and text.
3. Add and remove multiple-choice options and questions.
4. Mark a mixture of questions required and optional.
5. Save once as a draft and once as active.
6. Verify survey and question rows, order indexes, options, and status.
7. Verify active creation immediately attempts delivery to active employees.

### Frequencies and plan enforcement

1. Create one-time, weekly, biweekly, and monthly surveys.
2. Verify Free cannot create recurring surveys through either the UI or direct
   database access.
3. Verify Starter and higher tiers can create recurring surveys.
4. Activate surveys until the active-survey tier limit is reached.
5. Verify Free allows one, Starter allows five, and Growth/Enterprise are
   unlimited.

### Starter and saved templates

1. Verify all six database starter templates are visible and usable.
2. Apply each template and verify its title, description, question types, and
   options populate correctly.
3. Save a custom survey as a private template and use it in a new survey.
4. Verify another workspace cannot see the private template.
5. Verify Free allows one saved template, Starter two, and Growth/Enterprise
   effectively unlimited templates.
6. Verify a tenant cannot create or modify a global template.

### Translations

1. Add translated title, description, and question text for Arabic, French,
   German, Spanish, and Portuguese.
2. Send the survey to one employee using each supported locale.
3. Verify invitation subject/body and survey UI strings use that locale.
4. Verify missing translations fall back to English/base text.
5. Verify Arabic renders right-to-left and navigation arrows are correct.
6. Verify malformed translation JSON is rejected by the database constraint.

## 8. Survey list and lifecycle

1. Verify list search and All, Active, Draft, and Closed filters.
2. Verify status and frequency badges, creation date, close date, and response
   count.
3. Activate a draft and verify the detail page prompts for email delivery.
4. Close an active survey and verify public links stop accepting responses.
5. Soft-delete a survey and verify it disappears for the tenant.
6. During the 30-day window, call `POST /api/surveys/{id}/restore` while signed
   in and verify the survey returns.
7. Try restoring another workspace's survey and verify a not-found/forbidden
   result without data leakage.
8. Verify surveys deleted for more than 30 days are permanently purged by the
   cleanup job.

## 9. Manual survey distribution

1. Open an active survey and click `Send emails`.
2. Verify only active, non-opted-out employees are listed.
3. Test select all, deselect all, and a partial selection.
4. Send and verify sent, failed, and total counts.
5. Verify each recipient gets a different UUID token link.
6. Resend to an employee and verify a fresh usable token replaces the old token.
7. Verify configured Slack and Teams notifications contain an admin survey URL,
   never an employee token.
8. Verify `survey.emails_sent` is recorded in the audit log.

## 10. Anonymous employee response flow

### Link validation

1. Open a valid `/s/{token}` link while signed out.
2. Verify company name, localized survey content, progress, and anonymity notice.
3. Test malformed UUID, unknown UUID, used token, expired token, draft survey,
   closed survey, deleted survey, and a survey with no questions.
4. Verify each condition shows the correct terminal state without revealing
   employee or workspace details.

### Question behavior and submission

1. Answer every question type and move backward and forward.
2. Verify required questions block progress and optional questions can be
   skipped.
3. Submit and verify the localized success state.
4. Reopen and resubmit the same token; verify it is rejected as already used.
5. Verify the response row contains only survey ID, answers, timestamps, and
   response ID—never employee ID, email, token, IP, or department.
6. Verify the token is marked used in the same transaction as response creation.
7. Attempt concurrent submission with the same token and verify exactly one
   response is stored.
8. Submit too many answers, oversized keys, and text longer than 5,000
   characters; verify validation rejects them.
9. Exceed five submission attempts from one IP in ten minutes and verify HTTP
   429 feedback.
10. Verify only a salted IP hash is stored for rate limiting.

## 11. Survey results and exports

### Anonymity threshold

1. Set the workspace minimum cohort to a value from 3–20.
2. Collect fewer responses than the threshold.
3. Verify the detail page withholds results and shows progress toward the
   threshold.
4. Reach the threshold and verify scale averages/distributions, option counts,
   percentages, and text answers become visible.
5. Verify no result is attributed to an employee or department.

### PDF export

1. Open a survey with results and select `Export PDF`.
2. Verify a PDF downloads with survey metadata, status, response/question
   counts, scale charts, option percentages, and text excerpts.
3. Verify pagination, long titles, long options, and empty-answer questions.
4. Verify the filename is derived safely from the survey title.
5. Verify a `pdf.exported` audit event is recorded.
6. Verify PDF availability matches the intended Growth/Enterprise plan policy.

### CSV export

1. On Growth or Enterprise, export responses from Analytics.
2. Verify the file includes response, survey, timestamp, and question columns.
3. Verify commas, quotes, newlines, Unicode, and empty answers are encoded
   correctly.
4. Verify a workspace with no surveys receives a header-only CSV.
5. Verify Free and Starter receive HTTP 403 even if the endpoint is called
   directly.
6. Verify another workspace's surveys and responses never appear.

## 12. Analytics and insights

### Core analytics

1. Verify the empty state when no survey responses exist.
2. Collect responses containing scale and non-scale answers.
3. Test 4-, 8-, and 12-week filters.
4. Verify engagement trend, average response rate, burnout percentage, score
   distribution, and Pulse Score Index calculations against source data.
5. Verify the department tab shows headcount only and explicitly explains why
   anonymous responses cannot produce department scores.
6. Verify sentiment and burnout tabs obey their plan gates.

### Rule-based and AI insights

1. Create data representing healthy, sharply falling, low-response, and
   high-burnout scenarios.
2. Verify rule-based insights and action recommendations match each scenario.
3. Remove `ANTHROPIC_API_KEY`, reload Analytics, and verify the fallback result
   is usable and labeled as fallback.
4. Add a valid key and verify a live narrative, low/medium/high burnout risk,
   and exactly three recommendations.
5. Simulate an Anthropic error or malformed response and verify automatic
   fallback without breaking Analytics.
6. Verify only aggregate numeric metrics—not individual answers—are sent to the
   AI endpoint.

### Industry benchmarks

1. Leave industry/company size unset and verify configuration guidance.
2. Configure both values and complete fewer than three survey cycles; verify
   eligibility messaging.
3. Create at least three distinct staging workspaces in the same cohort with
   eligible data.
4. Verify p25, median, p75, cohort size, and the workspace marker.
5. Verify cohorts remain separate by industry and headcount band.
6. Verify percentiles remain hidden below three distinct organizations.
7. Verify at most one snapshot per workspace/week is stored.

## 13. Action tracking

1. Open `/actions` with no actions and verify the empty state.
2. Create an action with and without a description.
3. Move it through Planned, In progress, and Done.
4. Verify `completed_at` is set only for Done.
5. Delete an action and verify it disappears.
6. Add an AI recommendation to Actions and verify title/description parsing.
7. Verify adding the same displayed recommendation twice is prevented by the
   current page state.
8. Verify another workspace cannot read or modify the action.

## 14. Workspace settings

### Company profile

1. Update company name, slug, website, industry, and company size.
2. Verify saved values reload and company name appears on employee survey pages.
3. Try a duplicate slug and invalid industry/headcount values.
4. Verify authenticated browser clients cannot update owner, subscription tier,
   status, trial end, Paddle customer ID, or email fields directly.

### Survey preferences

1. Test link expiry values 3, 7, 14, and 30 days and verify generated token
   expiry timestamps.
2. Test data retention Forever, 30, 90, 180, and 365 days.
3. Set response-rate alert from 0–100 and verify closure alert behavior.
4. Set the result threshold from 3–20 and verify result visibility.
5. Configure send weekday, hour, and timezone; verify saved values reload.
6. Toggle digest emails and verify the saved profile value.

### Notification preferences

1. Toggle each notification preference.
2. Reload in the same browser and verify the selections persist in local
   storage.
3. Open another browser/profile and verify these local-only settings do not
   incorrectly appear as server-synced preferences.

## 15. Slack and Microsoft Teams integrations

1. On Growth/Enterprise, save a valid Slack incoming webhook URL and send a test
   message.
2. Repeat with a valid Teams webhook URL.
3. Verify survey sends produce correctly formatted notifications.
4. Test HTTP, lookalike domains, credentials in URLs, localhost, private IPs,
   cloud metadata addresses, malformed URLs, and a Slack URL entered as Teams.
5. Verify validation prevents all non-allowlisted destinations on client and
   server.
6. Verify Free/Starter sees the upgrade state.
7. Verify removing a saved URL disconnects the integration.
8. Verify webhook failures do not prevent survey email delivery.

## 16. Email and unsubscribe

### Welcome and survey email content

1. Verify employee welcome email sender, recipient, subject, company name,
   anonymity explanation, and HR contact.
2. Verify survey email sender, localized subject/body, survey title,
   description, CTA, plain link, trust link, and unsubscribe link.
3. Verify Arabic email direction is RTL.
4. Enter HTML/script-like employee, company, survey, and description values and
   verify they are escaped rather than executed.

### Unsubscribe

1. Open a valid signed unsubscribe link and verify the success page.
2. Verify `email_opted_out` becomes true only for the signed workspace/employee.
3. Send another survey and verify that employee receives no email.
4. Test missing, malformed, tampered, unsigned, wrong-secret, and cross-employee
   tokens.
5. Verify each invalid token fails without changing employee data.

### Delivery status and retry

1. Force one Resend delivery to fail.
2. Verify its token records `failed` and a bounded error message while successful
   tokens record `sent`.
3. Run the scheduled endpoint and verify a live, unused, unexpired failed token
   is retried once.
4. Verify success clears the error and sets `sent`; repeated failure retains a
   bounded error.

## 17. Scheduled surveys and housekeeping

Call the scheduled route only in staging using `Authorization: Bearer
<CRON_SECRET>`.

1. Verify missing, wrong, and undefined cron secrets are rejected.
2. Configure weekly, biweekly, and monthly surveys across multiple timezones.
3. With `CRON_HOURLY=true`, verify sends occur only at the configured local day
   and hour.
4. With daily cron mode, verify the configured weekday is honored and document
   that per-tenant hour is not enforceable.
5. Verify opted-out, inactive, and soft-deleted employees are skipped.
6. Verify cron audit entries and run-history counts for surveys, attempts,
   failures, completion, and errors.
7. Verify owner-only cron history visibility.
8. For a one-time survey, use or expire every token and run the job.
9. Verify it closes the survey, records `closed_at`, calculates response rate,
   writes an audit event, and emails the owner.
10. Verify the low-response warning uses the workspace threshold.
11. Verify used/expired tokens are purged while live tokens remain.
12. Verify old responses are purged only for workspaces that opted into
   retention, and Forever retains all responses.
13. Verify surveys soft-deleted over 30 days are purged while recent deletions
   remain restorable.
14. Force a job error and verify Sentry capture, `cron_runs.errors`, and the
   owner Slack failure alert when configured.

## 18. Billing and plan behavior

### Paddle checkout and success

1. On a non-owner account, select Starter, Growth, and Enterprise checkout in
   Paddle sandbox.
2. Verify the app creates/reuses the Paddle customer and opens the correct
   hosted checkout.
3. Complete a transaction and verify `/billing/success` waits for and then shows
   the updated plan.
4. Verify customer ID, subscription tier, and active status update through the
   signed webhook.
5. Verify a `plan.upgraded` audit event.

### Subscription changes and portal

1. Open the Paddle customer portal from a paid account.
2. Update the plan and verify `subscription.updated` changes the tier/status.
3. Simulate past due, paused, failed payment, and cancellation events.
4. Verify status changes and cancellation returns the profile to Free with a
   `plan.downgraded` audit event.
5. Verify an account without a Paddle customer receives a clear portal error.
6. Send a webhook with no signature or an invalid signature and verify rejection
   before any profile update.

### Owner tier simulation and gates

1. Sign in as owner and switch among Free, Starter, Growth, and Enterprise in
   settings.
2. Verify the stored simulated tier changes while owner access remains
   unlimited.
3. For non-owner accounts, verify employee limits, active-survey limits,
   recurring surveys, templates, analytics, exports, integrations, and audit
   features match the plan matrix.
4. Attempt gated operations through direct endpoints/database calls and verify
   server/database enforcement where implemented.

## 19. Audit log and observability

1. Perform survey creation, activation, closure, deletion, restoration, email
   sending, employee changes/import, PDF export, owner claim, and plan changes.
2. Verify audit action, actor/system identity, resource, metadata, and timestamp.
3. Verify logs are ordered newest first and capped at 100 in the UI.
4. Verify cross-workspace audit isolation.
5. Verify Enterprise/owner audit access follows the intended plan policy.
6. With Sentry DSNs unset, verify client, server, and edge paths work as no-ops.
7. With staging DSNs configured, trigger controlled client, server, webhook, and
   scheduled-job errors and verify they appear in Sentry without secrets or
   employee answers.

## 20. Workspace deletion

Use a disposable workspace.

1. Open Settings → Company → Danger Zone.
2. Start deletion and verify the exact company name (or `DELETE` fallback) is
   required.
3. Cancel once and verify nothing changes.
4. Confirm deletion and verify the user is signed out and returned home.
5. Verify the auth user, profile, employees, surveys, questions, responses,
   tokens, actions, templates, audit logs, benchmarks, and dependent workspace
   data are removed as applicable.
6. Verify another workspace remains intact.
7. Verify a signed-out or cross-site request cannot delete a workspace.

## 21. Security and tenant-isolation checks

1. In workspace A, create employees, surveys, responses, actions, templates,
   audit logs, and benchmark snapshots.
2. Sign in to workspace B and attempt list, direct-ID read, insert, update, and
   delete operations against workspace A through the UI and Supabase client.
3. Verify RLS hides or rejects every cross-tenant operation.
4. Verify anonymous users cannot read surveys, responses, tokens, or workspace
   data directly from Supabase.
5. Verify browser users can update only approved profile columns.
6. For authenticated mutating endpoints, test cross-site Fetch Metadata and a
   mismatched Origin/Host; verify HTTP 403.
7. Send missing or non-JSON content types to JSON-only endpoints; verify HTTP
   415.
8. Inspect response headers and verify CSP, HSTS, MIME sniffing, frame,
   referrer, and permissions policies.
9. Verify production scripts receive per-request CSP nonces and public survey
   pages also receive CSP.
10. Verify tokens and secrets never appear in client bundles, logs, analytics,
    webhooks, or error messages.

## 22. Responsive, accessibility, and compatibility

Test at 320, 375, 768, 1024, and 1440 px widths.

1. Verify desktop sidebar, mobile header, and mobile bottom navigation.
2. Verify all tables, charts, dialogs, tabs, forms, emails, and survey question
   controls remain usable without horizontal page overflow.
3. Complete signup, login, employee add/import, survey creation, survey response,
   settings, billing, and deletion using keyboard only.
4. Verify visible focus, logical tab order, labels, disabled states, and dialog
   focus behavior.
5. Verify text/background contrast and 200% zoom usability.
6. Verify English left-to-right and Arabic right-to-left layouts.
7. Repeat critical flows in current Chrome, Edge, Firefox, and Safari.

## 23. Completion criteria

Testing is complete only when:

- All applicable steps pass on staging.
- Automated tests, typecheck, lint, and production build pass.
- No cross-tenant data is visible.
- No response can be linked to an employee in stored response data.
- Result-threshold behavior is consistent across detail views and exports.
- Plan gates behave consistently in UI, API routes, and database writes.
- Billing and webhook tests use valid signatures and produce correct plan state.
- Scheduled delivery is verified in both hourly and daily modes used by the
  deployment.
- No secrets, employee identities, or individual answers reach logs, Sentry,
  AI requests, or third-party notifications.
- All destructive tests were performed only with disposable staging data.

Document every failure with reproduction steps, account tier, route, expected
result, actual result, console/network output, and a screenshot or video.
