"use client";
import { useState, useEffect } from "react";
import { use } from "react";
import { CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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
  status: string;
  company_name: string;
  questions: Question[];
}

type Answers = Record<string, string | number>;

export default function SurveyResponsePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [closed, setClosed] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    async function loadSurvey() {
      const supabase = createClient();

      // The token in the URL is the survey ID (public link)
      const { data: surveyData, error } = await supabase
        .from("surveys")
        .select("id, title, description, status, workspace_id")
        .eq("id", token)
        .single();

      if (error || !surveyData) { setNotFound(true); setLoading(false); return; }
      if (surveyData.status !== "active") { setClosed(true); setLoading(false); return; }

      // Load questions
      const { data: questions } = await supabase
        .from("questions")
        .select("*")
        .eq("survey_id", surveyData.id)
        .order("order_index");

      // Load workspace company name
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name")
        .eq("id", surveyData.workspace_id)
        .single();

      setSurvey({
        id: surveyData.id,
        title: surveyData.title,
        description: surveyData.description,
        status: surveyData.status,
        company_name: profile?.company_name ?? "Your Company",
        questions: (questions ?? []) as Question[],
      });
      setLoading(false);
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
    if (isLast) {
      setSubmitting(true);

      const supabase = createClient();
      await supabase.from("responses").insert({
        survey_id: survey.id,
        answers,
      });

      setSubmitted(true);
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading survey...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Survey not found</h1>
          <p className="text-gray-500">This survey link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (closed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Survey not available</h1>
          <p className="text-gray-500">This survey is not currently accepting responses. It may have closed or is not yet published.</p>
        </div>
      </div>
    );
  }

  if (!survey || survey.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No questions yet</h1>
          <p className="text-gray-500">This survey has no questions. Check back later.</p>
        </div>
      </div>
    );
  }

  const questions = survey.questions;
  const currentQuestion = questions[currentStep];
  const isLast = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questions.length) * 100;

  if (submitted) {
    return (
      <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6 overflow-hidden">
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
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
