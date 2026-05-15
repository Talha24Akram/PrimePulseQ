"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Send, BarChart3, Users, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockSurvey = {
  id: "1",
  title: "Weekly Pulse — May Week 2",
  description: "Quick weekly check-in on energy, morale, and blockers.",
  status: "active",
  frequency: "weekly",
  response_count: 16,
  sent_count: 24,
  created_at: "2025-05-12",
  closes_at: "2025-05-19",
  token: "abc123",
  questions: [
    {
      id: "q1",
      text: "On a scale of 1–10, how energized did you feel this week?",
      type: "scale",
      responses: [8, 7, 9, 6, 8, 7, 9, 8, 5, 7, 8, 9, 6, 7, 8, 9],
      avg: 7.6,
    },
    {
      id: "q2",
      text: "Do you feel supported by your manager?",
      type: "yes_no",
      responses: { Yes: 13, No: 3 },
    },
    {
      id: "q3",
      text: "What's one thing that went well this week?",
      type: "text",
      responses: [
        "Great team standup on Monday",
        "Shipped the new feature ahead of schedule",
        "Clear priorities from leadership",
        "Good collaboration with design",
      ],
    },
  ],
};

export default function SurveyDetailPage({ params }: { params: { id: string } }) {
  const [copied, setCopied] = useState(false);
  const survey = mockSurvey;
  const responseRate = Math.round((survey.response_count / survey.sent_count) * 100);
  const surveyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${survey.token}`;

  function copyLink() {
    navigator.clipboard.writeText(surveyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <Link href="/surveys">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
              <Badge variant={survey.status === "active" ? "default" : "secondary"}>
                {survey.status}
              </Badge>
            </div>
            <p className="text-gray-500 text-sm">{survey.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={copyLink}>
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button size="sm" className="gap-2">
            <Send className="h-3.5 w-3.5" />
            Send reminder
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Responses", value: `${survey.response_count}/${survey.sent_count}`, icon: Users, color: "text-violet-600" },
          { label: "Response rate", value: `${responseRate}%`, icon: BarChart3, color: "text-emerald-600" },
          { label: "Closes", value: survey.closes_at ?? "—", icon: Clock, color: "text-amber-500" },
          { label: "Completion", value: `${responseRate}%`, icon: CheckCircle2, color: "text-blue-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              {stat.label === "Response rate" && (
                <Progress value={responseRate} className="mt-2" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Share link */}
      <Card className="mb-8 border-violet-100 bg-violet-50/50">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 mb-1">Anonymous survey link</p>
            <p className="text-sm text-gray-500 font-mono bg-white border border-gray-200 rounded-lg px-3 py-2 truncate">
              {surveyUrl}
            </p>
          </div>
          <Button variant="outline" onClick={copyLink} className="flex-shrink-0">
            {copied ? "Copied!" : "Copy"}
          </Button>
        </CardContent>
      </Card>

      {/* Results tabs */}
      <Tabs defaultValue="results">
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-6">
          {survey.questions.map((q) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-900">{q.text}</CardTitle>
                <Badge variant="outline" className="w-fit text-xs capitalize">{q.type.replace("_", " ")}</Badge>
              </CardHeader>
              <CardContent>
                {q.type === "scale" && Array.isArray(q.responses) && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-bold text-violet-600">{q.avg}</span>
                      <span className="text-gray-500 text-sm">/ 10 average</span>
                    </div>
                    <div className="flex items-end gap-1 h-20">
                      {[1,2,3,4,5,6,7,8,9,10].map((n) => {
                        const count = (q.responses as number[]).filter((r) => r === n).length;
                        const maxCount = Math.max(...[1,2,3,4,5,6,7,8,9,10].map((x) => (q.responses as number[]).filter((r) => r === x).length));
                        return (
                          <div key={n} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-500">{count > 0 ? count : ""}</span>
                            <div
                              className="w-full rounded-t-sm bg-violet-400 transition-all"
                              style={{ height: maxCount > 0 ? `${(count / maxCount) * 60}px` : "0px" }}
                            />
                            <span className="text-xs text-gray-400">{n}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {q.type === "yes_no" && !Array.isArray(q.responses) && (
                  <div className="space-y-3">
                    {Object.entries(q.responses as Record<string, number>).map(([label, count]) => {
                      const total = Object.values(q.responses as Record<string, number>).reduce((a, b) => a + b, 0);
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{label}</span>
                            <span className="text-gray-500">{pct}% ({count})</span>
                          </div>
                          <Progress value={pct} className={label === "Yes" ? "" : "[&>div]:bg-gray-400"} />
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === "text" && Array.isArray(q.responses) && (
                  <div className="space-y-2">
                    {(q.responses as string[]).map((response, i) => (
                      <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-700">
                        &ldquo;{response}&rdquo;
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          {survey.questions.map((q, i) => (
            <Card key={q.id}>
              <CardContent className="p-5 flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{q.text}</p>
                  <Badge variant="outline" className="mt-1 text-xs capitalize">{q.type.replace("_", " ")}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
