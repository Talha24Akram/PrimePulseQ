import { TrendingUp, TrendingDown, Users, FileText, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getEngagementColor, getEngagementLabel } from "@/lib/utils";

// Demo data — replace with real Supabase queries
const stats = {
  engagement_score: 74,
  response_rate: 68,
  active_surveys: 2,
  employee_count: 24,
  burnout_risk: 22,
  trend: "up" as const,
};

const recentSurveys = [
  { id: "1", title: "Weekly Pulse — May Week 2", status: "active", responses: 16, sent: 24, closes_at: "2025-05-19" },
  { id: "2", title: "Remote Work Satisfaction", status: "closed", responses: 21, sent: 24, closes_at: "2025-05-12" },
  { id: "3", title: "Q2 Engagement Check-in", status: "draft", responses: 0, sent: 0, closes_at: null },
];

const insights = [
  { type: "positive", message: "Response rate increased 12% from last week" },
  { type: "warning", message: "3 employees haven't responded in 3+ weeks" },
  { type: "positive", message: "Work-life balance score improved to 4.1/5" },
];

const weekData = [62, 68, 65, 71, 74, 70, 74];

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Thursday, May 15, 2025</p>
        </div>
        <Link href="/surveys/new">
          <Button className="gap-2">
            <FileText className="h-4 w-4" />
            New survey
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">Engagement Score</p>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                <TrendingUp className="h-3 w-3" />
                +6%
              </div>
            </div>
            <p className={`text-3xl font-bold ${getEngagementColor(stats.engagement_score)}`}>
              {stats.engagement_score}%
            </p>
            <Badge variant={stats.engagement_score >= 75 ? "success" : stats.engagement_score >= 50 ? "warning" : "destructive"} className="mt-2">
              {getEngagementLabel(stats.engagement_score)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">Response Rate</p>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                <TrendingUp className="h-3 w-3" />
                +12%
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.response_rate}%</p>
            <Progress value={stats.response_rate} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">Active Surveys</p>
              <FileText className="h-4 w-4 text-gray-300" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.active_surveys}</p>
            <p className="text-xs text-gray-400 mt-2">of 3 total this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">Burnout Risk</p>
              {stats.burnout_risk < 30 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <p className={`text-3xl font-bold ${stats.burnout_risk < 30 ? "text-emerald-600" : "text-amber-500"}`}>
              {stats.burnout_risk}%
            </p>
            <Badge variant={stats.burnout_risk < 30 ? "success" : "warning"} className="mt-2">
              {stats.burnout_risk < 30 ? "Low risk" : "Moderate risk"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Engagement trend */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Engagement Trend</CardTitle>
              <Badge variant="success" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Improving
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40 mb-2">
                {weekData.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end gap-1">
                    <div
                      className="rounded-t-sm transition-all"
                      style={{
                        height: `${(val / 100) * 160}px`,
                        backgroundColor: i === weekData.length - 1 ? "#7c3aed" : "#ede9fe",
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <span key={d} className="text-xs text-gray-400 flex-1 text-center">{d}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className={`flex gap-3 p-3 rounded-lg text-sm ${insight.type === "positive" ? "bg-emerald-50" : "bg-amber-50"}`}>
                {insight.type === "positive"
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  : <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                }
                <p className={insight.type === "positive" ? "text-emerald-800" : "text-amber-800"}>
                  {insight.message}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent surveys */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Surveys</CardTitle>
          <Link href="/surveys">
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-gray-500">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-xs text-gray-400 font-medium px-6 py-3">Survey</th>
                <th className="text-left text-xs text-gray-400 font-medium px-6 py-3">Status</th>
                <th className="text-left text-xs text-gray-400 font-medium px-6 py-3">Responses</th>
                <th className="text-left text-xs text-gray-400 font-medium px-6 py-3">Response rate</th>
              </tr>
            </thead>
            <tbody>
              {recentSurveys.map((survey) => (
                <tr key={survey.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <Link href={`/surveys/${survey.id}`} className="font-medium text-sm text-gray-900 hover:text-violet-600">
                      {survey.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={survey.status === "active" ? "default" : survey.status === "closed" ? "secondary" : "outline"}
                    >
                      {survey.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {survey.responses} / {survey.sent}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Progress
                        value={survey.sent > 0 ? (survey.responses / survey.sent) * 100 : 0}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">
                        {survey.sent > 0 ? Math.round((survey.responses / survey.sent) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
