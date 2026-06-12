import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/public-nav";

const EFFECTIVE_DATE = "May 16, 2026";
const LAST_UPDATED = "May 16, 2026";
const CONTACT_EMAIL = "contact@primepulseq.com";
const COMPANY_NAME = "PrimePulseQ";
const COMPANY_JURISDICTION = "Pakistan";
const GOVERNING_LAW = "the laws of the Islamic Republic of Pakistan";

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
  { id: "overview", label: "Overview & Acceptance" },
  { id: "definitions", label: "Definitions" },
  { id: "account", label: "Account Registration" },
  { id: "subscription", label: "Subscriptions & Billing" },
  { id: "cancellation", label: "Cancellation & Refunds" },
  { id: "acceptable-use", label: "Acceptable Use Policy" },
  { id: "data-and-privacy", label: "Data Responsibility" },
  { id: "ip", label: "Intellectual Property" },
  { id: "availability", label: "Service Availability" },
  { id: "liability", label: "Limitation of Liability" },
  { id: "indemnity", label: "Indemnification" },
  { id: "termination", label: "Account Termination" },
  { id: "disputes", label: "Disputes & Governing Law" },
  { id: "general", label: "General Provisions" },
  { id: "contact", label: "Contact" },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
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
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Terms of Service</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Last updated: {LAST_UPDATED}
              </p>
            </div>

            {/* Disclaimer banner */}
            <div className="mb-10 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5">
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Important notice:</strong> These Terms of Service are written to be clear and fair. However, they do not constitute legal advice and should not be relied upon as such. If you are entering into this agreement on behalf of a company, you should have your legal counsel review these terms. Laws vary by jurisdiction and your specific circumstances may require additional legal considerations.
              </p>
            </div>

            <div className="space-y-12">
              {/* 1. Overview */}
              <Section id="overview" title="1. Overview and Acceptance of Terms">
                <p>
                  These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;Customer,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;) and {COMPANY_NAME} (&ldquo;{COMPANY_NAME},&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) governing your access to and use of the {COMPANY_NAME} employee pulse survey platform, including all related web applications, APIs, and services (collectively, the &ldquo;Service&rdquo;).
                </p>
                <p>
                  By creating an account, clicking &ldquo;I agree,&rdquo; or otherwise accessing or using the Service, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you are accepting these Terms on behalf of a company or other legal entity, you represent that you have the authority to bind that entity.
                </p>
                <p>
                  <strong className="text-gray-800 dark:text-gray-200">If you do not agree to these Terms, do not use the Service.</strong>
                </p>
                <p>
                  We reserve the right to update these Terms at any time. We will provide at least 14 days&apos; notice of material changes via email. Continued use of the Service after a change takes effect constitutes acceptance of the new Terms.
                </p>
              </Section>

              {/* 2. Definitions */}
              <Section id="definitions" title="2. Definitions">
                <Ul items={[
                  "\"Admin\" means the individual or company that has registered for a PrimePulseQ workspace and manages surveys.",
                  "\"Respondent\" means an employee or individual who receives a survey link and submits a response.",
                  "\"Workspace\" means the Admin's organizational account and all data contained within it.",
                  "\"Subscription\" means a paid or trial plan that grants access to the Service.",
                  "\"Content\" means any data, text, or material submitted by you or your Respondents through the Service.",
                  "\"Confidential Information\" means non-public information that either party designates as confidential or that a reasonable person would understand to be confidential.",
                ]} />
              </Section>

              {/* 3. Account */}
              <Section id="account" title="3. Account Registration and Responsibilities">
                <SubSection title="Eligibility">
                  <p>You must be at least 18 years old and legally able to enter into a binding contract in your jurisdiction to use the Service. The Service is intended for business use only.</p>
                </SubSection>

                <SubSection title="Accurate information">
                  <p>You agree to provide accurate, current, and complete information during registration and to keep it updated. Using false or misleading identity information is prohibited.</p>
                </SubSection>

                <SubSection title="Account security">
                  <p>You are responsible for maintaining the security of your password and for all activity that occurs under your account. You must notify us immediately at <strong>{CONTACT_EMAIL}</strong> if you suspect unauthorized access. We are not liable for losses caused by unauthorized use of your account that results from your failure to keep credentials secure.</p>
                </SubSection>

                <SubSection title="One account per workspace">
                  <p>Each workspace is associated with one primary Admin account. You may invite additional team members to access the workspace under your subscription, subject to your plan limits.</p>
                </SubSection>
              </Section>

              {/* 4. Subscriptions */}
              <Section id="subscription" title="4. Subscriptions, Billing, and Payment">
                <SubSection title="Plans and pricing">
                  <p>
                    {COMPANY_NAME} offers subscription plans as described on the Pricing page. Current plans are Starter ($49/month, up to 100 employees), Growth ($149/month, up to 500 employees), and Enterprise ($499/month, unlimited employees). Prices are stated in US dollars and are subject to change with 30 days&apos; advance notice to existing subscribers.
                  </p>
                </SubSection>

                <SubSection title="Free trial">
                  <p>
                    New subscribers to the Growth plan receive seven (7) days free. The trial begins on the date of sign-up. At the end of the trial period, the Service will transition to a paid subscription unless you cancel before the trial ends. We will email a reminder 2 days before your trial expires.
                  </p>
                </SubSection>

                <SubSection title="Billing cycle">
                  <p>
                    Subscriptions are billed monthly in advance on the anniversary of your subscription start date. Billing is automatic and recurring via Paddle, our payment processor and merchant of record. By subscribing, you authorize us (via Paddle) to charge your payment method on a recurring basis until you cancel. Paddle handles all payment processing, tax remittance, and invoicing on our behalf.
                  </p>
                </SubSection>

                <SubSection title="Failed payments">
                  <p>
                    If a payment fails, we will retry up to three times over 7 days. If payment remains outstanding after 7 days, your account will be downgraded to read-only access. You will not lose your data during this period. Full access is restored immediately upon successful payment. After 30 days of non-payment, the account may be terminated and data deleted as described in Section 12.
                  </p>
                </SubSection>

                <SubSection title="Upgrades and downgrades">
                  <p>
                    You may upgrade your plan at any time; the prorated difference is billed immediately. You may downgrade at the end of your current billing cycle. Downgrades take effect on the next billing date; you retain access to your current plan features until then.
                  </p>
                </SubSection>

                <SubSection title="Taxes">
                  <p>
                    Our listed prices do not include taxes. You are responsible for any applicable taxes (including VAT, GST, or sales tax) required by your jurisdiction. For EU customers with a valid VAT number, VAT reverse charge may apply; enter your VAT ID in your billing settings.
                  </p>
                </SubSection>
              </Section>

              {/* 5. Cancellation and Refunds */}
              <Section id="cancellation" title="5. Cancellation and Refund Policy">
                <SubSection title="How to cancel">
                  <p>
                    You may cancel your subscription at any time from Settings → Billing, or by emailing <strong>{CONTACT_EMAIL}</strong>. Cancellation takes effect at the end of your current billing period. You will retain full access to the Service until that date.
                  </p>
                </SubSection>

                <SubSection title="No refunds — general policy">
                  <p>
                    All subscription fees are non-refundable. When you cancel, you are cancelling future billing — you will not receive a refund for any portion of the current billing period already paid. This applies equally to monthly and annual plans.
                  </p>
                </SubSection>

                <SubSection title="Exceptions — when we will issue a refund">
                  <p>We will issue a full or prorated refund in the following limited circumstances:</p>
                  <Ul items={[
                    "You were charged after successfully cancelling, due to a billing system error on our end.",
                    "You were charged for a plan tier you did not actually activate or use.",
                    "The Service experienced a verified outage of more than 72 consecutive hours within the billing period, making the Service substantially unusable (prorated refund for downtime period only).",
                    "We terminate your account without cause (see Section 12).",
                  ]} />
                  <p>Refund requests must be submitted within 30 days of the disputed charge to <strong>{CONTACT_EMAIL}</strong>. Approved refunds are processed to the original payment method within 10 business days.</p>
                </SubSection>

                <SubSection title="Data after cancellation">
                  <p>Your data is retained for 30 days post-cancellation and then permanently deleted, as described in the Privacy Policy. Export your data before cancelling if you need to keep it.</p>
                </SubSection>
              </Section>

              {/* 6. Acceptable Use */}
              <Section id="acceptable-use" title="6. Acceptable Use Policy">
                <p>You may use the Service only for lawful purposes and in accordance with these Terms. The following uses are strictly prohibited:</p>

                <SubSection title="Illegal and harmful conduct">
                  <Ul items={[
                    "Using the Service for any purpose that violates applicable local, national, or international law or regulation.",
                    "Discriminating against employees based on race, gender, religion, age, disability, national origin, or any other protected characteristic through the design or use of surveys.",
                    "Using survey data to retaliate against or identify employees who have responded, or attempting to de-anonymize responses by any means.",
                    "Violating any applicable employment law, labor law, or workplace privacy regulation in your jurisdiction.",
                  ]} />
                </SubSection>

                <SubSection title="Technical misuse">
                  <Ul items={[
                    "Attempting to reverse engineer, decompile, disassemble, or otherwise derive the source code of the Service.",
                    "Introducing viruses, malware, or other malicious code into the Service.",
                    "Using automated tools (scrapers, bots, crawlers) to access the Service beyond authorized API usage.",
                    "Attempting to gain unauthorized access to any part of the Service, other accounts, or our infrastructure.",
                    "Overloading or disrupting the Service or connected systems (denial-of-service attacks).",
                  ]} />
                </SubSection>

                <SubSection title="Content restrictions">
                  <Ul items={[
                    "Uploading or transmitting content that is defamatory, harassing, sexually explicit, or otherwise objectionable.",
                    "Impersonating another person or organization, or misrepresenting your affiliation.",
                    "Using the survey distribution feature to send unsolicited commercial messages (spam).",
                  ]} />
                </SubSection>

                <p>
                  We reserve the right to investigate suspected violations and to suspend or terminate accounts that breach this policy, with or without notice depending on severity.
                </p>
              </Section>

              {/* 7. Data and Privacy */}
              <Section id="data-and-privacy" title="7. Data Responsibility and Survey Use">
                <SubSection title="Your responsibility as data controller">
                  <p>
                    For the purposes of applicable data protection laws (including GDPR), you (the Admin) are the &ldquo;data controller&rdquo; for the employee data you upload and the survey responses collected through your workspace. {COMPANY_NAME} acts as a &ldquo;data processor&rdquo; on your behalf. You are responsible for:
                  </p>
                  <Ul items={[
                    "Having a lawful basis to collect and process your employees' survey responses.",
                    "Informing your employees about the survey, its purpose, and that responses are anonymous.",
                    "Complying with applicable employment laws, privacy laws, and workplace regulations in your jurisdiction when conducting surveys.",
                    "Not using the Service or survey data in ways that harm your employees.",
                  ]} />
                </SubSection>

                <SubSection title="Our role as data processor">
                  <p>
                    We process employee data only as directed by you and as described in our Privacy Policy. We do not independently analyze, sell, or repurpose your survey data for our own commercial benefit.
                  </p>
                </SubSection>

                <SubSection title="No liability for internal use of survey data">
                  <p>
                    <strong className="text-gray-800 dark:text-gray-200">{COMPANY_NAME} is not responsible for any decisions, actions, or consequences that result from how you, your company, or your management team interpret and act upon survey data.</strong> Survey results are informational tools. Any employment decisions, policy changes, or internal actions taken based on survey data are made at your sole discretion and are your sole responsibility. We expressly disclaim all liability for business decisions made using data from the Service.
                  </p>
                </SubSection>

                <SubSection title="Data Processing Agreement (DPA)">
                  <p>
                    A Data Processing Agreement (DPA) is available to all customers who require one for GDPR or other regulatory compliance — this is not limited to Enterprise plans. Under GDPR Article 28, a DPA is required for any controller-processor relationship where personal data is processed on your behalf. To request a DPA, email <strong>{CONTACT_EMAIL}</strong> with &ldquo;DPA Request&rdquo; in the subject line. We will respond within 5 business days.
                  </p>
                </SubSection>
              </Section>

              {/* 8. IP */}
              <Section id="ip" title="8. Intellectual Property">
                <SubSection title="Our property">
                  <p>
                    The Service, including all software, design, trademarks, logos, and content created by {COMPANY_NAME}, is our exclusive intellectual property. These Terms do not transfer any ownership rights to you. You receive a limited, non-exclusive, non-transferable, revocable license to use the Service during your active subscription solely for your internal business purposes.
                  </p>
                </SubSection>

                <SubSection title="Your content">
                  <p>
                    You retain ownership of the survey content you create and the response data generated within your workspace. By using the Service, you grant us a limited license to process and store your content solely to provide the Service to you.
                  </p>
                </SubSection>

                <SubSection title="Feedback">
                  <p>
                    If you submit feedback, ideas, or suggestions about the Service, you grant us a perpetual, irrevocable, royalty-free right to use that feedback for any purpose, including improving the Service. We will not publicly attribute feedback to you without your consent.
                  </p>
                </SubSection>
              </Section>

              {/* 9. Availability */}
              <Section id="availability" title="9. Service Availability and Support">
                <SubSection title="Uptime target">
                  <p>
                    We aim for 99.5% monthly uptime, excluding scheduled maintenance. We do not guarantee uninterrupted access. Scheduled maintenance will be announced at least 24 hours in advance via email or in-app notification.
                  </p>
                </SubSection>

                <SubSection title="No SLA for Starter/Growth">
                  <p>
                    A formal Service Level Agreement (SLA) with financial remedies for downtime is available on Enterprise plans only. Starter and Growth plans receive best-effort uptime without SLA commitments.
                  </p>
                </SubSection>

                <SubSection title="Support">
                  <p>All plans receive email support at <strong>{CONTACT_EMAIL}</strong>. We aim to respond to support requests within 2 business days (Starter/Growth) or 1 business day (Enterprise). Priority support and dedicated onboarding are included on Enterprise plans.</p>
                </SubSection>

                <SubSection title="Service modifications">
                  <p>
                    We may add, change, or remove features of the Service at any time. For material removals that affect core functionality, we will provide at least 30 days&apos; advance notice.
                  </p>
                </SubSection>
              </Section>

              {/* 10. Liability */}
              <Section id="liability" title="10. Limitation of Liability">
                <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3">
                  <SubSection title="Disclaimer of warranties">
                    <p>
                      THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, {COMPANY_NAME.toUpperCase()} DISCLAIMS ALL IMPLIED WARRANTIES, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE, UNINTERRUPTED, SECURE, OR THAT RESULTS OBTAINED FROM THE SERVICE WILL BE ACCURATE OR RELIABLE.
                    </p>
                  </SubSection>

                  <SubSection title="Cap on liability">
                    <p>
                      TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {COMPANY_NAME.toUpperCase()}&apos;S TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE — WHETHER IN CONTRACT, TORT, STRICT LIABILITY, OR ANY OTHER LEGAL THEORY — WILL NOT EXCEED THE GREATER OF (A) THE TOTAL FEES YOU PAID TO US IN THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED US DOLLARS ($100).
                    </p>
                  </SubSection>

                  <SubSection title="Exclusion of consequential damages">
                    <p>
                      IN NO EVENT WILL {COMPANY_NAME.toUpperCase()} BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOSS OF DATA, LOSS OF GOODWILL, BUSINESS INTERRUPTION, OR COST OF SUBSTITUTE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                    </p>
                  </SubSection>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                  Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability for consequential damages. In such jurisdictions, our liability will be limited to the maximum extent permitted by law.
                </p>
              </Section>

              {/* 11. Indemnity */}
              <Section id="indemnity" title="11. Indemnification">
                <p>
                  You agree to defend, indemnify, and hold harmless {COMPANY_NAME} and its officers, employees, and agents from and against any claims, liabilities, damages, judgments, awards, losses, costs, or expenses (including reasonable legal fees) arising out of or relating to:
                </p>
                <Ul items={[
                  "Your use of the Service in violation of these Terms.",
                  "Your violation of any applicable law or regulation, including employment and privacy laws.",
                  "Any claim by your employees arising from your use of the Service or your internal use of survey data.",
                  "Any claim that your Content infringes a third party's intellectual property or privacy rights.",
                  "Your negligent or wrongful acts or omissions.",
                ]} />
              </Section>

              {/* 12. Termination */}
              <Section id="termination" title="12. Account Termination">
                <SubSection title="Termination by you">
                  <p>You may cancel and close your account at any time as described in Section 5. Upon cancellation, access ends at the close of the current billing period.</p>
                </SubSection>

                <SubSection title="Termination by us — for cause">
                  <p>We may suspend or terminate your account immediately, without refund, if:</p>
                  <Ul items={[
                    "You materially breach these Terms and fail to cure the breach within 7 days of written notice (or immediately if the breach is incurable).",
                    "You use the Service in a way that violates the Acceptable Use Policy.",
                    "You engage in fraudulent activity, including payment fraud or identity fraud.",
                    "You attempt to de-anonymize survey responses or use the Service to harm your employees.",
                    "Continued provision of the Service would expose us to legal liability or regulatory action.",
                    "Your account remains unpaid for more than 30 days after the due date.",
                  ]} />
                </SubSection>

                <SubSection title="Termination by us — without cause">
                  <p>
                    We reserve the right to terminate any account without cause upon 30 days&apos; written notice. In this case, we will provide a prorated refund for the unused portion of your current billing period and will give you access to export your data during the notice period.
                  </p>
                </SubSection>

                <SubSection title="Effect of termination">
                  <p>
                    Upon termination: your right to access the Service ceases immediately (or at the end of the notice period); we will delete your workspace data within 30 days as described in the Privacy Policy; billing records are retained as required by law; and all provisions of these Terms that by their nature should survive termination (including Sections 7, 8, 10, 11, 13) will survive.
                  </p>
                </SubSection>
              </Section>

              {/* 13. Disputes */}
              <Section id="disputes" title="13. Disputes, Governing Law, and Jurisdiction">
                <SubSection title="Governing law">
                  <p>
                    These Terms are governed by and construed in accordance with {GOVERNING_LAW}, without regard to its conflict of law principles. We acknowledge that many of our customers are located in the US, UK, and EU, and we strive to operate in a manner compliant with the laws of those regions as described elsewhere in these Terms and in our Privacy Policy. However, the governing law for the contract between you and {COMPANY_NAME} is Pakistani law.
                  </p>
                </SubSection>

                <SubSection title="Informal resolution first">
                  <p>
                    Before initiating formal legal proceedings, you agree to first contact us at <strong>{CONTACT_EMAIL}</strong> and allow at least 30 days for us to attempt good-faith resolution of the dispute. Many issues can be resolved without litigation.
                  </p>
                </SubSection>

                <SubSection title="Jurisdiction">
                  <p>
                    If informal resolution fails, both parties submit to the exclusive jurisdiction of the courts located in {COMPANY_JURISDICTION} for the resolution of any dispute arising under these Terms. If you are an EU or UK consumer, you may also have the right to use local courts or Alternative Dispute Resolution (ADR) mechanisms available in your jurisdiction, and nothing in these Terms limits that right.
                  </p>
                </SubSection>

                <SubSection title="International compliance acknowledgment">
                  <p>
                    While the governing law is {COMPANY_JURISDICTION}n law, we acknowledge our obligations under GDPR (for EU/UK customers), CCPA (for California residents), and other applicable laws. We will cooperate with requests from data protection authorities and will not use choice of law provisions to evade our data protection obligations.
                  </p>
                </SubSection>

                <SubSection title="Class action waiver">
                  <p>
                    To the extent permitted by applicable law, both parties waive the right to participate in a class action lawsuit or class-wide arbitration related to these Terms or the Service.
                  </p>
                </SubSection>
              </Section>

              {/* 14. General */}
              <Section id="general" title="14. General Provisions">
                <SubSection title="Entire agreement">
                  <p>These Terms, together with our Privacy Policy and any Data Processing Agreement, constitute the entire agreement between you and {COMPANY_NAME} regarding the Service and supersede all prior agreements.</p>
                </SubSection>

                <SubSection title="Severability">
                  <p>If any provision of these Terms is found to be invalid or unenforceable, that provision will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions will continue in full force and effect.</p>
                </SubSection>

                <SubSection title="Waiver">
                  <p>Our failure to enforce any right or provision does not constitute a waiver of that right. Any waiver must be in writing and signed by us to be effective.</p>
                </SubSection>

                <SubSection title="Assignment">
                  <p>You may not assign or transfer your rights under these Terms without our prior written consent. We may assign our rights and obligations without restriction, including in connection with a merger, acquisition, or sale of assets, provided we notify you within 30 days.</p>
                </SubSection>

                <SubSection title="Force majeure">
                  <p>Neither party will be liable for delays or failures in performance caused by events outside reasonable control, including natural disasters, war, government actions, internet outages, or other force majeure events. Obligations resume when the event ends.</p>
                </SubSection>

                <SubSection title="Notices">
                  <p>We will provide notices to you via email to the address associated with your account. Legal notices to us should be sent to <strong>{CONTACT_EMAIL}</strong>.</p>
                </SubSection>

                <SubSection title="No agency">
                  <p>These Terms do not create any agency, partnership, joint venture, or employment relationship between the parties.</p>
                </SubSection>
              </Section>

              {/* 15. Contact */}
              <Section id="contact" title="15. Contact Us">
                <p>For questions about these Terms of Service:</p>
                <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm space-y-1">
                  <p><strong className="text-gray-800 dark:text-gray-200">Email:</strong> {CONTACT_EMAIL}</p>
                  <p><strong className="text-gray-800 dark:text-gray-200">Company:</strong> {COMPANY_NAME}</p>
                  <p><strong className="text-gray-800 dark:text-gray-200">Jurisdiction:</strong> {COMPANY_JURISDICTION}</p>
                </div>
                <p>We aim to respond to all legal inquiries within 10 business days.</p>
              </Section>
            </div>

            {/* Footer nav */}
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <p className="text-xs text-gray-400">© 2026 {COMPANY_NAME}. All rights reserved.</p>
              <div className="flex gap-4 text-sm">
                <Link href="/privacy" className="text-violet-600 dark:text-violet-400 hover:underline">Privacy Policy</Link>
                <Link href="/pricing" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Pricing</Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
