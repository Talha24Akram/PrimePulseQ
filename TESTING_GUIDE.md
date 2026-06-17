# PrimePulseQ Website Feature Testing Guide

Use this guide to test the website through the browser. It only covers visible website behavior and feature flows.

## 1. Public Website Pages

### Landing page

1. Open the home page.
2. Verify the PrimePulseQ branding is visible.
3. Verify the main call-to-action buttons are visible and clickable.
4. Click the login/sign-up navigation links.
5. Verify they open the correct pages.
6. Check the page on mobile width.
7. Verify text, buttons, and images do not overlap.

### Pricing page

1. Open the pricing page.
2. Verify Starter, Growth, and Enterprise plans are shown.
3. Verify each plan has price, employee limit, and feature list.
4. Click each plan CTA.
5. Verify signed-out users are sent to sign up or login.
6. Verify signed-in users are sent to checkout or billing flow.
7. Confirm plan feature descriptions match what is shown inside the app.

### Trust page

1. Open the trust page.
2. Verify it explains employee anonymity clearly.
3. Verify it says responses are not linked to employee identity.
4. Verify the page is readable without logging in.
5. Check mobile layout.

### Terms and privacy pages

1. Open the terms page.
2. Verify the page loads fully.
3. Open the privacy page.
4. Verify privacy/anonymity sections are present.
5. Check links and contact information.
6. Verify both pages are readable on mobile.

## 2. Authentication

### Sign up

1. Open the sign-up page.
2. Enter a name, company name, email, and password.
3. Submit the form.
4. Verify the page shows either a successful signup state or sends you into the expected email confirmation flow.
5. Try submitting with missing required fields.
6. Verify clear validation or error messages appear.
7. Try a weak password if allowed by the form.
8. Verify the website handles it cleanly.

### Login

1. Open the login page.
2. Enter valid account credentials.
3. Submit the form.
4. Verify you land on the dashboard.
5. Log out or use a signed-out browser.
6. Try opening dashboard, employees, surveys, analytics, actions, and settings pages.
7. Verify protected pages redirect to login.
8. Try invalid credentials.
9. Verify the error message is understandable.

### Forgot password

1. Open the forgot-password page.
2. Enter an account email.
3. Submit.
4. Verify a success message appears.
5. Use the reset link from email.
6. Set a new password.
7. Verify you can log in with the new password.

## 3. Dashboard

### Empty workspace dashboard

1. Log in with a new workspace.
2. Open the dashboard.
3. Verify the dashboard loads without errors.
4. Verify empty states guide the user toward adding employees or creating surveys.
5. Check that cards and navigation are readable on mobile.

### Populated dashboard

1. Add employees, create surveys, and collect responses.
2. Return to the dashboard.
3. Verify dashboard counts and summary cards update.
4. Click dashboard navigation links or action buttons.
5. Verify each opens the expected page.

## 4. Employees

### Employee list

1. Open the employees page.
2. Verify the page shows total, active, and inactive employee counts.
3. Verify the search input filters employees by name or email.
4. Verify department filter buttons work.
5. Check the table on mobile and desktop.
6. Verify long names/emails do not break the layout.

### Add employee

1. Click `Add employee`.
2. Leave email blank and try to save.
3. Verify a required email error appears.
4. Enter name, work email, department, role, and language.
5. Save.
6. Verify the employee appears in the list.
7. Try adding the same email again.
8. Verify duplicate handling is clear.
9. Try uppercase or whitespace around the email.
10. Verify the website either normalizes it or shows a duplicate/error.

### Employee language

1. Add employees with different languages:
   - English.
   - Arabic.
   - French.
   - German.
   - Spanish.
   - Portuguese.
2. Send a survey to those employees.
3. Open each employee's survey link.
4. Verify the survey interface appears in the employee's selected language.
5. Verify Arabic displays right-to-left.

### Toggle active status

1. Click an employee active/inactive status badge.
2. Verify the status changes.
3. Refresh the page.
4. Verify the status remains changed.
5. Send a survey.
6. Verify inactive employees are not treated as active recipients.

### Delete employee

1. Click the delete/remove icon for an employee.
2. Confirm the deletion prompt.
3. Verify the employee disappears from the list.
4. Verify counts update.
5. Refresh the page.
6. Verify the employee remains hidden.

### Import CSV

1. Open employees page.
2. Click `Import CSV`.
3. Upload a valid CSV with name, email, department, role, and locale columns.
4. Verify imported employees appear.
5. Upload a CSV with invalid email rows.
6. Verify row-level errors are shown.
7. Upload a CSV with duplicate emails.
8. Verify duplicates are skipped or clearly reported.
9. Upload enough rows to exceed the current plan limit.
10. Verify the website reports plan-limit failures clearly.

## 5. Surveys

### Survey list

1. Open the surveys page.
2. Verify all surveys are listed.
3. Use search to filter by title.
4. Use status filters:
   - All.
   - Active.
   - Draft.
   - Closed.
5. Verify each filter returns the expected surveys.
6. Verify survey cards show title, description, status, frequency, created date, and response count.

### Create draft survey

1. Open `New survey`.
2. Enter a title and description.
3. Add a scale question.
4. Add a yes/no question.
5. Add a multiple-choice question with options.
6. Add a text question.
7. Mark some questions required and others optional.
8. Click `Save as draft`.
9. Verify you land on the survey detail page.
10. Return to surveys list.
11. Verify the survey appears with draft status.

### Publish and send survey

1. Create a new survey.
2. Add at least one active employee first.
3. Click `Publish & send`.
4. Verify the survey becomes active.
5. Verify a success or sent-count message appears if emails are configured.
6. Verify failures are shown clearly if email sending fails.

### Activate draft survey

1. Open a draft survey.
2. Click `Activate`.
3. Verify it changes to active.
4. Verify the send-email dialog appears.
5. Select employees.
6. Send emails.
7. Verify sent/failed count is displayed.

### Close survey

1. Open an active survey.
2. Click `Close survey`.
3. Verify status changes to closed.
4. Open a survey link for that survey.
5. Verify respondents see a closed message.

### Delete survey

1. Open the surveys list.
2. Click delete on a survey.
3. Confirm deletion.
4. Verify it disappears from the list.
5. Refresh the page.
6. Verify it remains hidden.

### Survey detail page

1. Open a survey detail page.
2. Verify title, description, status, created date, question count, and response count.
3. Verify questions tab lists every question.
4. Verify results tab shows either empty state, privacy threshold state, or results.
5. Verify all buttons are visible and clickable.

## 6. Survey Templates

### Starter templates

1. Open `New survey`.
2. Verify starter templates are visible.
3. Click each starter template.
4. Verify title, description, and questions populate.
5. Edit the populated survey.
6. Verify edits are allowed.

### Save custom template

1. Create a survey title and questions.
2. Click `Save as template`.
3. Verify a saved confirmation appears.
4. Refresh the page.
5. Verify the saved template appears.
6. Click the saved template.
7. Verify it populates the survey builder.

### Template limits

1. Use an account with a low template limit.
2. Save templates until the limit is reached.
3. Try creating or saving another template.
4. Verify the website blocks it or shows an upgrade prompt.

## 7. Survey Translations

### Add translations

1. Open `New survey`.
2. Add a title, description, and questions in English.
3. Open `Manage translations`.
4. Select a non-English language.
5. Add translated title and translated question text.
6. Leave one field blank.
7. Publish/send the survey.
8. Open a token link for an employee using that language.
9. Verify translated fields appear.
10. Verify blank translations fall back to English.

### Arabic right-to-left

1. Add Arabic translations.
2. Assign an employee Arabic as their survey language.
3. Send the survey.
4. Open that employee's survey link.
5. Verify text direction is right-to-left.
6. Verify navigation buttons still work correctly.

## 8. Anonymous Response Flow

### Open valid survey link

1. Send a survey to an employee.
2. Open the employee's survey link.
3. Verify the survey title, company name, questions, and anonymity notice appear.
4. Verify the page does not ask the employee to log in.

### Invalid link

1. Open an obviously invalid survey URL.
2. Verify the website shows an invalid or not-found state.
3. Open a random UUID-style survey URL.
4. Verify the website does not reveal private survey details.

### Required question behavior

1. Open a survey with required questions.
2. Try to continue without answering a required question.
3. Verify the next/submit button is disabled or blocked.
4. Answer the required question.
5. Verify you can continue.

### Submit survey response

1. Complete all required questions.
2. Submit the survey.
3. Verify a thank-you screen appears.
4. Refresh the token link.
5. Verify it now shows already-submitted or used-link state.

### Expired survey link

1. Open an expired employee survey link.
2. Verify the website shows an expired-link message.
3. Verify the user cannot submit.

### Closed survey link

1. Open a token link for a closed survey.
2. Verify the website shows a closed-survey message.
3. Verify the user cannot submit.

### Rate limit feedback

1. Submit repeatedly from the same browser/device if possible.
2. Verify excessive attempts show a clear too-many-submissions message.
3. Verify the message tells the user to wait and try again.

## 9. Survey Results

### No responses

1. Open a survey with no responses.
2. Open the results tab.
3. Verify the empty state explains there are no responses yet.

### Below anonymity threshold

1. Collect fewer responses than the configured minimum cohort threshold.
2. Open survey results.
3. Verify results are hidden.
4. Verify the page explains how many more responses are needed.
5. Verify individual answers are not shown.

### Above anonymity threshold

1. Collect enough responses to meet the threshold.
2. Open survey results.
3. Verify scale questions show average and distribution.
4. Verify yes/no questions show counts and percentages.
5. Verify multiple-choice questions show counts and percentages.
6. Verify text responses appear only after threshold is met.
7. Verify no employee name, email, or department appears in response results.

### PDF export

1. Open a survey with visible results.
2. Click `Export PDF`.
3. Verify a PDF downloads.
4. Open the PDF.
5. Verify survey title, questions, and results are readable.

## 10. Analytics

### Empty analytics

1. Open analytics in a new workspace.
2. Verify empty states appear.
3. Verify the page does not crash.
4. Verify calls to action guide the user to create surveys or add employees.

### Populated analytics

1. Collect enough survey responses.
2. Open analytics.
3. Verify engagement score appears.
4. Verify trend charts appear.
5. Verify response rate appears.
6. Verify burnout signals appear.
7. Verify pulse index appears.
8. Verify action recommendations appear.

### AI insights

1. Open analytics with response data.
2. Verify AI or fallback insight text appears.
3. Verify burnout risk level appears.
4. Verify manager recommendations appear.
5. Refresh the page.
6. Verify the page remains stable while insights load.

### Benchmark widget

1. Open analytics without industry/company size configured.
2. Verify the widget asks for configuration.
3. Configure industry and company size in settings.
4. Return to analytics.
5. Verify the widget shows eligibility or benchmark status.
6. If enough cohort data exists, verify p25, p50, and p75 values appear.
7. If not enough cohort data exists, verify the privacy-gated message appears.

### CSV export

1. Use a plan that allows CSV export.
2. Open analytics.
3. Click CSV export.
4. Verify a CSV downloads.
5. Use a plan that does not allow CSV export.
6. Verify the website blocks export or shows an upgrade prompt.

## 11. Actions

### Action list

1. Open the actions page.
2. Verify existing actions are listed.
3. Verify empty state appears if there are no actions.

### Create action

1. Add a new action title.
2. Save it.
3. Verify it appears in the list.
4. Refresh the page.
5. Verify it persists.

### Update action status

1. Change an action from planned to in-progress.
2. Verify the UI updates.
3. Change it to done.
4. Verify the UI updates.
5. Refresh and verify the status persists.

## 12. Settings

### Company profile

1. Open settings.
2. Update company name.
3. Update slug.
4. Update website.
5. Update industry.
6. Update company size.
7. Save.
8. Verify success confirmation appears.
9. Refresh.
10. Verify values persist.

### Survey link expiry

1. Open settings preferences.
2. Change survey link expiry days.
3. Save.
4. Send a survey.
5. Open the received survey link.
6. Verify it works before expiry.
7. Verify expired links show the expired-link page when applicable.

### Data retention

1. Open settings preferences.
2. Select a data retention option.
3. Save.
4. Verify success confirmation appears.
5. Refresh and verify the selected option persists.

### Response threshold

1. Change minimum cohort display.
2. Save.
3. Open a survey below that threshold.
4. Verify results are hidden.
5. Add enough responses to meet the threshold.
6. Verify results become visible.

### Send schedule

1. Change send day.
2. Change send hour.
3. Change timezone.
4. Save.
5. Refresh settings.
6. Verify values persist.
7. Verify recurring survey sends follow the configured schedule when cron runs.

### Notification preferences

1. Toggle notification settings.
2. Verify toggles change visually.
3. Refresh the page.
4. Verify saved local preferences persist.

## 13. Integrations

### Slack integration

1. Open settings integrations.
2. Enter a Slack webhook URL.
3. Click `Test`.
4. Verify success appears on the website.
5. Verify a test message arrives in Slack.
6. Click save.
7. Send a survey.
8. Verify Slack receives a survey notification.

### Teams integration

1. Open settings integrations.
2. Enter a Teams webhook URL.
3. Click `Test`.
4. Verify success appears on the website.
5. Verify a message/card arrives in Teams.
6. Click save.
7. Send a survey.
8. Verify Teams receives a survey notification.

### Invalid integration URL

1. Enter a non-Slack/non-Teams URL.
2. Click `Test`.
3. Verify the website rejects it.
4. Enter a non-HTTPS URL.
5. Verify the website rejects it.
6. Try saving an invalid URL.
7. Verify the website prevents unsafe or unsupported URLs.

### Plan-gated integrations

1. Use a plan that does not include Slack or Teams.
2. Open integrations.
3. Verify upgrade prompts appear.
4. Verify webhook input fields are not usable.
5. Upgrade or use an allowed account.
6. Verify the integration fields become usable.

## 14. Email Features

### Employee invite email

1. Add a new employee.
2. Verify the website does not hang while sending the invite.
3. Check the employee inbox.
4. Verify the invite email content is clear.
5. Verify company name and admin contact are correct.

### Survey email

1. Send a survey to employees.
2. Check inboxes.
3. Verify each email contains:
   - Company name.
   - Survey title.
   - Survey call-to-action.
   - Anonymous/privacy note.
   - Unsubscribe link.
   - Trust page link.
4. Click the survey button.
5. Verify it opens the employee's survey.

### Email unsubscribe

1. Open unsubscribe link from a survey email.
2. Verify a success page appears.
3. Send another survey.
4. Verify unsubscribed employee does not receive it.
5. Open an invalid unsubscribe link.
6. Verify an error page appears.

### Email failure display

1. Send to one valid and one invalid email address.
2. Verify the website shows sent and failed counts where applicable.
3. Verify failed sends do not block the whole survey.

## 15. Cron And Scheduled Surveys

### Cron protected behavior through website-visible results

1. Create active recurring surveys.
2. Add active employees.
3. Configure send schedule in settings.
4. Wait for the scheduled job or trigger it through the deployment dashboard.
5. Verify employees receive survey emails.
6. Verify the survey detail page shows generated responses after employees submit.
7. Verify audit log records scheduled sends.

### Cron history

1. Sign in as owner.
2. Open settings.
3. Find cron history.
4. Verify recent scheduled runs appear.
5. Verify status, survey count, and email attempted/failed counts are readable.
6. Sign in as non-owner.
7. Verify cron history is hidden or inaccessible.

### One-time survey auto-close

1. Create and send a one-time survey.
2. Submit all employee responses or let all links expire.
3. Wait for scheduled job.
4. Verify the survey becomes closed.
5. Verify the owner receives a closure notification email.
6. Verify survey detail shows closed status.

## 16. Billing And Plan Gates

### Checkout

1. Open settings billing.
2. Choose a paid plan.
3. Click upgrade.
4. Verify checkout opens.
5. Complete sandbox/test payment if available.
6. Verify the success page appears.
7. Return to settings.
8. Verify the new plan is shown.

### Billing portal

1. Open settings billing with a paid account.
2. Click manage billing.
3. Verify the billing portal opens.
4. Return to the app.
5. Verify the website still shows the correct plan.

### Plan feature gates

For each plan, verify the website allows or blocks:

- Employee count limits.
- Active survey limits.
- Recurring surveys.
- Slack integration.
- Teams integration.
- CSV export.
- PDF export.
- Advanced analytics.
- Template limits.
- Audit logs.

For each blocked feature:

1. Verify an upgrade message appears.
2. Verify the action is disabled or prevented.
3. Verify the user is directed to billing when appropriate.

## 17. Audit Logs

1. Open settings.
2. Find audit log.
3. Create a survey.
4. Activate a survey.
5. Send survey emails.
6. Add an employee.
7. Delete an employee.
8. Export a PDF.
9. Return to audit log.
10. Verify events appear with action, resource type, actor, and timestamp.
11. Sign in as another workspace.
12. Verify that workspace cannot see the first workspace's audit log.

## 18. Security And Privacy Website Checks

### Cross-workspace isolation

1. Create two separate workspaces.
2. Add different employees and surveys to each.
3. Sign in as workspace A.
4. Verify only workspace A data appears.
5. Sign in as workspace B.
6. Verify only workspace B data appears.
7. Try opening a direct URL to a survey from the other workspace.
8. Verify it is not visible.

### Anonymous response guarantee

1. Submit several survey responses.
2. Open survey results.
3. Verify no employee names or emails appear.
4. Verify text answers are hidden below the anonymity threshold.
5. Verify analytics are aggregate only.
6. Verify exports do not include employee identity.

### Browser security behavior

1. Open the website in browser devtools.
2. Navigate around the app.
3. Verify no major console errors appear.
4. Verify pages do not show raw error stacks to users.
5. Verify invalid forms show friendly messages.

### Unsafe content handling

1. Use special characters in company name, survey title, question text, and employee name:

```text
Acme & Sons <Test> "HR"
```

2. Send emails and view survey/results pages.
3. Verify the text appears safely.
4. Verify no unexpected HTML renders.

## 19. Mobile And Responsive Testing

Test these pages on mobile, tablet, and desktop widths:

- Home.
- Login.
- Signup.
- Dashboard.
- Employees.
- Surveys.
- New survey.
- Survey detail.
- Public survey response page.
- Analytics.
- Actions.
- Settings.
- Pricing.
- Trust.
- Privacy.
- Terms.

For each page:

1. Verify text does not overlap.
2. Verify buttons are tappable.
3. Verify modals fit on screen.
4. Verify tables scroll or collapse properly.
5. Verify navigation is usable.
6. Verify forms are not cut off.
7. Verify charts remain readable.
8. Verify dark-mode contrast is acceptable.

## 20. Final Website Regression Checklist

Before considering the website ready, manually confirm:

- Public pages load.
- Signup works.
- Login works.
- Protected pages redirect signed-out users.
- Employees can be added, imported, toggled, and deleted.
- Surveys can be drafted, published, activated, sent, closed, and deleted.
- Templates can be applied and saved.
- Survey translations display correctly.
- Employee survey links work.
- Used, expired, invalid, and closed links show correct states.
- Anonymous responses submit successfully.
- Results are hidden below the privacy threshold.
- Results appear above the privacy threshold.
- Analytics and insights load.
- Benchmarks show configured, locked, or percentile states correctly.
- Actions can be created and updated.
- Settings save and persist.
- Slack and Teams integrations test successfully on allowed plans.
- Survey emails contain correct links and unsubscribe.
- Unsubscribe works.
- Scheduled survey sends appear in website-visible history/results.
- Billing checkout and portal flows work in test mode.
- Plan gates match pricing.
- Audit logs show key events.
- Workspaces cannot see each other's data.
- Mobile layout is usable.
