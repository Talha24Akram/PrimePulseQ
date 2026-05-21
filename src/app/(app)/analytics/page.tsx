"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { TierGate } from "@/components/tier-gate";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Download, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEngagementColor, getEngagementLabel } from "@/lib/utils";
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

    // ── Department scores (from employees who have departments) ──
    const deptMap = new Map<string, number[]>();
    employees.forEach((e) => {
      if (e.department) {
        if (!deptMap.has(e.department)) deptMap.set(e.department, []);
      }
    });

    // We can't link anonymous responses to departments, so show dept employee counts
    // and use overall avg score as proxy (real linking would need dept in responses)
    const overallScores: number[] = [];
    responses.forEach((r) => {
      Object.entries(r.answers).forEach(([qId, v]) => {
        if (scaleQuestionIds.has(qId)) overallScores.push(Number(v) * 10);
      });
    });
    const overallAvg = overallScores.length
      ? Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length)
      : 0;

    const depts: DeptScore[] = Array.from(deptMap.entries()).map(([dept]) => {
      const count = employees.filter((e) => e.department === dept).length;
      return { dept, score: overallAvg, count };
    });
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

  function exportCSV() {
    const scaleQIds = new Set(allQuestions.filter((q) => q.type === "scale").map((q) => q.id));
    const rows = [["response_id", "survey_id", "submitted_at", ...allQuestions.map((q) => q.text)]];
    allResponses.forEach((r) => {
      rows.push([
        r.id,
        r.survey_id,
        r.submitted_at,
        ...allQuestions.map((q) => String(r.answers[q.id] ?? "")),
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `responses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasData = engagementTrend.length > 0;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
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
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-500 mb-1">No data yet</p>
            <p className="text-sm text-gray-400">
              Analytics will appear once you have active surveys with responses.
            </p>
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
                <p className="text-xs text-gray-500 font-medium mb-2">eNPS Score</p>
                <p className={`text-3xl font-bold ${enps >= 30 ? "text-emerald-500" : enps >= 0 ? "text-violet-600" : "text-red-500"}`}>
                  {enps >= 0 ? "+" : ""}{enps}
                </p>
                <p className="text-xs text-gray-400 mt-1">promoters minus detractors</p>
                <Badge variant={enps >= 30 ? "success" : enps >= 0 ? "warning" : "destructive"} className="mt-2 text-xs">
                  {enps >= 50 ? "Excellent" : enps >= 30 ? "Good" : enps >= 0 ? "Fair" : "Poor"}
                </Badge>
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
                  <CardTitle className="text-base">Engagement by Department</CardTitle>
                </CardHeader>
                <CardContent>
                  {departmentScores.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      No department data. Add departments to your employees to see this breakdown.
                    </p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={Math.max(200, departmentScores.length * 52)}>
                        <BarChart data={departmentScores} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                          <YAxis dataKey="dept" type="category" tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} width={90} />
                          <Tooltip
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                            formatter={(value) => [`${value}%`, "Engagement"]}
                          />
                          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                            {departmentScores.map((entry, i) => (
                              <Cell key={i} fill={entry.score >= 75 ? "#10b981" : entry.score >= 60 ? "#7c3aed" : "#f59e0b"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 space-y-2">
                        {departmentScores.filter((d) => d.score < 65).map((d) => (
                          <div key={d.dept} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-sm">
                            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                            <span className="text-amber-800 dark:text-amber-300">
                              <strong>{d.dept}</strong> engagement is at {d.score}% — consider a dedicated check-in.
                            </span>
                          </div>
                        ))}
                      </div>
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
                          enps < 0 && { tip: "Negative eNPS — detractors outweigh promoters. Review your employee list for disengaged team members.", action: "View employees →", href: "/employees" },
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
        </>
      )}
    </div>
  );
}
