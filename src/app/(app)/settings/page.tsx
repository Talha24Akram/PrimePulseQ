"use client";
import { useState, useEffect, Suspense } from "react";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { Building2, Bell, Shield, CreditCard, Zap, CheckCircle2, Sun, Moon, ClipboardList, ExternalLink, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProfile, type Profile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
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
  const { theme, setTheme } = useTheme();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const [company, setCompany] = useState({ name: "", slug: "", website: "" });
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
      });
    }
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    const { error } = await updateProfile({
      company_name: company.name || null,
      company_slug: company.slug || null,
      company_website: company.website || null,
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
                <Label>Workspace URL</Label>
                <div className="flex items-center">
                  <span className="flex h-10 items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg dark:text-gray-400 dark:bg-white/5 dark:border-white/10">
                    pulsesurvey.io/
                  </span>
                  <Input
                    value={company.slug}
                    onChange={(e) => setCompany((p) => ({ ...p, slug: e.target.value }))}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input
                  value={company.website}
                  onChange={(e) => setCompany((p) => ({ ...p, website: e.target.value }))}
                  placeholder="https://"
                />
              </div>
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

          <Card className="mt-6 border-red-500/20">
            <CardHeader>
              <CardTitle className="text-base text-red-400">Danger Zone</CardTitle>
              <CardDescription>These actions are irreversible.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                <div>
                  <p className="font-medium text-red-300 text-sm">Delete workspace</p>
                  <p className="text-xs text-red-400/70 mt-0.5">Permanently deletes all surveys, responses, and employee data.</p>
                </div>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </CardContent>
          </Card>
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
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription>Choose how PrimePulseQ looks for you.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    theme === "light"
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                      : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                  }`}
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${theme === "light" ? "bg-violet-100 dark:bg-violet-500/20" : "bg-gray-100 dark:bg-white/8"}`}>
                    <Sun className={`h-5 w-5 ${theme === "light" ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-gray-400"}`} />
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${theme === "light" ? "text-violet-700 dark:text-violet-300" : "text-gray-700 dark:text-gray-200"}`}>Light</p>
                    <p className="text-xs text-gray-400 mt-0.5">Clean and bright</p>
                  </div>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    theme === "dark"
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                      : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                  }`}
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${theme === "dark" ? "bg-violet-100 dark:bg-violet-500/20" : "bg-gray-100 dark:bg-white/8"}`}>
                    <Moon className={`h-5 w-5 ${theme === "dark" ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-gray-400"}`} />
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${theme === "dark" ? "text-violet-700 dark:text-violet-300" : "text-gray-700 dark:text-gray-200"}`}>Dark</p>
                    <p className="text-xs text-gray-400 mt-0.5">Easy on the eyes</p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
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

// ── Billing Tab ──────────────────────────────────────────────────────────────
const PLANS = [
  {
    tier: "starter" as const,
    name: "Starter",
    price: "$19",
    features: ["Up to 100 employees", "Weekly pulse surveys", "Basic analytics", "Email support"],
  },
  {
    tier: "growth" as const,
    name: "Growth",
    price: "$49",
    features: ["Up to 500 employees", "Slack & Teams integration", "Advanced analytics", "Burnout detection"],
  },
  {
    tier: "enterprise" as const,
    name: "Enterprise",
    price: "$99",
    features: ["Unlimited employees", "SSO / SAML", "HRIS integrations", "API access", "Audit logs"],
  },
];

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
              Update payment method, view invoices, or cancel — all via Stripe&apos;s secure portal.
            </p>
          </CardContent>
        )}
        {isOwner && (
          <CardContent className="space-y-5">
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              {["Unlimited employees", "All features enabled", "Audit logs", "API access"].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />{f}
                </div>
              ))}
            </div>

            {/* Owner tier switcher */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Simulate tier</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["free", "starter", "growth", "enterprise"] as Tier[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleOwnerSetTier(t)}
                    disabled={ownerSwitching !== null || ownerTier === t}
                    className={`relative px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      ownerTier === t
                        ? "border-violet-500 bg-violet-500/15 text-violet-300"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-violet-500/40 hover:text-gray-200"
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
                      <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-violet-500 border-2 border-gray-900" />
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
