"use client";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Building2, Bell, Shield, CreditCard, Zap, CheckCircle2, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [company, setCompany] = useState({ name: "Acme Inc.", slug: "acme", website: "https://acme.com" });
  const [notifications, setNotifications] = useState({
    new_responses: true,
    weekly_summary: true,
    burnout_alerts: true,
    low_response_rate: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your workspace preferences</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="mb-8">
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
              <CardTitle className="text-base">Email Notifications</CardTitle>
              <CardDescription>Choose when you get notified by email.</CardDescription>
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
                      <p className="text-sm font-medium text-gray-100">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(v) => setNotifications((p) => ({ ...p, [item.key]: v }))}
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
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Current Plan</CardTitle>
                <Badge>Starter</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$49</span>
                <span className="text-gray-500 text-sm mb-1">/month</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                {["Up to 100 employees", "Weekly pulse surveys", "Basic analytics", "Email support"].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-violet-600" />
                    {f}
                  </div>
                ))}
              </div>
              <Button className="w-full">Upgrade to Growth — $149/mo</Button>
              <p className="text-xs text-gray-400 text-center mt-2">Up to 500 employees · Slack, burnout detection, advanced analytics · 1 week free</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Billing Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-12 rounded bg-gray-700 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">VISA</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-100">•••• •••• •••• 4242</p>
                    <p className="text-xs text-gray-500">Expires 12/27</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Update</Button>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <Shield className="h-3 w-3" />
                Payments are secured by Paddle. We never store card details.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <div className="space-y-4">
            {[
              {
                name: "Slack",
                desc: "Send survey links and weekly summaries directly to your Slack workspace.",
                connected: false,
                plan: "Growth",
                icon: "💬",
              },
              {
                name: "Microsoft Teams",
                desc: "Distribute surveys via Microsoft Teams channels.",
                connected: false,
                plan: "Growth",
                icon: "🟦",
              },
              {
                name: "BambooHR",
                desc: "Automatically sync employee roster from BambooHR.",
                connected: false,
                plan: "Enterprise",
                icon: "🎋",
              },
              {
                name: "Workday",
                desc: "Sync employee data and org structure from Workday.",
                connected: false,
                plan: "Enterprise",
                icon: "⚙️",
              },
            ].map((integration) => (
              <Card key={integration.name}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/8 flex items-center justify-center text-2xl flex-shrink-0">
                    {integration.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-100 text-sm">{integration.name}</p>
                      <Badge variant="outline" className="text-xs">{integration.plan}+</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{integration.desc}</p>
                  </div>
                  <Button
                    variant={integration.connected ? "outline" : "default"}
                    size="sm"
                    disabled={integration.plan === "Enterprise"}
                  >
                    {integration.connected ? "Disconnect" : integration.plan === "Enterprise" ? "Enterprise only" : "Connect"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
