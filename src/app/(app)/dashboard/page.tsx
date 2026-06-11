"use client";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Users, FileText, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getEngagementColor, getEngagementLabel } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";

interface Survey {
  id: string;
  title: string;
  status: string;
  created_at: string;
  closes_at: string | null;
}

export default function DashboardPage() {
  const { profile } = useProfile();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [employeeCount, setEmployeeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // Load surveys
      const { data: surveyData } = await supabase
        .from("surveys")
        .select("id, title, status, created_at, closes_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (surveyData) {
        setSurveys(surveyData);

        // Response counts per survey
        const counts: Record<string, number> = {};
        await Promise.all(
          surveyData.map(async (s) => {
            const { count } = await supabase
              .from("responses")
              .select("*", { count: "exact", head: true })
              .eq("survey_id", s.id);
            counts[s.id] = count ?? 0;
          })
        );
        setResponseCounts(counts);
      }

      // Employee count
      const { count: empCount } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      setEmployeeCount(empCount ?? 0);
      setLoading(false);
    }
    loadData();
  }, []);

  const activeSurveys = surveys.filter((s) => s.status === "active").length;
  const totalResponses = Object.values(responseCounts).reduce((a, b) => a + b, 0);

  // Simple engagement score: (responses / (active * employees)) * 100, capped at 100
  const responseRate = employeeCount > 0 && activeSurveys > 0
    ? Math.min(100, Math.round((totalResponses / (activeSurveys * employeeCount)) * 100))
    : 0;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile?.full_name?.split(" ")[0];

  const stats = [
    {
      label: "Response Rate",
      value: `${responseRate}%`,
      icon: TrendingUp,
      chip: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      extra: <Progress value={responseRate} className="mt-3" />,
    },
    {
      label: "Active Surveys",
      value: String(activeSurveys),
      icon: FileText,
      chip: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
      extra: <p className="text-xs text-gray-400 mt-2">{surveys.length} total</p>,
    },
    {
      label: "Employees",
      value: String(employeeCount),
      icon: Users,
      chip: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
      extra: <p className="text-xs text-gray-400 mt-2">active</p>,
    },
    {
      label: "Total Responses",
      value: String(totalResponses),
      icon: CheckCircle2,
      chip: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
      extra: <p className="text-xs text-gray-400 mt-2">all time</p>,
    },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-4 flex-wrap animate-fade-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {greeting}{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">{today}</p>
        </div>
        <Link href="/surveys/new">
          <Button className="gap-2">
            <FileText className="h-4 w-4" />
            New survey
          </Button>
        </Link>
      </div>

      {/* Welcome message for new users */}
      {!loading && surveys.length === 0 && (
        <div className="relative mb-6 p-6 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 shadow-xl shadow-violet-600/20 animate-fade-up">
          <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
          <div className="relative">
            <h2 className="font-bold text-white text-lg mb-1">Welcome to PrimePulseQ! 👋</h2>
            <p className="text-sm text-violet-100 mb-4">Get started by adding your employees and creating your first survey.</p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/employees">
                <Button size="sm" className="!bg-white/15 !text-white border border-white/25 hover:!bg-white/25 !shadow-none !bg-none">Add employees</Button>
              </Link>
              <Link href="/surveys/new">
                <Button size="sm" className="!bg-white !text-violet-700 hover:!bg-violet-50 !shadow-none !bg-none">Create survey</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat, i) => (
          <Card key={stat.label} className="animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs sm:text-sm text-gray-500 font-medium">{stat.label}</p>
                <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center ${stat.chip}`}>
                  <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{stat.value}</p>
              {stat.extra}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent surveys */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Surveys</CardTitle>
          <Link href="/surveys">
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-gray-500">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : surveys.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No surveys yet. <Link href="/surveys/new" className="text-violet-600 hover:underline">Create your first</Link>.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/8">
                    <th className="text-left text-xs text-gray-500 font-medium px-4 sm:px-6 py-3">Survey</th>
                    <th className="text-left text-xs text-gray-500 font-medium px-4 sm:px-6 py-3">Status</th>
                    <th className="text-left text-xs text-gray-500 font-medium px-4 sm:px-6 py-3 hidden sm:table-cell">Responses</th>
                  </tr>
                </thead>
                <tbody>
                  {surveys.map((survey) => (
                    <tr key={survey.id} className="border-b border-gray-100 dark:border-white/8 last:border-0 hover:bg-gray-50 dark:hover:bg-white/3">
                      <td className="px-4 sm:px-6 py-4">
                        <Link href={`/surveys/${survey.id}`} className="font-medium text-sm text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400">
                          {survey.title}
                        </Link>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <Badge variant={survey.status === "active" ? "default" : survey.status === "closed" ? "secondary" : "outline"}>
                          {survey.status}
                        </Badge>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {responseCounts[survey.id] ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
