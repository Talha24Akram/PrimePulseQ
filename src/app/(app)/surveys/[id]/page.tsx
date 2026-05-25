"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Send, BarChart3, Users, Clock, CheckCircle2, Check, Mail, X, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import { exportSurveyPDF } from "@/lib/export-pdf";

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

interface Employee {
  id: string;
  name: string | null;
  email: string;
  department: string | null;
}

export default function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activating, setActivating] = useState(false);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

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
    await logAudit("survey.activated", { resourceType: "survey", resourceId: id });
    setActivating(false);
    // Prompt to send emails immediately
    setTimeout(() => openEmailModal(), 400);
  }

  async function closeSurvey() {
    const supabase = createClient();
    await supabase.from("surveys").update({ status: "closed" }).eq("id", id);
    setSurvey((prev) => prev ? { ...prev, status: "closed" } : prev);
    await logAudit("survey.closed", { resourceType: "survey", resourceId: id });
  }

  async function openEmailModal() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("employees")
      .select("id, name, email, department")
      .eq("workspace_id", user.id)
      .eq("is_active", true)
      .order("name");
    setEmployees((data ?? []) as Employee[]);
    setSelectedIds(new Set((data ?? []).map((e: Employee) => e.id)));
    setSendResult(null);
    setShowEmailModal(true);
  }

  async function sendEmails() {
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/send-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyId: id, employeeIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      setSendResult({ sent: data.sent ?? 0, failed: data.failed ?? 0 });
      if (data.sent > 0) await logAudit("survey.emails_sent", { resourceType: "survey", resourceId: id, metadata: { count: data.sent } });
    } catch {
      setSendResult({ sent: 0, failed: selectedIds.size });
    }
    setSending(false);
  }

  function toggleEmployee(empId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(empId) ? next.delete(empId) : next.add(empId);
      return next;
    });
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
          {responses.length > 0 && (
            <Button variant="outline" size="sm" className="gap-2" onClick={async () => {
              exportSurveyPDF(survey, questions, responses);
              await logAudit("pdf.exported", { resourceType: "survey", resourceId: id });
            }}>
              <FileDown className="h-3.5 w-3.5" />
              Export PDF
            </Button>
          )}
          {survey.status === "active" && (
            <Button size="sm" variant="outline" className="gap-2" onClick={openEmailModal}>
              <Mail className="h-3.5 w-3.5" />
              Send emails
            </Button>
          )}
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
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">Anonymous survey link</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Share this link with employees — no login required. Responses are 100% anonymous.</p>
            </div>
            <Button variant="outline" onClick={copyLink} className="flex-shrink-0">
              {copied ? "Copied!" : "Copy link"}
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 truncate">
            {surveyUrl}
          </p>
          {survey.status === "draft" && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">⚠ Activate this survey first — employees can&apos;t respond while it&apos;s a draft.</p>
          )}
          {survey.status === "active" && (
            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">✓ Survey is live — employees can respond via this link or by email invitation below.</p>
          )}
        </CardContent>
      </Card>

      {/* Email modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Send survey by email</h2>
                <p className="text-xs text-gray-400 mt-0.5">{selectedIds.size} of {employees.length} employees selected</p>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Select all */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.size === employees.length && employees.length > 0}
                  onChange={(e) => setSelectedIds(e.target.checked ? new Set(employees.map((emp) => emp.id)) : new Set())}
                  className="rounded"
                />
                Select all
              </label>
              <span className="text-xs text-gray-400">{employees.length} active employees</span>
            </div>

            {/* Employee list */}
            <div className="overflow-y-auto max-h-64 px-5 py-3 space-y-2">
              {employees.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No active employees found. Add employees first.
                </p>
              ) : (
                employees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(emp.id)}
                      onChange={() => toggleEmployee(emp.id)}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {emp.name ?? emp.email}
                      </p>
                      {emp.name && <p className="text-xs text-gray-400 truncate">{emp.email}</p>}
                    </div>
                    {emp.department && (
                      <span className="text-xs text-gray-400 flex-shrink-0">{emp.department}</span>
                    )}
                  </label>
                ))
              )}
            </div>

            {/* Result */}
            {sendResult && (
              <div className={`mx-5 mb-2 p-3 rounded-lg text-sm ${sendResult.failed === 0 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
                {sendResult.sent > 0 && `✓ ${sendResult.sent} email${sendResult.sent !== 1 ? "s" : ""} sent. `}
                {sendResult.failed > 0 && `${sendResult.failed} failed.`}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-white/10">
              <Button variant="outline" size="sm" onClick={() => setShowEmailModal(false)}>Cancel</Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={sendEmails}
                disabled={sending || selectedIds.size === 0 || employees.length === 0}
              >
                <Mail className="h-3.5 w-3.5" />
                {sending ? "Sending..." : `Send to ${selectedIds.size}`}
              </Button>
            </div>
          </div>
        </div>
      )}

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
