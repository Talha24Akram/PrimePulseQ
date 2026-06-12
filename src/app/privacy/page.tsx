import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/public-nav";

const EFFECTIVE_DATE = "May 16, 2026";
const LAST_UPDATED = "May 16, 2026";
const CONTACT_EMAIL = "privacy@primepulseq.com";
const COMPANY_NAME = "PrimePulseQ";
const COMPANY_JURISDICTION = "Pakistan";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-white/10">
        {title}
      </h2>
      <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-1.5 pl-2">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

const toc = [
  { id: "overview", label: "Overview" },
  { id: "data-we-collect", label: "Data We Collect" },
  { id: "anonymity", label: "Survey Anonymity" },
  { id: "how-we-use", label: "How We Use Your Data" },
  { id: "third-parties", label: "Third-Party Services" },
  { id: "gdpr", label: "GDPR Rights (EU)" },
  { id: "ccpa", label: "CCPA Rights (California)" },
  { id: "retention", label: "Data Retention & Deletion" },
  { id: "cookies", label: "Cookie Policy" },
  { id: "international", label: "International Transfers" },
  { id: "children", label: "Children's Privacy" },
  { id: "changes", label: "Changes to This Policy" },
  { id: "contact", label: "Contact Us" },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PublicNav />
      <div className="mx-auto max-w-7xl px-6 py-12 pt-24">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-8 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>

        <div className="flex gap-16 items-start">
          {/* Sidebar TOC */}
          <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-28">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Contents</p>
            <nav className="space-y-1">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 py-1 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 max-w-3xl">
            {/* Header */}
            <div className="mb-10">
              <div className="inline-block bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                Legal
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Privacy Policy</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Last updated: {LAST_UPDATED}
              </p>
            </div>

            {/* Disclaimer banner */}
            <div className="mb-10 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5">
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Note:</strong> This Privacy Policy is provided for informational purposes and represents our genuine commitment to protecting your data. It is not a substitute for professional legal advice. We encourage you to consult a qualified attorney in your jurisdiction if you have specific legal questions.
              </p>
            </div>

            <div className="space-y-12">
              {/* 1. Overview */}
              <Section id="overview" title="1. Overview">
                <p>
                  {COMPANY_NAME} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is an employee pulse survey platform operated from {COMPANY_JURISDICTION}. We take privacy seriously — not because a law says we must, but because our entire product depends on employees trusting that their responses are private.
                </p>
                <p>
                  This Privacy Policy explains what personal data we collect, why we collect it, how we protect it, and what rights you have over it. It applies to:
                </p>
                <Ul items={[
                  "Administrators and company representatives who sign up for and manage a PrimePulseQ workspace (\"Admins\").",
                  "Employees who receive survey links and submit responses (\"Respondents\").",
                  "Visitors to our marketing website at primepulseq.com.",
                ]} />
                <p>
                  When we say &ldquo;you,&rdquo; we may mean any of the above depending on context. Where a distinction matters, we will be explicit.
                </p>
              </Section>

              {/* 2. Data We Collect */}
              <Section id="data-we-collect" title="2. Data We Collect">
                <SubSection title="2.1 Account and Admin Data">
                  <p>When you create a workspace or manage a subscription, we collect:</p>
                  <Ul items={[
                    "Full name and work email address of the account holder.",
                    "Company name and, optionally, company website.",
                    "A workspace slug (URL identifier) chosen by you.",
                    "Password (stored as a one-way cryptographic hash — we never see it in plain text).",
                    "Billing information: your subscription plan and payment method details. Card numbers are handled exclusively by Paddle; we store only the last four digits and expiry date for display purposes.",
                    "Communications you send us: support emails, feedback, or any other correspondence.",
                  ]} />
                </SubSection>

                <SubSection title="2.2 Employee Roster Data">
                  <p>To distribute surveys, Admins provide us with a list of employee email addresses. This data:</p>
                  <Ul items={[
                    "Is uploaded by the Admin, not collected from employees directly.",
                    "Is used solely to send survey invitation links.",
                    "Is never shared with, sold to, or used by third parties for marketing purposes.",
                    "Is deleted when the Admin removes an employee from their roster or deletes their workspace.",
                  ]} />
                </SubSection>

                <SubSection title="2.3 Survey Response Data">
                  <p>When employees submit survey responses, we record:</p>
                  <Ul items={[
                    "The answers themselves (numerical ratings, yes/no, multiple choice, and free-text responses).",
                    "Timestamp of submission.",
                    "Which survey the response belongs to.",
                  ]} />
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    We do not record the respondent&apos;s name, email address, or any identifier that links a specific response to a specific employee. See Section 3 for our full anonymity commitment.
                  </p>
                </SubSection>

                <SubSection title="2.4 Usage and Technical Data">
                  <p>We automatically collect standard technical information when you use our service:</p>
                  <Ul items={[
                    "IP address (used to detect abuse and for geographic analytics; not linked to survey responses).",
                    "Browser type and version.",
                    "Pages visited and actions taken within the dashboard.",
                    "Session duration and feature usage patterns (used to improve the product).",
                    "Error logs and crash reports.",
                  ]} />
                </SubSection>

                <SubSection title="2.5 Data We Do Not Collect">
                  <p>We do not collect, and have no interest in collecting:</p>
                  <Ul items={[
                    "Sensitive personal data such as race, religion, health status, sexual orientation, or political views.",
                    "Government ID numbers, social security numbers, or financial account details.",
                    "Any data from children under 16.",
                  ]} />
                </SubSection>
              </Section>

              {/* 3. Anonymity */}
              <Section id="anonymity" title="3. Survey Anonymity — Our Core Commitment">
                <p>
                  The foundational promise of PrimePulseQ is that survey responses are genuinely anonymous. Here is exactly how we enforce that:
                </p>
                <SubSection title="How anonymity works technically">
                  <Ul items={[
                    "Each employee receives a unique survey link. That link confirms the employee is eligible to respond — it does not carry their identity into the response itself.",
                    "When a response is submitted, we record the answers and a submission timestamp. The link token used to access the survey is discarded. No column in our responses database links back to an email address or employee ID.",
                    "Admins can see aggregated data (e.g., \"14 out of 20 employees responded\") and individual free-text responses, but they cannot see who wrote what.",
                    "Even our own engineers cannot run a query that says \"show me Sarah's answers\" because that mapping does not exist in the database.",
                  ]} />
                </SubSection>
                <SubSection title="Minimum response threshold">
                  <p>
                    To further protect anonymity, we do not display question-level results to Admins until a minimum number of responses have been received (currently five responses per question). This prevents a small team Admin from inferring who said what by process of elimination.
                  </p>
                </SubSection>
                <SubSection title="What we cannot promise">
                  <p>
                    While we remove all technical linkage between responses and identities, we cannot control how Admins interpret free-text responses. If an employee writes something that reveals their identity (e.g., &ldquo;As the only left-handed engineer on the team...&rdquo;), an Admin may be able to infer the author. Employees should keep this in mind when writing open-ended responses.
                  </p>
                </SubSection>
              </Section>

              {/* 4. How we use data */}
              <Section id="how-we-use" title="4. How We Use Your Data">
                <p>We use the data we collect for the following purposes, and only these purposes:</p>
                <Ul items={[
                  "To provide and operate the PrimePulseQ service.",
                  "To send survey invitations to employees on behalf of Admins.",
                  "To process payments and manage subscriptions.",
                  "To send transactional emails (password resets, billing confirmations, survey results summaries).",
                  "To respond to support requests.",
                  "To detect and prevent fraud, abuse, or security threats.",
                  "To improve the product based on aggregated, anonymized usage patterns.",
                  "To comply with legal obligations.",
                ]} />
                <p>
                  We do not sell your data. We do not use your data to serve you third-party advertising. We do not build profiles on your employees beyond what is necessary to deliver the service.
                </p>
              </Section>

              {/* 5. Third parties */}
              <Section id="third-parties" title="5. Third-Party Services">
                <p>
                  We use a small number of trusted third-party services to operate PrimePulseQ. Each receives only the data necessary for its function.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10">
                        <th className="text-left py-3 pr-4 font-semibold text-gray-700 dark:text-gray-200">Provider</th>
                        <th className="text-left py-3 pr-4 font-semibold text-gray-700 dark:text-gray-200">Purpose</th>
                        <th className="text-left py-3 font-semibold text-gray-700 dark:text-gray-200">Data shared</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/8">
                      {[
                        { provider: "Paddle", purpose: "Payment processing and merchant of record", data: "Billing name, email, card details (handled directly by Paddle — we never see full card numbers). Paddle acts as the merchant of record for all transactions." },
                        { provider: "Resend", purpose: "Transactional email delivery", data: "Employee email addresses (for survey delivery), Admin email (for notifications and billing)" },
                        { provider: "Amazon Web Services (AWS)", purpose: "Cloud hosting and infrastructure", data: "All application data is stored on AWS servers in encrypted form; AWS does not independently access or process your data" },
                        { provider: "Supabase", purpose: "Database and authentication", data: "All structured data (accounts, surveys, responses, integration credentials); Supabase is built on AWS with SOC 2 Type II certification. Data is encrypted at rest (AES-256) and in transit (TLS 1.3). Integration webhook URLs (Slack, Teams) are stored in the database and protected by row-level security — no other workspace can access your credentials." },
                      ].map((row) => (
                        <tr key={row.provider}>
                          <td className="py-3 pr-4 font-medium text-gray-800 dark:text-gray-200 align-top">{row.provider}</td>
                          <td className="py-3 pr-4 text-gray-600 dark:text-gray-400 align-top">{row.purpose}</td>
                          <td className="py-3 text-gray-600 dark:text-gray-400 align-top">{row.data}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p>
                  All third-party providers are contractually bound to use data only as directed by us and to maintain appropriate security standards. We do not use analytics platforms (e.g., Google Analytics) that track individual user behavior across the web.
                </p>
              </Section>

              {/* 6. GDPR */}
              <Section id="gdpr" title="6. GDPR Rights — EU and UK Customers">
                <p>
                  If you are located in the European Union or the United Kingdom, the General Data Protection Regulation (GDPR) and UK GDPR give you specific rights regarding your personal data.
                </p>

                <SubSection title="Our lawful basis for processing">
                  <Ul items={[
                    "Contract performance — processing your account data to deliver the service you subscribed to.",
                    "Legitimate interests — security monitoring, fraud prevention, and product improvement using anonymized data.",
                    "Consent — marketing communications, which you can withdraw at any time.",
                    "Legal obligation — retaining billing records as required by applicable law.",
                  ]} />
                </SubSection>

                <SubSection title="Your rights under GDPR">
                  <Ul items={[
                    "Right to access — request a copy of the personal data we hold about you.",
                    "Right to rectification — ask us to correct inaccurate data.",
                    "Right to erasure (\"right to be forgotten\") — ask us to delete your personal data, subject to legal retention requirements.",
                    "Right to restrict processing — ask us to pause processing while a dispute is resolved.",
                    "Right to data portability — receive your data in a machine-readable format.",
                    "Right to object — object to processing based on legitimate interests.",
                    "Rights related to automated decision-making — we do not use fully automated decision-making that produces legal or similarly significant effects on you.",
                  ]} />
                </SubSection>

                <SubSection title="How to exercise your rights">
                  <p>
                    Email us at <strong>{CONTACT_EMAIL}</strong> with your request. We will respond within 30 days. We may need to verify your identity before processing the request.
                  </p>
                </SubSection>

                <SubSection title="Data transfers outside the EU/UK">
                  <p>
                    Our infrastructure (AWS, Supabase) may store data in the United States and other countries. We rely on Standard Contractual Clauses (SCCs) as the legal mechanism for transferring personal data from the EU/UK to these providers, all of whom have entered into Data Processing Agreements with us.
                  </p>
                </SubSection>

                <SubSection title="Right to lodge a complaint">
                  <p>
                    You have the right to lodge a complaint with your local supervisory authority (e.g., the ICO in the UK, your national DPA in the EU). We hope you will contact us first so we can resolve any concern directly.
                  </p>
                </SubSection>
              </Section>

              {/* 7. CCPA */}
              <Section id="ccpa" title="7. CCPA Rights — California Residents">
                <p>
                  If you are a California resident, the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA) provide you with specific rights regarding your personal information.
                </p>

                <SubSection title="Your rights under CCPA/CPRA">
                  <Ul items={[
                    "Right to know — request disclosure of the categories and specific pieces of personal information we have collected about you in the past 12 months.",
                    "Right to delete — request deletion of your personal information, subject to certain exceptions.",
                    "Right to correct — request correction of inaccurate personal information.",
                    "Right to opt-out of sale or sharing — we do not sell or share personal information for cross-context behavioral advertising, so this right is not applicable in practice.",
                    "Right to non-discrimination — we will not discriminate against you for exercising any CCPA right.",
                    "Right to limit use of sensitive personal information — we do not collect sensitive personal information as defined under CPRA.",
                  ]} />
                </SubSection>

                <SubSection title="Categories of personal information collected">
                  <p>In the past 12 months we have collected: identifiers (name, email), commercial information (subscription details), internet activity (usage logs), and professional information (company name, role). See Section 2 for full details.</p>
                </SubSection>

                <SubSection title="How to submit a request">
                  <p>
                    Email <strong>{CONTACT_EMAIL}</strong> with &ldquo;CCPA Request&rdquo; in the subject line. We will verify your identity and respond within 45 days, with a possible 45-day extension if necessary.
                  </p>
                </SubSection>
              </Section>

              {/* 8. Data Retention */}
              <Section id="retention" title="8. Data Retention and Deletion">
                <SubSection title="While your account is active">
                  <p>We retain all data necessary to provide the service: account information, employee roster, survey definitions, and response data.</p>
                </SubSection>

                <SubSection title="When you cancel your subscription">
                  <Ul items={[
                    "Your workspace data (surveys, responses, employee list) is retained for 30 days after cancellation so you can export it or reactivate.",
                    "After 30 days, all workspace data is permanently deleted from our production systems.",
                    "Backup copies are deleted within 90 days.",
                  ]} />
                </SubSection>

                <SubSection title="Billing records">
                  <p>We retain invoices and billing records for 7 years as required by accounting and tax laws, even after account deletion.</p>
                </SubSection>

                <SubSection title="Requesting early deletion">
                  <p>
                    You can request deletion of your account and all associated data at any time by emailing <strong>{CONTACT_EMAIL}</strong> or using the &ldquo;Delete workspace&rdquo; option in Settings. Deletion is permanent and irreversible. We will confirm completion within 10 business days.
                  </p>
                </SubSection>

                <SubSection title="Employee respondent data">
                  <p>
                    Because survey responses are anonymous (see Section 3), there is no individual employee record to delete. If an employee&apos;s email address appears in an Admin&apos;s roster and that Admin requests deletion or removes the employee, the email address is removed from our systems.
                  </p>
                </SubSection>
              </Section>

              {/* 9. Cookies */}
              <Section id="cookies" title="9. Cookie Policy">
                <p>
                  We use a minimal number of cookies — only what is necessary to make the service work. We do not use advertising cookies or sell cookie data.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10">
                        <th className="text-left py-3 pr-4 font-semibold text-gray-700 dark:text-gray-200">Cookie</th>
                        <th className="text-left py-3 pr-4 font-semibold text-gray-700 dark:text-gray-200">Type</th>
                        <th className="text-left py-3 font-semibold text-gray-700 dark:text-gray-200">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/8">
                      {[
                        { name: "sb-auth-token", type: "Strictly necessary", purpose: "Keeps you logged in to your dashboard session. Expires when you log out or after 7 days of inactivity." },
                        { name: "theme", type: "Functional / preference", purpose: "Remembers your light/dark mode preference. Persists for 1 year." },
                        { name: "Paddle cookies", type: "Strictly necessary (payment flows)", purpose: "Used by Paddle to prevent fraud during checkout. Paddle's own Privacy Policy applies." },
                      ].map((row) => (
                        <tr key={row.name}>
                          <td className="py-3 pr-4 font-mono text-xs text-gray-800 dark:text-gray-200 align-top">{row.name}</td>
                          <td className="py-3 pr-4 text-gray-600 dark:text-gray-400 align-top">{row.type}</td>
                          <td className="py-3 text-gray-600 dark:text-gray-400 align-top">{row.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p>
                  We do not use tracking cookies, third-party analytics (e.g., Google Analytics), or retargeting pixels. You can disable all cookies in your browser settings; however, strictly necessary cookies are required for login to work.
                </p>
              </Section>

              {/* 10. International transfers */}
              <Section id="international" title="10. International Data Transfers">
                <p>
                  {COMPANY_NAME} is operated from {COMPANY_JURISDICTION}. When you use our service, your data may be transferred to and processed in the United States and other countries where our infrastructure providers (AWS, Supabase, Paddle, SendGrid) operate.
                </p>
                <p>
                  These countries may have different data protection laws than your country. We take the following steps to ensure your data remains protected:
                </p>
                <Ul items={[
                  "All data is encrypted in transit (TLS 1.2+) and at rest (AES-256).",
                  "We use Standard Contractual Clauses (SCCs) where required for EU/UK transfers.",
                  "We only work with sub-processors who have robust security certifications (SOC 2, ISO 27001).",
                ]} />
              </Section>

              {/* 11. Children */}
              <Section id="children" title="11. Children's Privacy">
                <p>
                  PrimePulseQ is a business-to-business workplace tool. We do not knowingly collect personal data from anyone under the age of 16. If you believe a minor has provided us with personal data, please contact us at <strong>{CONTACT_EMAIL}</strong> and we will delete it promptly.
                </p>
              </Section>

              {/* 12. Changes */}
              <Section id="changes" title="12. Changes to This Policy">
                <p>
                  We may update this Privacy Policy from time to time. When we do, we will update the &ldquo;Last updated&rdquo; date at the top and, for material changes, notify active Admins by email at least 14 days before the change takes effect. Continued use of the service after a change constitutes acceptance of the updated policy.
                </p>
              </Section>

              {/* 13. Contact */}
              <Section id="contact" title="13. Contact Us">
                <p>For privacy-related questions, data deletion requests, or to exercise any of your rights:</p>
                <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm space-y-1">
                  <p><strong className="text-gray-800 dark:text-gray-200">Email:</strong> {CONTACT_EMAIL}</p>
                  <p><strong className="text-gray-800 dark:text-gray-200">Company:</strong> {COMPANY_NAME}</p>
                  <p><strong className="text-gray-800 dark:text-gray-200">Jurisdiction:</strong> {COMPANY_JURISDICTION}</p>
                </div>
                <p>We aim to respond to all privacy requests within 10 business days.</p>
              </Section>
            </div>

            {/* Footer nav */}
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <p className="text-xs text-gray-400">© 2026 {COMPANY_NAME}. All rights reserved.</p>
              <div className="flex gap-4 text-sm">
                <Link href="/terms" className="text-violet-600 dark:text-violet-400 hover:underline">Terms of Service</Link>
                <Link href="/pricing" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Pricing</Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
