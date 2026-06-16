"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, Bell, Shield, CreditCard, Zap, CheckCircle2, Sun, ClipboardList, ExternalLink, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProfile, type Profile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { TierGate } from "@/components/tier-gate";
import { TIER_LABELS, canAccess, type Tier } from "@/lib/tiers";

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsInner />
    </Suspense>
  );
}

function SettingsInner() {
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const [company, setCompany] = useState({ name: "", slug: "", website: "", industry: "", headcountBand: "" });
  const [expiryDays, setExpiryDays] = useState<number>(7);
  const [retentionDays, setRetentionDays] = useState<string>(""); // "" = keep forever
  const [alertPct, setAlertPct] = useState<number>(50);
  const [minCohort, setMinCohort] = useState<number>(5);
  const [digestEnabled, setDigestEnabled] = useState<boolean>(true);
  const [sendDay, setSendDay] = useState<number>(1);
  const [sendHour, setSendHour] = useState<number>(8);
  const [timezone, setTimezone] = useState<string>("UTC");
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const NOTIF_KEY = "ppq_notification_prefs";
  const [notifications, setNotifications] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(NOTIF_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return { new_responses: true, weekly_summary: true, burnout_alerts: true, low_response_rate: false };
  });
  const [notifSaved, setNotifSaved] = useState(false);

  function updateNotif(key: string, value: boolean) {
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 1500);
  }
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [auditLogs, setAuditLogs] = useState<{ id: string; action: string; actor_email: string | null; resource_type: string | null; metadata: Record<string, unknown> | null; created_at: string }[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "company";
  const tier = profile?.subscription_tier ?? "free";
  const isOwner = profile?.is_owner ?? false;

  // Populate fields from profile once loaded
  useEffect(() => {
    if (profile) {
      setCompany({
        name: profile.company_name ?? "",
        slug: profile.company_slug ?? "",
        website: profile.company_website ?? "",
        industry: profile.industry ?? "",
        headcountBand: profile.headcount_band ?? "",
      });
      setExpiryDays(profile.survey_expiry_days ?? 7);
      setRetentionDays(profile.data_retention_days ? String(profile.data_retention_days) : "");
      setAlertPct(profile.response_rate_alert_pct ?? 50);
      setMinCohort(profile.min_cohort_display ?? 5);
      setDigestEnabled(profile.digest_emails_enabled ?? true);
      setSendDay(profile.send_day_of_week ?? 1);
      setSendHour(profile.send_hour ?? 8);
      setTimezone(profile.timezone ?? "UTC");
    }
  }, [profile]);

  async function savePrefs() {
    setPrefsSaving(true);
    await updateProfile({
      survey_expiry_days: expiryDays,
      data_retention_days: retentionDays ? Number(retentionDays) : null,
      response_rate_alert_pct: Math.min(100, Math.max(0, alertPct)),
      min_cohort_display: Math.min(20, Math.max(3, minCohort)),
      digest_emails_enabled: digestEnabled,
      send_day_of_week: sendDay,
      send_hour: sendHour,
      timezone: timezone || "UTC",
    });
    setPrefsSaving(false);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2500);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    const { error } = await updateProfile({
      company_name: company.name || null,
      company_slug: company.slug || null,
      company_website: company.website || null,
      industry: company.industry || null,
      headcount_band: company.headcountBand || null,
    });
    setSaving(false);
    if (error) {
      setSaveError(error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  if (profileLoading) {
    return <div className="p-8 flex items-center justify-center"><div className="text-gray-400 text-sm">Loading settings...</div></div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your workspace preferences</p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="mb-6 sm:mb-8 flex-wrap h-auto gap-1">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-3.5 w-3.5" /> Company
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-3.5 w-3.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Sun className="h-3.5 w-3.5" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-3.5 w-3.5" /> Billing
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Zap className="h-3.5 w-3.5" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2" onClick={async () => {
            if (auditLogs.length > 0) return;
            setAuditLoading(true);
            const supabase = createClient();
            const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
            setAuditLogs((data ?? []) as typeof auditLogs);
            setAuditLoading(false);
          }}>
            <ClipboardList className="h-3.5 w-3.5" /> Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Company */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company Profile</CardTitle>
              <CardDescription>This information is visible to your employees on survey pages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Company name</Label>
                <Input
                  value={company.name}
                  onChange={(e) => setCompany((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Workspace identifier <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input
                  placeholder="e.g. acme-corp"
                  value={company.slug}
                  onChange={(e) => setCompany((p) => ({ ...p, slug: e.target.value }))}
                />
                <p className="text-xs text-gray-400">Used to identify your workspace internally.</p>
              </div>
              <div className="space-y-2">
                <Label>Website <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input
                  value={company.website}
                  onChange={(e) => setCompany((p) => ({ ...p, website: e.target.value }))}
                  placeholder="https://"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select value={company.industry} onValueChange={(v) => setCompany((p) => ({ ...p, industry: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select industry…" /></SelectTrigger>
                    <SelectContent>
                      {["Technology","Healthcare","Finance","Retail","Manufacturing","Education","Hospitality","Professional Services","Non-profit","Other"].map((i) => (
                        <SelectItem key={i} value={i}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Company size</Label>
                  <Select value={company.headcountBand} onValueChange={(v) => setCompany((p) => ({ ...p, headcountBand: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select size…" /></SelectTrigger>
                    <SelectContent>
                      {["1-50","51-200","201-1000","1000+"].map((b) => (
                        <SelectItem key={b} value={b}>{b} employees</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-gray-400">Used to anonymously benchmark your scores against similar companies.</p>
              {saveError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
                  {saveError}
                </div>
              )}
              <div className="pt-2 flex items-center gap-3">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Saved
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <DangerZone companyName={company.name} />
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Email Notifications</CardTitle>
                  <CardDescription>Choose when you get notified by email.</CardDescription>
                </div>
                {notifSaved && (
                  <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-0">
              {[
                { key: "new_responses", label: "New survey responses", desc: "Get notified when employees submit responses." },
                { key: "weekly_summary", label: "Weekly engagement summary", desc: "A digest of your team's engagement every Monday." },
                { key: "burnout_alerts", label: "Burnout risk alerts", desc: "Immediate alert when burnout indicators spike." },
                { key: "low_response_rate", label: "Low response rate warning", desc: "Alert when response rate drops below 40%." },
              ].map((item, i) => (
                <div key={item.key}>
                  {i > 0 && <Separator className="my-4" />}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(v) => updateNotif(item.key, v)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Survey preferences</CardTitle>
              <CardDescription>Control how surveys behave for your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2 max-w-xs">
                <Label>Survey link expiry</Label>
                <Select value={String(expiryDays)} onValueChange={(v) => setExpiryDays(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3, 7, 14, 30].map((d) => (
                      <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  How long each employee&apos;s survey link stays valid after it&apos;s sent. Shorter for fast
                  teams, longer for async/remote teams who check email less often.
                </p>
              </div>

              <Separator />

              <div className="space-y-2 max-w-xs">
                <Label>Data retention</Label>
                <Select value={retentionDays || "forever"} onValueChange={(v) => setRetentionDays(v === "forever" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="forever">Keep forever</SelectItem>
                    {[30, 90, 180, 365].map((d) => (
                      <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  Automatically purge anonymous responses older than this. &ldquo;Keep forever&rdquo; never deletes.
                  Useful for GDPR / data-minimization requirements.
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                <div className="space-y-2">
                  <Label>Low response-rate alert (%)</Label>
                  <Input
                    type="number" min={0} max={100}
                    value={alertPct}
                    onChange={(e) => setAlertPct(Number(e.target.value))}
                  />
                  <p className="text-xs text-gray-400">Surveys closing below this rate get flagged.</p>
                </div>
                <div className="space-y-2">
                  <Label>Minimum responses to show results</Label>
                  <Input
                    type="number" min={3} max={20}
                    value={minCohort}
                    onChange={(e) => setMinCohort(Number(e.target.value))}
                  />
                  <p className="text-xs text-gray-400">Anonymity floor before results/open-text appear (3–20).</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Recurring survey send time</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg">
                  <Select value={String(sendDay)} onValueChange={(v) => setSendDay(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((d, i) => (
                        <SelectItem key={d} value={String(i)}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(sendHour)} onValueChange={(v) => setSendHour(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, h) => (
                        <SelectItem key={h} value={String(h)}>{String(h).padStart(2, "0")}:00</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["UTC","America/New_York","America/Chicago","America/Denver","America/Los_Angeles","Europe/London","Europe/Berlin","Europe/Madrid","Asia/Dubai","Asia/Karachi","Asia/Kolkata","Asia/Singapore","Asia/Tokyo","Australia/Sydney"].map((tz) => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-400">
                  Weekly/biweekly/monthly surveys go out on this day and hour in your timezone. Defaults to Monday 08:00 UTC.
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between max-w-md">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Digest emails</p>
                  <p className="text-xs text-gray-500 mt-0.5">Receive summary digest emails for your team.</p>
                </div>
                <Switch checked={digestEnabled} onCheckedChange={setDigestEnabled} />
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={savePrefs} disabled={prefsSaving}>
                  {prefsSaving ? "Saving…" : "Save preferences"}
                </Button>
                {prefsSaved && (
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <AuditLogCard />
          {isOwner && <CronHistoryCard />}
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing">
          <BillingTab tier={tier} isOwner={isOwner} profile={profile} />
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            <IntegrationCard
              icon="💬"
              name="Slack"
              desc="Post survey links and summaries to a Slack channel via Incoming Webhook."
              field="slack_webhook_url"
              placeholder="https://hooks.slack.com/services/..."
              helpUrl="https://api.slack.com/messaging/webhooks"
              helpText="Get a webhook URL"
              webhookType="slack"
              profile={profile}
              updateProfile={updateProfile}
              tier={tier}
              isOwner={isOwner}
              feature="slack_integration"
            />
            <IntegrationCard
              icon="🟦"
              name="Microsoft Teams"
              desc="Post survey links and summaries to a Teams channel via Incoming Webhook."
              field="teams_webhook_url"
              placeholder="https://xxx.webhook.office.com/webhookb2/..."
              helpUrl="https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook"
              helpText="Get a webhook URL"
              webhookType="teams"
              profile={profile}
              updateProfile={updateProfile}
              tier={tier}
              isOwner={isOwner}
              feature="teams_integration"
            />
          </div>
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Log</CardTitle>
              <CardDescription>All workspace actions for the last 100 events.</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <p className="text-sm text-gray-400 py-6 text-center">Loading audit log...</p>
              ) : auditLogs.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No activity recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/10">
                        <th className="text-left text-xs text-gray-400 font-medium py-2 pr-4">Action</th>
                        <th className="text-left text-xs text-gray-400 font-medium py-2 pr-4">Actor</th>
                        <th className="text-left text-xs text-gray-400 font-medium py-2 pr-4">Resource</th>
                        <th className="text-left text-xs text-gray-400 font-medium py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-50 dark:border-white/5 last:border-0">
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs bg-gray-100 dark:bg-white/8 px-1.5 py-0.5 rounded text-violet-700 dark:text-violet-300">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400 text-xs truncate max-w-[140px]">
                            {log.actor_email ?? "system"}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-500 text-xs">
                            {log.resource_type ?? "—"}
                          </td>
                          <td className="py-2.5 text-gray-400 text-xs whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Danger Zone ──────────────────────────────────────────────────────────────
function DangerZone({ companyName }: { companyName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const expected = companyName || "DELETE";

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/";
      } else {
        setError(data.error ?? "Failed to delete workspace.");
        setDeleting(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <Card className="mt-6 border-red-200 dark:border-red-500/20">
      <CardHeader>
        <CardTitle className="text-base text-red-600 dark:text-red-400">Danger Zone</CardTitle>
        <CardDescription>These actions are irreversible.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50/60 dark:bg-red-500/5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-medium text-red-700 dark:text-red-300 text-sm">Delete workspace</p>
              <p className="text-xs text-red-500/80 dark:text-red-400/70 mt-0.5">
                Permanently deletes all surveys, responses, and employee data — and your account.
              </p>
            </div>
            {!confirming && (
              <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
                Delete
              </Button>
            )}
          </div>

          {confirming && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-red-600 dark:text-red-400">
                Type <strong>{expected}</strong> to confirm. This cannot be undone.
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={expected}
                className="max-w-xs"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={confirmText !== expected || deleting}
                  onClick={handleDelete}
                  className="gap-2"
                >
                  {deleting && <Loader2 className="h-3 w-3 animate-spin" />}
                  {deleting ? "Deleting..." : "Permanently delete everything"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setConfirming(false); setConfirmText(""); setError(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Billing Tab ──────────────────────────────────────────────────────────────
const PLANS = [
  {
    tier: "starter" as const,
    name: "Starter",
    price: "$49",
    features: ["Up to 100 employees", "Weekly pulse surveys", "Basic analytics", "Email support"],
  },
  {
    tier: "growth" as const,
    name: "Growth",
    price: "$149",
    features: ["Up to 500 employees", "Slack & Teams integration", "Advanced analytics", "Burnout detection"],
  },
  {
    tier: "enterprise" as const,
    name: "Enterprise",
    price: "$499",
    features: ["Unlimited employees", "All Growth features", "Audit logs", "Priority support"],
  },
];

interface CronRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  surveys_sent: number;
  emails_attempted: number;
  emails_failed: number;
  errors: unknown;
}

function CronHistoryCard() {
  const [runs, setRuns] = useState<CronRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("cron_runs")
      .select("id, started_at, completed_at, surveys_sent, emails_attempted, emails_failed, errors")
      .order("started_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setRuns((data ?? []) as CronRun[]);
        setLoading(false);
      });
  }, []);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Cron history</CardTitle>
        <CardDescription>The last 10 scheduled-survey runs (owner only).</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : runs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No runs recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs text-gray-400">
                  <th className="py-2 pr-4 font-medium">When</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Surveys</th>
                  <th className="py-2 pr-4 font-medium">Emails</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => {
                  const failed = r.emails_failed > 0 || (Array.isArray(r.errors) && r.errors.length > 0);
                  return (
                    <tr key={r.id} className="border-b border-gray-50 dark:border-white/5 last:border-0">
                      <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">{formatDate(r.started_at)}</td>
                      <td className="py-2.5 pr-4">
                        {!r.completed_at ? (
                          <Badge variant="warning">Running</Badge>
                        ) : failed ? (
                          <Badge variant="destructive">{r.emails_failed} failed</Badge>
                        ) : (
                          <Badge variant="success">OK</Badge>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">{r.surveys_sent}</td>
                      <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">
                        {r.emails_attempted - r.emails_failed}/{r.emails_attempted}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AuditEntry {
  id: string;
  action: string;
  resource_type: string | null;
  actor_email: string | null;
  created_at: string;
}

function AuditLogCard() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("audit_logs")
      .select("id, action, resource_type, actor_email, created_at")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLogs((data ?? []) as AuditEntry[]);
        setLoading(false);
      });
  }, []);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Audit log</CardTitle>
        <CardDescription>The last 100 actions in your workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No activity recorded yet.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto border border-gray-100 dark:border-white/8 rounded-lg">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-white/5">
                <tr className="text-left text-xs text-gray-400">
                  <th className="py-2 px-3 font-medium">When</th>
                  <th className="py-2 px-3 font-medium">Action</th>
                  <th className="py-2 px-3 font-medium">Resource</th>
                  <th className="py-2 px-3 font-medium">Actor</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-gray-50 dark:border-white/5">
                    <td className="py-2 px-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(l.created_at)}</td>
                    <td className="py-2 px-3"><span className="font-mono text-xs bg-gray-100 dark:bg-white/8 px-1.5 py-0.5 rounded text-violet-700 dark:text-violet-300">{l.action}</span></td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400 text-xs">{l.resource_type ?? "—"}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400 text-xs truncate max-w-[160px]">{l.actor_email ?? "system"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BillingTab({ tier, isOwner, profile }: { tier: Tier; isOwner: boolean; profile: Profile | null }) {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [ownerSwitching, setOwnerSwitching] = useState<string | null>(null);
  const [ownerTier, setOwnerTier] = useState<Tier>(tier);
  // Keep ownerTier in sync if profile loads after initial render
  useEffect(() => { setOwnerTier(tier); }, [tier]);

  const hasPaidPlan = tier !== "free" || isOwner;
  const currentPlanIndex = PLANS.findIndex((p) => p.tier === tier);

  async function handleUpgrade(targetTier: string) {
    setUpgrading(targetTier);
    setBillingError("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: targetTier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBillingError(data.error ?? "Could not start checkout. Please try again.");
      }
    } catch {
      setBillingError("Network error. Please check your connection and try again.");
    }
    setUpgrading(null);
  }

  async function handleOwnerSetTier(targetTier: Tier) {
    setOwnerSwitching(targetTier);
    setBillingError("");
    try {
      const res = await fetch("/api/billing/set-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: targetTier }),
      });
      const data = await res.json();
      if (data.ok) {
        setOwnerTier(targetTier);
      } else {
        setBillingError(data.error ?? "Failed to switch tier.");
      }
    } catch {
      setBillingError("Network error. Please try again.");
    }
    setOwnerSwitching(null);
  }

  async function handlePortal() {
    setOpeningPortal(true);
    setBillingError("");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBillingError(data.error ?? "Could not open billing portal.");
      }
    } catch {
      setBillingError("Network error. Please try again.");
    }
    setOpeningPortal(false);
  }

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base">Current Plan</CardTitle>
              <CardDescription>
                {isOwner ? "Owner account — all features unlocked." : `You are on the ${TIER_LABELS[tier]} plan.`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={hasPaidPlan ? "default" : "secondary"}>
                {isOwner ? "Owner" : TIER_LABELS[tier]}
              </Badge>
              {profile?.subscription_status && profile.subscription_status !== "active" && !isOwner && (
                <Badge variant="destructive" className="text-xs capitalize">{profile.subscription_status}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        {hasPaidPlan && !isOwner && (
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-5">
              {PLANS.find((p) => p.tier === tier)?.features.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />{f}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handlePortal}
              disabled={openingPortal}
            >
              {openingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              {openingPortal ? "Opening portal…" : "Manage subscription"}
            </Button>
            <p className="text-xs text-gray-400 mt-2">
              Update payment method, view invoices, or cancel — all via Paddle&apos;s secure portal.
            </p>
          </CardContent>
        )}
        {isOwner && (
          <CardContent className="space-y-5">
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              {["Unlimited employees", "All features enabled", "Audit logs", "Priority support"].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />{f}
                </div>
              ))}
            </div>

            {/* Owner tier switcher */}
            <div className="pt-2 border-t border-gray-200 dark:border-white/10">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 mt-2">Simulate tier</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["free", "starter", "growth", "enterprise"] as Tier[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleOwnerSetTier(t)}
                    disabled={ownerSwitching !== null || ownerTier === t}
                    className={`relative px-3 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                      ownerTier === t
                        ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                        : "border-gray-200 bg-gray-50 text-gray-500 hover:border-violet-400 hover:text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:border-violet-500/40 dark:hover:text-gray-200"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {ownerSwitching === t ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="capitalize">{t}</span>
                      </span>
                    ) : (
                      <span className="capitalize">{t}</span>
                    )}
                    {ownerTier === t && (
                      <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-violet-500 border-2 border-white dark:border-gray-900" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Switch tiers instantly to test feature gating. No billing involved.</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Error */}
      {billingError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
          {billingError}
        </div>
      )}

      {/* Upgrade options (only show plans higher than current) */}
      {!isOwner && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {tier === "free" ? "Choose a plan" : "Upgrade your plan"}
          </h3>
          {PLANS.filter((_, i) => i > currentPlanIndex).map((plan) => (
            <Card key={plan.tier} className={plan.tier === "growth" ? "border-violet-400 dark:border-violet-500/50 shadow-sm" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{plan.name}</p>
                      {plan.tier === "growth" && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.price}<span className="text-sm font-normal text-gray-400">/mo</span>
                    </p>
                    <div className="space-y-1">
                      {plan.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />{f}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="gap-2 flex-shrink-0"
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={!!upgrading}
                  >
                    {upgrading === plan.tier ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Redirecting…</>
                    ) : (
                      <>Upgrade <ArrowRight className="h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Security note */}
      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <Shield className="h-3 w-3 flex-shrink-0" />
        Payments are processed securely by Paddle. We never store card details.
      </p>
    </div>
  );
}

// ── Integration Card ─────────────────────────────────────────────────────────
function IntegrationCard({
  icon, name, desc, field, placeholder, helpUrl, helpText,
  webhookType, profile, updateProfile, tier, isOwner, feature,
}: {
  icon: string; name: string; desc: string; field: string; placeholder: string;
  helpUrl: string; helpText: string; webhookType: "slack" | "teams";
  profile: Profile | null;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>;
  tier: Tier; isOwner: boolean; feature: "slack_integration" | "teams_integration";
}) {
  const allowed = canAccess(feature, tier, isOwner);
  const saved = (profile?.[field as keyof typeof profile] as string) ?? "";
  const [url, setUrl] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "tested" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  // Sync from profile once loaded
  useEffect(() => { if (saved) setUrl(saved); }, [saved]);

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    const { error } = await updateProfile({ [field]: url || null } as Partial<Profile>);
    setSaving(false);
    if (error) { setStatus("error"); setErrMsg(error); }
    else setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  }

  async function handleTest() {
    if (!url) return;
    setTesting(true);
    setStatus("idle");
    setErrMsg("");
    try {
      const res = await fetch("/api/integrations/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type: webhookType }),
      });
      const data = await res.json();
      if (res.ok) setStatus("tested");
      else { setStatus("error"); setErrMsg(data.error ?? "Test failed"); }
    } catch {
      setStatus("error");
      setErrMsg("Could not reach webhook");
    }
    setTesting(false);
    setTimeout(() => setStatus("idle"), 3000);
  }

  const isConnected = !!saved;

  return (
    <Card className={isConnected ? "border-emerald-200 dark:border-emerald-500/30" : ""}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center text-2xl flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{name}</p>
              {isConnected && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-3">{desc}</p>

            {!allowed ? (
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/settings?tab=billing"}>
                Upgrade to connect
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder={placeholder}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="text-xs font-mono"
                  />
                  <Button size="sm" onClick={handleSave} disabled={saving || url === saved}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  {saved && (
                    <Button size="sm" variant="outline" onClick={handleTest} disabled={testing}>
                      {testing ? "Testing..." : "Test"}
                    </Button>
                  )}
                </div>
                {status === "saved" && <p className="text-xs text-emerald-500">✓ Saved</p>}
                {status === "tested" && <p className="text-xs text-emerald-500">✓ Test message sent — check your {name}!</p>}
                {status === "error" && <p className="text-xs text-red-400">{errMsg}</p>}
                <a href={helpUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-500 hover:underline">
                  {helpText} →
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
