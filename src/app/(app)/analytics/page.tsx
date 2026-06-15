"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { TierGate } from "@/components/tier-gate";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Download, BarChart3, Sparkles, Lightbulb, ArrowRight, Plus, CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEngagementColor, getEngagementLabel } from "@/lib/utils";
import { generateInsights, generateActionPlan, type InsightSeverity } from "@/lib/insights";
import type { AIInsight } from "@/lib/ai-insights";
import { createClient } from "@/lib/supabase/client";

interface WeekPoint { week: string; score: number; responseRate: number; }
interface DeptScore { dept: string; score: number; count: number; }
interface SurveyRow { id: string; title: string; }
interface ResponseRow { id: string; survey_id: string; answers: Record<string, number | string>; submitted_at: string; }
interface QuestionRow { id: string; survey_id: string; type: string; text: string; }
interface EmployeeRow { id: string; department: string | null; }

function getWeekLabel(date: Date): string {
  const month = date.toLocaleString("default", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function AnalyticsPage() {
  const { profile } = useProfile();
  const router = useRouter();
  const tier = profile?.subscription_tier ?? "free";
  const isOwner = profile?.is_owner ?? false;
  const [period, setPeriod] = useState<"4w" | "8w" | "12w">("8w");

  const [loading, setLoading] = useState(true);
  const [engagementTrend, setEngagementTrend] = useState<WeekPoint[]>([]);
  const [departmentScores, setDepartmentScores] = useState<DeptScore[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalSurveys, setTotalSurveys] = useState(0);
  const [allResponses, setAllResponses] = useState<ResponseRow[]>([]);
  const [allQuestions, setAllQuestions] = useState<QuestionRow[]>([]);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [addedRecs, setAddedRecs] = useState<Set<number>>(new Set());
  const [actionsTaken, setActionsTaken] = useState(0);
  const [benchmark, setBenchmark] = useState<{
    configured: boolean; eligible?: boolean; completedCycles?: number;
    industry?: string; headcountBand?: string; cohortSize?: number;
    p25?: number | null; p50?: number | null; p75?: number | null;
  } | null>(null);

  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();
    supabase
      .from("actions")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", profile.id)
      .eq("status", "done")
      .then(({ count }) => setActionsTaken(count ?? 0));
  }, [profile, addedRecs]);

  async function addRecToActions(index: number, rec: string) {
    if (!profile) return;
    const supabase = createClient();
    const [title, ...rest] = rec.split(":");
    const { error } = await supabase.from("actions").insert({
      workspace_id: profile.id,
      title: (rest.length ? title : rec).trim().slice(0, 200),
      description: rest.length ? rest.join(":").trim() : null,
      status: "planned",
    });
    if (!error) setAddedRecs((prev) => new Set(prev).add(index));
  }

  useEffect(() => {
    if (!profile) return;
    loadAnalytics();
  }, [profile, period]);

  async function loadAnalytics() {
    setLoading(true);
    const supabase = createClient();
    const userId = profile!.id;

    const weeks = period === "4w" ? 4 : period === "8w" ? 8 : 12;
    const since = new Date();
    since.setDate(since.getDate() - weeks * 7);

    // Fetch all data in parallel
    const [surveysRes, employeesRes] = await Promise.all([
      supabase.from("surveys").select("id, title").eq("workspace_id", userId),
      supabase.from("employees").select("id, department").eq("workspace_id", userId).eq("is_active", true),
    ]);

    const surveys: SurveyRow[] = surveysRes.data ?? [];
    const employees: EmployeeRow[] = employeesRes.data ?? [];
    const surveyIds = surveys.map((s) => s.id);

    setTotalSurveys(surveys.length);
    setTotalEmployees(employees.length);

    if (surveyIds.length === 0) {
      setLoading(false);
      return;
    }

    const [responsesRes, questionsRes] = await Promise.all([
      supabase.from("responses").select("id, survey_id, answers, submitted_at")
        .in("survey_id", surveyIds)
        .gte("submitted_at", since.toISOString())
        .order("submitted_at", { ascending: true }),
      supabase.from("questions").select("id, survey_id, type, text").in("survey_id", surveyIds),
    ]);

    const responses: ResponseRow[] = (responsesRes.data ?? []) as ResponseRow[];
    const questions: QuestionRow[] = questionsRes.data ?? [];

    setTotalResponses(responses.length);
    setAllResponses(responses);
    setAllQuestions(questions);

    const scaleQuestionIds = new Set(questions.filter((q) => q.type === "scale").map((q) => q.id));

    // ── Engagement trend by week ─────────────────────────────
    const weekMap = new Map<string, { scores: number[]; dates: Date[] }>();
    responses.forEach((r) => {
      const date = new Date(r.submitted_at);
      const weekStart = startOfWeek(date);
      const label = getWeekLabel(weekStart);
      if (!weekMap.has(label)) weekMap.set(label, { scores: [], dates: [weekStart] });
      const scaleAnswers = Object.entries(r.answers)
        .filter(([qId]) => scaleQuestionIds.has(qId))
        .map(([, v]) => Number(v))
        .filter((v) => !isNaN(v));
      if (scaleAnswers.length) {
        const avg = scaleAnswers.reduce((a, b) => a + b, 0) / scaleAnswers.length;
        weekMap.get(label)!.scores.push(avg * 10); // scale 1-10 → 0-100
      }
    });

    // Build trend sorted by date
    const trend: WeekPoint[] = Array.from(weekMap.entries())
      .sort((a, b) => a[1].dates[0].getTime() - b[1].dates[0].getTime())
      .map(([week, { scores }]) => ({
        week,
        score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        responseRate: employees.length
          ? Math.round((responses.filter((r) => {
              const w = getWeekLabel(startOfWeek(new Date(r.submitted_at)));
              return w === week;
            }).length / employees.length) * 100)
          : 0,
      }));

    setEngagementTrend(trend);

    // Department breakdown — employee counts only.
    // Per-department scores are intentionally not computed: because responses are
    // anonymous (no employee_id stored), we cannot link a response to a department.
    // Showing the overall average per-department would be fabricated data.
    const deptCountMap = new Map<string, number>();
    employees.forEach((e) => {
      if (e.department) {
        deptCountMap.set(e.department, (deptCountMap.get(e.department) ?? 0) + 1);
      }
    });
    const depts: DeptScore[] = Array.from(deptCountMap.entries()).map(([dept, count]) => ({
      dept,
      score: 0, // unused — see department tab
      count,
    }));
    setDepartmentScores(depts);

    setLoading(false);
  }

  // ── Derived metrics ──────────────────────────────────────────
  const currentScore = engagementTrend.length
    ? engagementTrend[engagementTrend.length - 1].score
    : 0;
  const prevScore = engagementTrend.length > 1
    ? engagementTrend[engagementTrend.length - 2].score
    : currentScore;
  const scoreDelta = currentScore - prevScore;

  const avgResponseRate = totalEmployees > 0
    ? Math.round((totalResponses / Math.max(totalSurveys, 1) / totalEmployees) * 100)
    : 0;

  // Simple sentiment from scale scores
  const scaleAnswers: number[] = [];
  allResponses.forEach((r) => {
    const scaleQIds = new Set(allQuestions.filter((q) => q.type === "scale").map((q) => q.id));
    Object.entries(r.answers).forEach(([qId, v]) => {
      if (scaleQIds.has(qId)) scaleAnswers.push(Number(v));
    });
  });
  const positiveCount = scaleAnswers.filter((s) => s >= 8).length;
  const neutralCount = scaleAnswers.filter((s) => s >= 5 && s < 8).length;
  const negativeCount = scaleAnswers.filter((s) => s < 5).length;
  const total = scaleAnswers.length || 1;
  const sentimentData = [
    { name: "Positive (8-10)", value: Math.round((positiveCount / total) * 100), color: "#10b981" },
    { name: "Neutral (5-7)", value: Math.round((neutralCount / total) * 100), color: "#94a3b8" },
    { name: "Negative (<5)", value: Math.round((negativeCount / total) * 100), color: "#f59e0b" },
  ];

  // eNPS: promoters (9-10) minus detractors (0-6) as percentage
  const promoters = scaleAnswers.filter((s) => s >= 9).length;
  const detractors = scaleAnswers.filter((s) => s <= 6).length;
  const enps = scaleAnswers.length
    ? Math.round(((promoters - detractors) / scaleAnswers.length) * 100)
    : 0;

  // Burnout signals: low scorers
  const lowScoreResponses = scaleAnswers.filter((s) => s <= 4).length;
  const burnoutPct = scaleAnswers.length
    ? Math.round((lowScoreResponses / scaleAnswers.length) * 100)
    : 0;

  // ── Rule-based insights + action plan ────────────────────────
  // Pure functions in @/lib/insights — swap to AI generation later (see TODO there).
  const insightInput = {
    currentScore,
    previousScore: prevScore,
    avgResponseRate,
    burnoutPct,
    pulseIndex: enps,
    totalResponses,
    totalEmployees,
  };
  const insights = generateInsights(insightInput);
  const actionPlan = generateActionPlan(insightInput);

  const severityStyles: Record<InsightSeverity, { icon: typeof Sparkles; box: string; text: string; iconColor: string }> = {
    positive: { icon: CheckCircle2, box: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20", text: "text-emerald-800 dark:text-emerald-300", iconColor: "text-emerald-500" },
    info: { icon: Sparkles, box: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20", text: "text-blue-800 dark:text-blue-300", iconColor: "text-blue-500" },
    warning: { icon: AlertTriangle, box: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20", text: "text-amber-800 dark:text-amber-300", iconColor: "text-amber-500" },
    critical: { icon: AlertTriangle, box: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20", text: "text-red-800 dark:text-red-300", iconColor: "text-red-500" },
  };

  async function exportCSV() {
    // Tier check is enforced server-side in /api/export/csv — the UI gate alone
    // is bypassable by calling this function from DevTools.
    const res = await fetch("/api/export/csv", { method: "GET", credentials: "include" });
    if (res.status === 403) {
      alert("CSV export requires a Growth or Enterprise plan.");
      return;
    }
    if (!res.ok) {
      alert("Export failed. Please try again.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `responses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasData = engagementTrend.length > 0;

  // Fetch AI insights once metrics are ready. The route falls back to the
  // rule-based engine server-side if the Anthropic call is unavailable.
  useEffect(() => {
    if (loading || !hasData) return;
    let cancelled = false;
    setAiLoading(true);
    fetch("/api/insights/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(insightInput),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: AIInsight | null) => { if (!cancelled) setAiInsight(d); })
      .catch(() => { if (!cancelled) setAiInsight(null); })
      .finally(() => { if (!cancelled) setAiLoading(false); });

    // Contribute this week's score (if eligible) and read cohort percentiles.
    fetch("/api/benchmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentScore }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setBenchmark(d); })
      .catch(() => { if (!cancelled) setBenchmark(null); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasData, currentScore, prevScore, avgResponseRate, burnoutPct, enps, totalResponses, totalEmployees]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            {actionsTaken > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                <CheckSquare className="h-3 w-3" />
                {actionsTaken} action{actionsTaken !== 1 ? "s" : ""} taken
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">Team engagement intelligence</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1">
            {(["4w", "8w", "12w"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {p === "4w" ? "4 weeks" : p === "8w" ? "8 weeks" : "12 weeks"}
              </button>
            ))}
          </div>
          <TierGate feature="csv_export" tier={tier} isOwner={isOwner}>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV} disabled={!hasData}>
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </TierGate>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading analytics...</div>
      ) : !hasData ? (
        <Card>
          <CardContent className="p-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-7 w-7 text-violet-500" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No analytics data yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
              Insights, trends, and your action plan appear here once employees start responding to an active survey.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button onClick={() => router.push("/surveys/new")} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Create your first survey
              </Button>
              <Button variant="outline" onClick={() => router.push("/employees")} className="gap-2">
                Add employees
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 font-medium mb-2">Engagement Score</p>
                <p className={`text-3xl font-bold ${getEngagementColor(currentScore)}`}>{currentScore}%</p>
                <div className="flex items-center gap-1 mt-1">
                  {scoreDelta >= 0
                    ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                    : <TrendingDown className="h-3 w-3 text-red-500" />}
                  <span className={`text-xs font-medium ${scoreDelta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {scoreDelta >= 0 ? "+" : ""}{scoreDelta}% vs prev week
                  </span>
                </div>
                <Badge variant={currentScore >= 75 ? "success" : currentScore >= 50 ? "warning" : "destructive"} className="mt-2 text-xs">
                  {getEngagementLabel(currentScore)}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 font-medium mb-2">Avg Response Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{avgResponseRate}%</p>
                <p className="text-xs text-gray-400 mt-1">{totalResponses} total responses</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 font-medium mb-2">Burnout Risk</p>
                <p className={`text-3xl font-bold ${burnoutPct >= 30 ? "text-red-500" : burnoutPct >= 15 ? "text-amber-500" : "text-emerald-500"}`}>
                  {burnoutPct}%
                </p>
                <p className="text-xs text-gray-400 mt-1">scores below 5/10</p>
                <Badge variant={burnoutPct >= 30 ? "destructive" : burnoutPct >= 15 ? "warning" : "success"} className="mt-2 text-xs">
                  {burnoutPct >= 30 ? "High" : burnoutPct >= 15 ? "Moderate" : "Low"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 font-medium mb-1">Pulse Score Index</p>
                <p className="text-xs text-gray-400 mb-2">(high scorers minus low scorers)</p>
                <p className={`text-3xl font-bold ${enps >= 30 ? "text-emerald-500" : enps >= 0 ? "text-violet-600" : "text-red-500"}`}>
                  {enps >= 0 ? "+" : ""}{enps}
                </p>
                <p className="text-xs text-gray-400 mt-1">scores ≥9 minus scores ≤6, as %</p>
                <Badge variant={enps >= 30 ? "success" : enps >= 0 ? "warning" : "destructive"} className="mt-2 text-xs">
                  {enps >= 50 ? "Excellent" : enps >= 30 ? "Good" : enps >= 0 ? "Fair" : "Poor"}
                </Badge>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">Not a standard eNPS — requires a dedicated "recommend" question for that.</p>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights + Action Plan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-base">Insights</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">Auto-generated</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.map((ins) => {
                  const s = severityStyles[ins.severity];
                  const Icon = s.icon;
                  return (
                    <div key={ins.id} className={`flex items-start gap-3 p-3 rounded-lg border ${s.box}`}>
                      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${s.iconColor}`} />
                      <div>
                        <p className={`text-sm font-semibold ${s.text}`}>{ins.title}</p>
                        <p className={`text-xs mt-0.5 leading-relaxed ${s.text} opacity-90`}>{ins.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-base">Suggested Action Plan</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {actionPlan.map((action, i) => (
                  <div key={action.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
                    <div className="h-5 w-5 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{action.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{action.detail}</p>
                      {action.href && action.cta && (
                        <button
                          onClick={() => router.push(action.href!)}
                          className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-medium mt-1.5 hover:underline"
                        >
                          {action.cta}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="engagement">
            <TabsList className="mb-6">
              <TabsTrigger value="engagement">Engagement Trend</TabsTrigger>
              <TabsTrigger value="departments">By Department</TabsTrigger>
              <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
              <TabsTrigger value="burnout">Burnout Signals</TabsTrigger>
            </TabsList>

            {/* Engagement trend */}
            <TabsContent value="engagement">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Engagement Score Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={engagementTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                          formatter={(value) => [`${value}%`, ""]}
                        />
                        <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5}
                          dot={{ fill: "#7c3aed", r: 4 }} name="Engagement" />
                        <Line type="monotone" dataKey="responseRate" stroke="#c4b5fd" strokeWidth={2}
                          strokeDasharray="4 4" dot={false} name="Response Rate" />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-6 mt-2 justify-center">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="h-0.5 w-5 bg-violet-600" />Engagement score
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="h-0.5 w-5 bg-violet-300 border-dashed border-t-2" />Response rate
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Response Sentiment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                          {sentimentData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v}%`, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {sentimentData.map((s) => (
                        <div key={s.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                            <span className="text-gray-600 dark:text-gray-400">{s.name}</span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{s.value}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Department */}
            <TabsContent value="departments">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Employees by Department</CardTitle>
                </CardHeader>
                <CardContent>
                  {departmentScores.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      No department data. Add departments to your employees to see this breakdown.
                    </p>
                  ) : (
                    <>
                      <div className="mb-5 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-sm text-blue-800 dark:text-blue-300">
                        <strong>Why no per-department scores?</strong> Survey responses are fully anonymous — no employee identity is linked to any answer. Computing a "department score" would require knowing which respondent belongs to which department, which would break anonymity. The chart below shows headcount distribution only.
                      </div>
                      <div className="space-y-3">
                        {departmentScores
                          .sort((a, b) => b.count - a.count)
                          .map((d) => {
                            const maxCount = Math.max(...departmentScores.map((x) => x.count));
                            const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                            return (
                              <div key={d.dept} className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-28 truncate flex-shrink-0">{d.dept}</span>
                                <div className="flex-1 bg-gray-100 dark:bg-white/10 rounded-full h-3">
                                  <div
                                    className="h-3 rounded-full bg-violet-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-500 w-20 text-right flex-shrink-0">
                                  {d.count} employee{d.count !== 1 ? "s" : ""}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                      <p className="text-xs text-gray-400 mt-4 text-center">{totalEmployees} active employees across {departmentScores.length} departments</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sentiment */}
            <TabsContent value="sentiment">
              <TierGate feature="sentiment_analysis" tier={tier} isOwner={isOwner} overlay>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Score Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((score) => {
                        const count = scaleAnswers.filter((s) => s === score).length;
                        const pct = scaleAnswers.length ? (count / scaleAnswers.length) * 100 : 0;
                        return (
                          <div key={score} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-4">{score}</span>
                            <div className="flex-1 bg-gray-100 dark:bg-white/10 rounded-full h-3">
                              <div
                                className="h-3 rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: score >= 8 ? "#10b981" : score >= 5 ? "#7c3aed" : "#f59e0b",
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-500 w-24 text-right">
                              {count} ({Math.round(pct)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-4 text-center">{scaleAnswers.length} total scale responses across all surveys</p>
                  </CardContent>
                </Card>
              </TierGate>
            </TabsContent>

            {/* Burnout */}
            <TabsContent value="burnout">
              <TierGate feature="burnout_detection" tier={tier} isOwner={isOwner} overlay>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Burnout Risk Indicators</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        {
                          label: "Low engagement scores (≤4/10)",
                          count: scaleAnswers.filter((s) => s <= 4).length,
                          risk: scaleAnswers.filter((s) => s <= 4).length > 5 ? "high" : scaleAnswers.filter((s) => s <= 4).length > 2 ? "moderate" : "low",
                        },
                        {
                          label: "Mid-range scores needing attention (5-6/10)",
                          count: scaleAnswers.filter((s) => s >= 5 && s <= 6).length,
                          risk: scaleAnswers.filter((s) => s >= 5 && s <= 6).length > 10 ? "moderate" : "low",
                        },
                        {
                          label: "High performers engaged (9-10/10)",
                          count: scaleAnswers.filter((s) => s >= 9).length,
                          risk: "low",
                        },
                      ].map((signal) => {
                        const colorMap = {
                          low: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300", badge: "success" as const },
                          moderate: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-300", badge: "warning" as const },
                          high: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-700 dark:text-red-300", badge: "destructive" as const },
                        };
                        const colors = colorMap[signal.risk as keyof typeof colorMap] ?? colorMap.low;
                        return (
                          <div key={signal.label} className={`flex items-center justify-between p-3 rounded-lg border ${colors.bg}`}>
                            <div className="flex items-center gap-3">
                              {signal.risk === "low"
                                ? <CheckCircle2 className={`h-4 w-4 ${colors.text}`} />
                                : <AlertTriangle className={`h-4 w-4 ${colors.text}`} />}
                              <span className={`text-sm font-medium ${colors.text}`}>{signal.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${colors.text}`}>{signal.count}</span>
                              <Badge variant={colors.badge}>{signal.risk}</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {burnoutPct >= 20 && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-red-800 dark:text-red-300">
                            {burnoutPct}% of responses show low engagement. Prioritise 1:1 check-ins with your team.
                          </p>
                        </div>
                      )}
                      {(
                        [
                          avgResponseRate < 50 && { tip: "Response rate is low — send a reminder to employees.", action: "Go to surveys →", href: "/surveys" },
                          currentScore < 60 && { tip: "Engagement is below 60%. Create a new pulse survey to dig deeper.", action: "Create survey →", href: "/surveys/new" },
                          enps < 0 && { tip: "Pulse Score Index is negative — low scorers outweigh high scorers. Consider a follow-up survey to understand disengagement.", action: "Create survey →", href: "/surveys/new" },
                          currentScore >= 75 && { tip: "Great engagement! Keep the momentum with consistent pulse checks.", action: "Create survey →", href: "/surveys/new" },
                        ] as (false | { tip: string; action: string; href: string })[]
                      ).filter(Boolean).map((item, i) => {
                        const { tip, action, href } = item as { tip: string; action: string; href: string };
                        return (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20">
                            <div className="h-5 w-5 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-violet-900 dark:text-violet-300">{tip}</p>
                              <button onClick={() => router.push(href)} className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-1 hover:underline">
                                {action}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </TierGate>
            </TabsContent>
          </Tabs>

          {/* AI Insights — generated from anonymous aggregate metrics */}
          <Card className="mt-8 border-violet-200/60 dark:border-violet-500/20">
            <CardHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-base">AI Insights</CardTitle>
                {aiInsight?.fallback && (
                  <Badge variant="secondary" className="text-[10px]">Rule-based fallback</Badge>
                )}
                {!aiInsight?.fallback && aiInsight && (
                  <Badge variant="secondary" className="text-[10px]">claude-sonnet-4-6</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {aiLoading && !aiInsight ? (
                <p className="text-sm text-gray-400">Generating insights…</p>
              ) : !aiInsight ? (
                <p className="text-sm text-gray-400">
                  AI insights are unavailable right now. Your metrics and the action plan above still apply.
                </p>
              ) : (
                <div className="space-y-5">
                  <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{aiInsight.narrative}</p>

                  <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                    aiInsight.burnout_risk.level === "high"
                      ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
                      : aiInsight.burnout_risk.level === "medium"
                      ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
                      : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                  }`}>
                    <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      aiInsight.burnout_risk.level === "high" ? "text-red-500"
                      : aiInsight.burnout_risk.level === "medium" ? "text-amber-500" : "text-emerald-500"
                    }`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Burnout risk: <span className="capitalize">{aiInsight.burnout_risk.level}</span>
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{aiInsight.burnout_risk.explanation}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Recommended for managers</p>
                    <div className="space-y-2">
                      {aiInsight.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
                          <div className="h-5 w-5 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                          <p className="text-sm text-gray-700 dark:text-gray-200 flex-1">{rec}</p>
                          <button
                            onClick={() => addRecToActions(i, rec)}
                            disabled={addedRecs.has(i)}
                            className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors disabled:opacity-60 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10"
                          >
                            {addedRecs.has(i) ? <><CheckCircle2 className="h-3 w-3" />Added</> : <><Plus className="h-3 w-3" />Add to Actions</>}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Generated from anonymous aggregate metrics only — no individual responses are sent. Use as a starting point, not a substitute for talking to your team.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Industry benchmark */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">Industry benchmark</CardTitle>
                {benchmark?.industry && (
                  <Badge variant="secondary" className="text-[10px]">{benchmark.industry} · {benchmark.headcountBand}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!benchmark ? (
                <p className="text-sm text-gray-400">Loading benchmark…</p>
              ) : !benchmark.configured ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Set your <strong>industry</strong> and <strong>company size</strong> in{" "}
                  <button onClick={() => router.push("/settings")} className="text-violet-600 dark:text-violet-400 hover:underline">Settings</button>{" "}
                  to compare against similar companies.
                </p>
              ) : benchmark.p50 == null ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Not enough companies in your {benchmark.industry} · {benchmark.headcountBand} cohort yet
                  ({benchmark.cohortSize} so far). Benchmarks unlock at 3 to keep every company anonymous.
                  {benchmark.eligible === false && " Your data joins the pool after 3 completed survey cycles."}
                </p>
              ) : (
                (() => {
                  const lo = Math.min(benchmark.p25 ?? 0, currentScore) - 5;
                  const hi = Math.max(benchmark.p75 ?? 100, currentScore) + 5;
                  const span = Math.max(hi - lo, 1);
                  const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - lo) / span) * 100))}%`;
                  return (
                    <div className="pt-2">
                      <div className="relative h-16">
                        {/* p25–p75 band */}
                        <div
                          className="absolute top-6 h-3 rounded-full bg-violet-100 dark:bg-violet-500/20"
                          style={{ left: pos(benchmark.p25 ?? 0), right: `calc(100% - ${pos(benchmark.p75 ?? 100)})` }}
                        />
                        {/* median marker */}
                        <div className="absolute top-4 -translate-x-1/2 flex flex-col items-center" style={{ left: pos(benchmark.p50 ?? 0) }}>
                          <div className="h-7 w-0.5 bg-violet-400" />
                          <span className="text-[10px] text-gray-400 mt-0.5">median {Math.round(benchmark.p50 ?? 0)}</span>
                        </div>
                        {/* your score marker */}
                        <div className="absolute top-0 -translate-x-1/2 flex flex-col items-center" style={{ left: pos(currentScore) }}>
                          <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">You {currentScore}</span>
                          <div className="h-9 w-1 bg-violet-600 rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                        <span>p25: {Math.round(benchmark.p25 ?? 0)}</span>
                        <span>p75: {Math.round(benchmark.p75 ?? 0)}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
                        Anonymized across {benchmark.cohortSize} companies in your industry and size band. Your score
                        is {currentScore >= (benchmark.p50 ?? 0) ? "at or above" : "below"} the cohort median.
                      </p>
                    </div>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
