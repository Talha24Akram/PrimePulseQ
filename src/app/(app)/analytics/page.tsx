"use client";
import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEngagementColor, getEngagementLabel } from "@/lib/utils";

const engagementTrend = [
  { week: "Apr W1", score: 62, responseRate: 55 },
  { week: "Apr W2", score: 65, responseRate: 60 },
  { week: "Apr W3", score: 61, responseRate: 52 },
  { week: "Apr W4", score: 68, responseRate: 63 },
  { week: "May W1", score: 72, responseRate: 70 },
  { week: "May W2", score: 74, responseRate: 68 },
];

const departmentScores = [
  { dept: "Engineering", score: 78, count: 10 },
  { dept: "Design", score: 82, count: 4 },
  { dept: "Marketing", score: 69, count: 3 },
  { dept: "Sales", score: 61, count: 3 },
  { dept: "HR", score: 75, count: 2 },
  { dept: "Product", score: 71, count: 2 },
];

const sentimentData = [
  { name: "Positive", value: 52, color: "#10b981" },
  { name: "Neutral", value: 31, color: "#94a3b8" },
  { name: "Negative", value: 17, color: "#f59e0b" },
];

const topicFrequency = [
  { topic: "Work-life balance", mentions: 14, sentiment: "negative" },
  { topic: "Team collaboration", mentions: 11, sentiment: "positive" },
  { topic: "Career growth", mentions: 9, sentiment: "negative" },
  { topic: "Manager support", mentions: 8, sentiment: "positive" },
  { topic: "Workload", mentions: 7, sentiment: "negative" },
  { topic: "Company direction", mentions: 6, sentiment: "positive" },
];

const burnoutSignals = [
  { label: "High exhaustion reported", risk: "moderate", count: 5 },
  { label: "Work-life balance < 5/10", risk: "high", count: 3 },
  { label: "Manager support rating low", risk: "low", count: 2 },
  { label: "Silent employees (no response 2+ wks)", risk: "moderate", count: 4 },
];

const riskColors = {
  low: { bg: "bg-emerald-50", text: "text-emerald-700", badge: "success" as const },
  moderate: { bg: "bg-amber-50", text: "text-amber-700", badge: "warning" as const },
  high: { bg: "bg-red-50", text: "text-red-700", badge: "destructive" as const },
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"4w" | "8w" | "12w">("8w");

  const currentScore = engagementTrend[engagementTrend.length - 1].score;
  const prevScore = engagementTrend[engagementTrend.length - 2].score;
  const scoreDelta = currentScore - prevScore;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-200 text-sm mt-1">Team engagement intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {(["4w", "8w", "12w"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p ? "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300" : "text-gray-500 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {p === "4w" ? "4 weeks" : p === "8w" ? "8 weeks" : "12 weeks"}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-gray-500 font-medium mb-2">Engagement Score</p>
            <p className={`text-3xl font-bold ${getEngagementColor(currentScore)}`}>{currentScore}%</p>
            <div className="flex items-center gap-1 mt-1">
              {scoreDelta >= 0
                ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                : <TrendingDown className="h-3 w-3 text-red-500" />
              }
              <span className={`text-xs font-medium ${scoreDelta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {scoreDelta >= 0 ? "+" : ""}{scoreDelta}% vs last week
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
            <p className="text-3xl font-bold text-gray-900 dark:text-white">68%</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600">+12% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-gray-500 font-medium mb-2">Burnout Risk</p>
            <p className="text-3xl font-bold text-amber-500">22%</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600">-5% from last month</span>
            </div>
            <Badge variant="warning" className="mt-2 text-xs">Moderate</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-gray-500 font-medium mb-2">eNPS Score</p>
            <p className="text-3xl font-bold text-violet-600">+34</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600">+8 this quarter</span>
            </div>
            <Badge variant="success" className="mt-2 text-xs">Good</Badge>
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
          <div className="grid grid-cols-3 gap-6">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Engagement Score Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={engagementTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                      formatter={(value) => [`${value}%`, ""]}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#7c3aed"
                      strokeWidth={2.5}
                      dot={{ fill: "#7c3aed", r: 4 }}
                      name="Engagement"
                    />
                    <Line
                      type="monotone"
                      dataKey="responseRate"
                      stroke="#c4b5fd"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      name="Response Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-6 mt-2 justify-center">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="h-0.5 w-5 bg-violet-600" />
                    Engagement score
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="h-0.5 w-5 bg-violet-300" style={{ borderTop: "2px dashed #c4b5fd" }} />
                    Response rate
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
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
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
                        <span className="text-gray-600">{s.name}</span>
                      </div>
                      <span className="font-medium text-gray-100">{s.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Department scores */}
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Engagement by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentScores} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="dept" type="category" tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                    formatter={(value) => [`${value}%`, "Engagement"]}
                  />
                  <Bar dataKey="score" fill="#7c3aed" radius={[0, 4, 4, 0]}>
                    {departmentScores.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.score >= 75 ? "#10b981" : entry.score >= 60 ? "#7c3aed" : "#f59e0b"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {departmentScores
                  .filter((d) => d.score < 65)
                  .map((d) => (
                    <div key={d.dept} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <span className="text-amber-800">
                        <strong>{d.dept}</strong> department engagement is at {d.score}% — consider a dedicated check-in.
                      </span>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sentiment */}
        <TabsContent value="sentiment">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Most Mentioned Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topicFrequency.map((topic) => (
                  <div key={topic.topic} className="flex items-center gap-4">
                    <span className="w-40 text-sm text-gray-700 flex-shrink-0">{topic.topic}</span>
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${(topic.mentions / 14) * 100}%`,
                            backgroundColor: topic.sentiment === "positive" ? "#10b981" : "#f59e0b",
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-16">{topic.mentions} mentions</span>
                    </div>
                    <Badge variant={topic.sentiment === "positive" ? "success" : "warning"} className="text-xs capitalize w-20 justify-center">
                      {topic.sentiment}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Burnout signals */}
        <TabsContent value="burnout">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Burnout Risk Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {burnoutSignals.map((signal) => {
                  const colors = riskColors[signal.risk as keyof typeof riskColors];
                  return (
                    <div key={signal.label} className={`flex items-center justify-between p-3 rounded-lg border ${colors.bg}`}>
                      <div className="flex items-center gap-3">
                        {signal.risk === "high"
                          ? <AlertTriangle className={`h-4 w-4 ${colors.text}`} />
                          : signal.risk === "moderate"
                          ? <AlertTriangle className={`h-4 w-4 ${colors.text}`} />
                          : <CheckCircle2 className={`h-4 w-4 ${colors.text}`} />
                        }
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
                <CardTitle className="text-base">Burnout Prevention Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { tip: "Schedule 1:1s with employees who haven't responded in 2+ weeks.", action: "View list" },
                  { tip: "Sales department has the lowest engagement. Consider a team retrospective.", action: "Open survey" },
                  { tip: "Work-life balance scores dropped. Consider reviewing workload distribution.", action: "See data" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-violet-50 border border-violet-100">
                    <div className="h-5 w-5 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-violet-900">{item.tip}</p>
                      <button className="text-xs text-violet-600 font-medium mt-1 hover:underline">{item.action} →</button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
