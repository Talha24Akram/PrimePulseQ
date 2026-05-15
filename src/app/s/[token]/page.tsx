"use client";
import { useState } from "react";
import { MessageSquare, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Mock survey data — replace with Supabase fetch by token
const mockSurvey = {
  id: "1",
  title: "Weekly Pulse — May Week 2",
  description: "Quick check-in on your energy, morale, and what's on your mind. 100% anonymous — we can't see who submitted.",
  company_name: "Acme Inc.",
  questions: [
    {
      id: "q1",
      text: "On a scale of 1–10, how energized did you feel this week?",
      type: "scale",
      required: true,
      options: [],
    },
    {
      id: "q2",
      text: "Do you feel supported by your manager?",
      type: "yes_no",
      required: true,
      options: [],
    },
    {
      id: "q3",
      text: "How would you describe your current workload?",
      type: "multiple_choice",
      required: true,
      options: ["Too light", "About right", "A bit heavy", "Overwhelming"],
    },
    {
      id: "q4",
      text: "What's one thing that would make your work better?",
      type: "text",
      required: false,
      options: [],
    },
  ],
};

type Answers = Record<string, string | number>;

export default function SurveyResponsePage({ params }: { params: { token: string } }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const questions = mockSurvey.questions;
  const currentQuestion = questions[currentStep];
  const isLast = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questions.length) * 100;

  function setAnswer(questionId: string, value: string | number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function canProceed() {
    if (!currentQuestion.required) return true;
    return answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== "";
  }

  async function handleNext() {
    if (isLast) {
      setSubmitting(true);
      // TODO: submit to Supabase
      await new Promise((r) => setTimeout(r, 800));
      setSubmitted(true);
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Thank you!</h1>
          <p className="text-gray-500 mb-2">Your response has been recorded anonymously.</p>
          <p className="text-gray-500 text-sm">Your feedback helps make {mockSurvey.company_name} a better place to work.</p>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Lock className="h-3 w-3" />
            Your identity is never stored or linked to this response.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <MessageSquare className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">{mockSurvey.company_name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Lock className="h-3 w-3" />
            100% anonymous
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-violet-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {/* Survey intro on first question */}
          {currentStep === 0 && (
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{mockSurvey.title}</h1>
              <p className="text-gray-500 text-sm max-w-md mx-auto">{mockSurvey.description}</p>
            </div>
          )}

          {/* Question */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs text-gray-400 font-medium">
                Question {currentStep + 1} of {questions.length}
              </span>
              {!currentQuestion.required && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
              )}
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-6">{currentQuestion.text}</h2>

            {/* Scale */}
            {currentQuestion.type === "scale" && (
              <div className="space-y-4">
                <div className="grid grid-cols-10 gap-1.5">
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setAnswer(currentQuestion.id, n)}
                      className={cn(
                        "h-12 rounded-xl text-sm font-semibold transition-all border-2",
                        answers[currentQuestion.id] === n
                          ? "bg-violet-600 text-white border-violet-600 scale-105 shadow-md"
                          : "bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:bg-violet-50"
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
                      "py-5 rounded-xl text-base font-semibold transition-all border-2",
                      answers[currentQuestion.id] === opt
                        ? "bg-violet-600 text-white border-violet-600 shadow-md"
                        : "bg-white text-gray-700 border-gray-200 hover:border-violet-300 hover:bg-violet-50"
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
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswer(currentQuestion.id, opt)}
                    className={cn(
                      "w-full text-left px-5 py-4 rounded-xl text-sm font-medium transition-all border-2",
                      answers[currentQuestion.id] === opt
                        ? "bg-violet-600 text-white border-violet-600 shadow-md"
                        : "bg-white text-gray-700 border-gray-200 hover:border-violet-300 hover:bg-violet-50"
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
                className="resize-none"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
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
