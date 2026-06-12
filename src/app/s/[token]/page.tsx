"use client";
import { useState, useEffect } from "react";
import { use } from "react";
import { CheckCircle2, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  text: string;
  type: "scale" | "yes_no" | "multiple_choice" | "text";
  required: boolean;
  options: string[] | null;
  order_index: number;
}

interface SurveyData {
  id: string;
  title: string;
  description: string | null;
  company_name: string;
  questions: Question[];
}

type Answers = Record<string, string | number>;
type LoadState = "loading" | "ready" | "not_found" | "already_used" | "expired" | "closed" | "error";

export default function SurveyResponsePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    async function loadSurvey() {
      try {
        const res = await fetch(`/api/survey/${encodeURIComponent(token)}`);
        if (res.ok) {
          const data = await res.json();
          setSurvey(data);
          setLoadState("ready");
        } else {
          const data = await res.json().catch(() => ({}));
          const errorMap: Record<string, LoadState> = {
            not_found: "not_found",
            already_used: "already_used",
            expired: "expired",
            closed: "closed",
          };
          setLoadState(errorMap[data.error] ?? "error");
        }
      } catch {
        setLoadState("error");
      }
    }
    loadSurvey();
  }, [token]);

  function setAnswer(questionId: string, value: string | number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function canProceed() {
    if (!survey) return false;
    const q = survey.questions[currentStep];
    if (!q.required) return true;
    return answers[q.id] !== undefined && answers[q.id] !== "";
  }

  async function handleNext() {
    if (!survey) return;
    const isLast = currentStep === survey.questions.length - 1;
    if (!isLast) {
      setCurrentStep((s) => s + 1);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, answers }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 410) {
          const terminalMap: Record<string, LoadState> = {
            "This survey link has already been used": "already_used",
            "This survey link has expired": "expired",
            "This survey is no longer accepting responses": "closed",
          };
          const newState = terminalMap[data.error];
          if (newState) { setLoadState(newState); return; }
        }
        if (res.status === 429) {
          setSubmitError("Too many submissions from this device. Please try again in a few minutes.");
        } else {
          setSubmitError(data.error ?? "Failed to submit. Please try again.");
        }
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loadState === "loading") {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading survey...</div>
      </div>
    );
  }

  // ── Terminal error states ────────────────────────────────────
  const terminalInfo: Record<Exclude<LoadState, "loading" | "ready">, { icon: string; title: string; body: string }> = {
    not_found: {
      icon: "🔍",
      title: "Survey not found",
      body: "This survey link is invalid or the survey has been deleted.",
    },
    already_used: {
      icon: "✅",
      title: "Already submitted",
      body: "This link has already been used to submit a response. Each link can only be used once to protect anonymity.",
    },
    expired: {
      icon: "⏰",
      title: "Link expired",
      body: "This survey link has expired. Links are valid for 7 days. Ask your HR team to resend the survey.",
    },
    closed: {
      icon: "🔒",
      title: "Survey closed",
      body: "This survey is not currently accepting responses. It may have closed or not yet been published.",
    },
    error: {
      icon: "⚠️",
      title: "Something went wrong",
      body: "Unable to load this survey. Please try refreshing or contact your HR team.",
    },
  };

  if (loadState !== "ready") {
    const info = terminalInfo[loadState];
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 text-3xl">
            {info.icon}
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{info.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{info.body}</p>
        </div>
      </div>
    );
  }

  if (!survey || survey.questions.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No questions yet</h1>
          <p className="text-gray-500">This survey has no questions. Check back later.</p>
        </div>
      </div>
    );
  }

  const questions = survey.questions;
  const currentQuestion = questions[currentStep];
  const isLast = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questions.length) * 100;

  // ── Success ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="relative min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" aria-hidden />
        <div className="relative w-full max-w-md text-center animate-fade-up">
          <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Thank you!</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-2">Your response has been recorded anonymously.</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Your feedback helps make {survey.company_name} a better place to work.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Lock className="h-3 w-3" />
            Your identity is never stored or linked to this response.
          </div>
        </div>
      </div>
    );
  }

  // ── Survey form ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/8">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="PrimePulseQ" className="h-7 w-7 object-contain" />
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{survey.company_name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Lock className="h-3 w-3" />
            100% anonymous
          </div>
        </div>
        <div className="h-1 bg-gray-100 dark:bg-white/5">
          <div className="h-1 bg-gradient-to-r from-violet-500 to-violet-600 rounded-r-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/8 dark:bg-violet-600/12 blur-[110px] rounded-full pointer-events-none" aria-hidden />
        <div className="relative w-full max-w-xl">
          {currentStep === 0 && (
            <div className="text-center mb-8 sm:mb-10 animate-fade-up">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">{survey.title}</h1>
              {survey.description && (
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">{survey.description}</p>
              )}
            </div>
          )}

          {/* Question card */}
          <div key={currentStep} className="animate-scale-in bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/8 shadow-xl shadow-gray-200/50 dark:shadow-2xl dark:shadow-black/30 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Question {currentStep + 1} of {questions.length}
              </span>
              {!currentQuestion.required && (
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-0.5 rounded-full">Optional</span>
              )}
            </div>

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 leading-snug">{currentQuestion.text}</h2>

            {/* Scale */}
            {currentQuestion.type === "scale" && (
              <div className="space-y-4">
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setAnswer(currentQuestion.id, n)}
                      className={cn(
                        "h-12 rounded-xl text-sm font-semibold transition-all border cursor-pointer",
                        answers[currentQuestion.id] === n
                          ? "bg-violet-600 text-white border-violet-500 scale-105 shadow-lg shadow-violet-900/50"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600 dark:bg-white/5 dark:text-gray-300 dark:border-white/10 dark:hover:border-violet-500/50 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>1 — Not at all</span>
                  <span>10 — Extremely</span>
                </div>
              </div>
            )}

            {/* Yes/No */}
            {currentQuestion.type === "yes_no" && (
              <div className="grid grid-cols-2 gap-3">
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswer(currentQuestion.id, opt)}
                    className={cn(
                      "py-5 rounded-xl text-base font-semibold transition-all border cursor-pointer",
                      answers[currentQuestion.id] === opt
                        ? "bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-900/50"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600 dark:bg-white/5 dark:text-gray-200 dark:border-white/10 dark:hover:border-violet-500/50 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Multiple choice */}
            {currentQuestion.type === "multiple_choice" && (
              <div className="space-y-2">
                {(currentQuestion.options ?? []).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswer(currentQuestion.id, opt)}
                    className={cn(
                      "w-full text-left px-5 py-4 rounded-xl text-sm font-medium transition-all border cursor-pointer",
                      answers[currentQuestion.id] === opt
                        ? "bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-900/50"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600 dark:bg-white/5 dark:text-gray-200 dark:border-white/10 dark:hover:border-violet-500/50 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Text */}
            {currentQuestion.type === "text" && (
              <Textarea
                placeholder="Type your response here..."
                rows={4}
                value={(answers[currentQuestion.id] as string) || ""}
                onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
              />
            )}
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {submitError}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || submitting}
              className="gap-2 px-8"
            >
              {submitting ? "Submitting..." : isLast ? "Submit response" : "Next"}
              {!isLast && !submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
