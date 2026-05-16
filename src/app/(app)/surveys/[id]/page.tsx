"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Send, BarChart3, Users, Clock, CheckCircle2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

interface Question {
  id: string;
  text: string;
  type: string;
  options: string[] | null;
  order_index: number;
}

interface SurveyDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  frequency: string;
  closes_at: string | null;
  created_at: string;
}

interface Response {
  id: string;
  submitted_at: string;
  answers: Record<string, string | number>;
}

export default function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: s } = await supabase.from("surveys").select("*").eq("id", id).single();
      if (!s) { setLoading(false); return; }
      setSurvey(s);

      const { data: q } = await supabase.from("questions").select("*").eq("survey_id", id).order("order_index");
      setQuestions((q ?? []) as Question[]);

      const { data: r } = await supabase.from("responses").select("*").eq("survey_id", id).order("submitted_at", { ascending: false });
      setResponses((r ?? []) as Response[]);

      setLoading(false);
    }
    load();
  }, [id]);

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/s/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function activateSurvey() {
    setActivating(true);
    const supabase = createClient();
    await supabase.from("surveys").update({ status: "active" }).eq("id", id);
    setSurvey((prev) => prev ? { ...prev, status: "active" } : prev);
    setActivating(false);
  }

  async function closeSurvey() {
    const supabase = createClient();
    await supabase.from("surveys").update({ status: "closed" }).eq("id", id);
    setSurvey((prev) => prev ? { ...prev, status: "closed" } : prev);
  }

  // Aggregate answers per question
  function getAnswersForQuestion(questionId: string) {
    return responses.map((r) => r.answers[questionId]).filter((a) => a !== undefined);
  }

  function getAvgScore(answers: (string | number)[]) {
    const nums = answers.filter((a): a is number => typeof a === "number");
    if (!nums.length) return null;
    return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
  }

  function countOptions(answers: (string | number)[]) {
    const counts: Record<string, number> = {};
    answers.forEach((a) => { const k = String(a); counts[k] = (counts[k] ?? 0) + 1; });
    return counts;
  }

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><div className="text-gray-400 text-sm">Loading survey...</div></div>;
  }

  if (!survey) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">Survey not found.</p>
        <Link href="/surveys"><Button variant="outline" className="mt-4">Back to surveys</Button></Link>
      </div>
    );
  }

  const responseCount = responses.length;
  const surveyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${id}`;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 sm:mb-8 gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <Link href="/surveys">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{survey.title}</h1>
              <Badge variant={survey.status === "active" ? "default" : survey.status === "closed" ? "secondary" : "outline"}>
                {survey.status}
              </Badge>
            </div>
            {survey.description && <p className="text-gray-400 text-sm">{survey.description}</p>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2" onClick={copyLink}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy link"}
          </Button>
          {survey.status === "draft" && (
            <Button size="sm" className="gap-2" onClick={activateSurvey} disabled={activating}>
              <Send className="h-3.5 w-3.5" />
              {activating ? "Activating..." : "Activate"}
            </Button>
          )}
          {survey.status === "active" && (
            <Button size="sm" variant="outline" onClick={closeSurvey}>Close survey</Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 sm:mb-8">
        {[
          { label: "Responses", value: String(responseCount), icon: Users, color: "text-violet-600" },
          { label: "Questions", value: String(questions.length), icon: BarChart3, color: "text-emerald-600" },
          { label: "Created", value: formatDate(survey.created_at), icon: CheckCircle2, color: "text-blue-600" },
          { label: "Closes", value: survey.closes_at ? formatDate(survey.closes_at) : "—", icon: Clock, color: "text-amber-500" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">{stat.label}</p>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Share link */}
      <Card className="mb-6 sm:mb-8 border-violet-300 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/5">
        <CardContent className="p-4 sm:p-5 flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Anonymous survey link</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 truncate">
              {surveyUrl}
            </p>
          </div>
          <Button variant="outline" onClick={copyLink} className="flex-shrink-0">
            {copied ? "Copied!" : "Copy"}
          </Button>
        </CardContent>
      </Card>

      {/* Questions & Responses */}
      <Tabs defaultValue="results">
        <TabsList className="mb-6">
          <TabsTrigger value="results">Results ({responseCount})</TabsTrigger>
          <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          {responseCount === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-400">
                <p className="text-lg font-medium mb-1">No responses yet</p>
                <p className="text-sm">Share the link above with your employees to start collecting responses.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => {
                const qAnswers = getAnswersForQuestion(q.id);
                if (qAnswers.length === 0) return null;

                return (
                  <Card key={q.id}>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">{q.text}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {q.type === "scale" && (
                        <div>
                          <p className="text-3xl font-bold text-violet-600 mb-2">{getAvgScore(qAnswers)} / 10</p>
                          <p className="text-xs text-gray-400">{qAnswers.length} responses</p>
                          <div className="flex gap-1 mt-3">
                            {[1,2,3,4,5,6,7,8,9,10].map((n) => {
                              const count = qAnswers.filter((a) => a === n).length;
                              return (
                                <div key={n} className="flex-1 flex flex-col items-center gap-1">
                                  <div className="text-xs text-gray-400">{count > 0 ? count : ""}</div>
                                  <div
                                    className="w-full rounded-sm bg-violet-500"
                                    style={{ height: `${count > 0 ? Math.max(4, (count / qAnswers.length) * 80) : 4}px`, opacity: count > 0 ? 1 : 0.15 }}
                                  />
                                  <div className="text-xs text-gray-500">{n}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {(q.type === "yes_no" || q.type === "multiple_choice") && (
                        <div className="space-y-2">
                          {Object.entries(countOptions(qAnswers))
                            .sort(([,a], [,b]) => b - a)
                            .map(([opt, count]) => (
                              <div key={opt} className="flex items-center gap-3">
                                <span className="text-sm text-gray-700 dark:text-gray-200 w-32 truncate">{opt}</span>
                                <div className="flex-1 bg-gray-100 dark:bg-white/8 rounded-full h-2">
                                  <div className="h-2 rounded-full bg-violet-500" style={{ width: `${(count / qAnswers.length) * 100}%` }} />
                                </div>
                                <span className="text-sm text-gray-500 w-16">{count} ({Math.round((count / qAnswers.length) * 100)}%)</span>
                              </div>
                            ))
                          }
                        </div>
                      )}
                      {q.type === "text" && (
                        <div className="space-y-2">
                          {qAnswers.slice(0, 5).map((a, i) => (
                            <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8 text-sm text-gray-700 dark:text-gray-200">
                              &ldquo;{a}&rdquo;
                            </div>
                          ))}
                          {qAnswers.length > 5 && <p className="text-xs text-gray-400">+{qAnswers.length - 5} more responses</p>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="questions">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-400 text-sm">No questions added yet.</CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <Card key={q.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <span className="h-7 w-7 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{q.text}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">{q.type.replace("_", " ")}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
