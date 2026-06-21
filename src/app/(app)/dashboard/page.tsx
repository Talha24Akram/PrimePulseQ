"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Circle,
  FileText,
  Plus,
  Send,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Survey {
  id: string;
  title: string;
  status: string;
  created_at: string;
  closes_at: string | null;
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Dashboard data request timed out")), milliseconds);
    }),
  ]);
}

export default function DashboardPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [employeeCount, setEmployeeCount] = useState(0);
  const [activeSurveyCount, setActiveSurveyCount] = useState(0);
  const [surveyCount, setSurveyCount] = useState(0);
  const [totalResponses, setTotalResponses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      try {
        const [recentResult, activeResult, surveyResult, employeeResult, responseResult] = await withTimeout(
          Promise.all([
            supabase
              .from("surveys")
              .select("id, title, status, created_at, closes_at")
              .order("created_at", { ascending: false })
              .limit(5),
            supabase.from("surveys").select("id", { count: "exact", head: true }).eq("status", "active"),
            supabase.from("surveys").select("id", { count: "exact", head: true }),
            supabase.from("employees").select("id", { count: "exact", head: true }).eq("is_active", true),
            supabase.from("responses").select("id", { count: "exact", head: true }),
          ]),
          6000
        );

        const recentSurveys = (recentResult.data ?? []) as Survey[];
        setSurveys(recentSurveys);
        setActiveSurveyCount(activeResult.count ?? 0);
        setSurveyCount(surveyResult.count ?? 0);
        setEmployeeCount(employeeResult.count ?? 0);
        setTotalResponses(responseResult.count ?? 0);

        if (recentSurveys.length > 0) {
          const countEntries = await Promise.all(
            recentSurveys.map(async (survey) => {
              const { count } = await supabase
                .from("responses")
                .select("id", { count: "exact", head: true })
                .eq("survey_id", survey.id);
              return [survey.id, count ?? 0] as const;
            })
          );
          setResponseCounts(Object.fromEntries(countEntries));
        }
      } catch {
        // Keep the zero-value dashboard usable if the data service is unavailable.
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const responseRate = employeeCount > 0 && activeSurveyCount > 0
    ? Math.min(100, Math.round((totalResponses / (activeSurveyCount * employeeCount)) * 100))
    : 0;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const setupSteps = [
    { label: "Add your team", detail: "Invite at least one employee", href: "/employees", complete: employeeCount > 0 },
    { label: "Create a pulse", detail: "Draft your first survey", href: "/surveys/new", complete: surveyCount > 0 },
    { label: "Start collecting", detail: "Activate a survey", href: "/surveys", complete: activeSurveyCount > 0 },
  ];
  const completedSteps = setupSteps.filter((step) => step.complete).length;

  const compactStats = [
    { label: "Active surveys", value: activeSurveyCount, detail: `${surveyCount} total`, icon: FileText, color: "text-violet-500 bg-violet-500/10" },
    { label: "Employees", value: employeeCount, detail: "active", icon: Users, color: "text-sky-500 bg-sky-500/10" },
    { label: "Responses", value: totalResponses, detail: "all time", icon: CheckCircle2, color: "text-amber-500 bg-amber-500/10" },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1440px] overflow-x-hidden px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
      <header className="mb-7 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-950 dark:text-white sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{today}</p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/surveys/new">
            <Plus className="h-4 w-4" />
            <span className="sm:hidden">New</span>
            <span className="hidden sm:inline">New survey</span>
          </Link>
        </Button>
      </header>

      <section className="mb-7 overflow-hidden rounded-2xl border border-gray-200/80 bg-white dark:border-white/8 dark:bg-[#11151f]" aria-label="Workspace summary">
        <div className="grid grid-cols-2 lg:grid-cols-[1.35fr_repeat(3,1fr)]">
          <div className="col-span-2 border-b border-gray-200/80 p-5 lg:col-span-1 lg:border-b-0 lg:border-r dark:border-white/8 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Response rate</p>
                <p className="mt-2 text-3xl font-semibold text-gray-950 dark:text-white">{loading ? "--" : `${responseRate}%`}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <Progress value={responseRate} className="h-1.5" />
            <p className="mt-2 text-xs text-gray-400">Across active surveys and employees</p>
          </div>

          {compactStats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "min-h-32 border-gray-200/80 p-5 dark:border-white/8 sm:p-6",
                index === 0 && "border-b border-r lg:border-b-0",
                index === 1 && "border-b lg:border-b-0 lg:border-r",
                index === 2 && "col-span-2 lg:col-span-1"
              )}
            >
              <div className={`mb-4 flex h-8 w-8 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-semibold text-gray-950 dark:text-white">{loading ? "--" : stat.value}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stat.label} · {stat.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200/70 px-5 py-4 dark:border-white/8 sm:px-6">
            <div>
              <CardTitle className="text-sm">Recent surveys</CardTitle>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Latest workspace activity</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-lg text-xs">
              <Link href="/surveys">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                {[0, 1, 2].map((row) => <div key={row} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />)}
              </div>
            ) : surveys.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No surveys yet</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500 dark:text-gray-400">Create a short pulse to start collecting anonymous feedback.</p>
                <Button asChild size="sm" className="mt-5 rounded-lg">
                  <Link href="/surveys/new">Create survey</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200/70 dark:divide-white/8">
                {surveys.map((survey) => (
                  <Link key={survey.id} href={`/surveys/${survey.id}`} className="group flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.025] sm:px-6">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/6 dark:text-gray-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 group-hover:text-violet-600 dark:text-gray-100 dark:group-hover:text-violet-400">{survey.title}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{responseCounts[survey.id] ?? 0} responses</p>
                    </div>
                    <Badge variant={survey.status === "active" ? "default" : survey.status === "closed" ? "secondary" : "outline"}>{survey.status}</Badge>
                    <ArrowRight className="hidden h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 sm:block dark:text-gray-600" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-gray-200/70 px-5 py-4 dark:border-white/8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm">Workspace setup</CardTitle>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{completedSteps} of {setupSteps.length} complete</p>
                </div>
                <span className="text-xs font-medium text-violet-600 dark:text-violet-400">{Math.round((completedSteps / setupSteps.length) * 100)}%</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 p-3">
              {setupSteps.map((step) => (
                <Link key={step.label} href={step.href} className="flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.035]">
                  {step.complete ? (
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-500"><Check className="h-3 w-3" /></span>
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 text-gray-300 dark:text-gray-600" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{step.label}</span>
                    <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{step.detail}</span>
                  </span>
                  <ArrowRight className="mt-1 h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-5 pb-2 pt-4">
              <CardTitle className="text-sm">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 p-3 pt-2">
              {[
                { label: "Add team", href: "/employees", icon: UserPlus },
                { label: "Send pulse", href: "/surveys", icon: Send },
                { label: "Analytics", href: "/analytics", icon: BarChart3 },
              ].map((action) => (
                <Link key={action.label} href={action.href} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200/80 bg-gray-50 px-2 text-center text-[11px] font-medium text-gray-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/8 dark:bg-white/[0.025] dark:text-gray-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/8 dark:hover:text-violet-300">
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
