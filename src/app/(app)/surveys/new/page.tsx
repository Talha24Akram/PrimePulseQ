"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QuestionType } from "@/lib/types";

interface QuestionDraft {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  required: boolean;
}

const questionTypeLabels: Record<QuestionType, string> = {
  scale: "1–10 Scale",
  multiple_choice: "Multiple Choice",
  text: "Open Text",
  yes_no: "Yes / No",
};

const templates = [
  {
    name: "Weekly Pulse",
    description: "Quick 3-question weekly check-in",
    questions: [
      { text: "On a scale of 1–10, how energized did you feel this week?", type: "scale" as QuestionType, options: [], required: true },
      { text: "What's one thing that went well this week?", type: "text" as QuestionType, options: [], required: false },
      { text: "Do you feel supported by your manager?", type: "yes_no" as QuestionType, options: [], required: true },
    ],
  },
  {
    name: "Burnout Check",
    description: "Detect early burnout signals",
    questions: [
      { text: "How often do you feel exhausted at the end of the workday?", type: "multiple_choice" as QuestionType, options: ["Rarely", "Sometimes", "Often", "Always"], required: true },
      { text: "Rate your current work-life balance (1 = poor, 10 = excellent)", type: "scale" as QuestionType, options: [], required: true },
      { text: "Do you feel your workload is manageable?", type: "yes_no" as QuestionType, options: [], required: true },
      { text: "What would help reduce your stress at work?", type: "text" as QuestionType, options: [], required: false },
    ],
  },
];

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function NewSurveyPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("one-time");
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { id: generateId(), text: "", type: "scale", options: [], required: true },
  ]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { id: generateId(), text: "", type: "scale", options: [], required: false },
    ]);
  }

  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function updateQuestion(id: string, updates: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  }

  function addOption(questionId: string) {
    setQuestions((prev) =>
      prev.map((q) => q.id === questionId ? { ...q, options: [...q.options, ""] } : q)
    );
  }

  function updateOption(questionId: string, index: number, value: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((o, i) => (i === index ? value : o)) }
          : q
      )
    );
  }

  function removeOption(questionId: string, index: number) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, options: q.options.filter((_, i) => i !== index) } : q
      )
    );
  }

  function applyTemplate(template: typeof templates[0]) {
    setTitle(template.name);
    setQuestions(
      template.questions.map((q) => ({ ...q, id: generateId() }))
    );
  }

  async function handleSave(status: "draft" | "active") {
    if (!title.trim()) { setSaveError("Survey title is required."); return; }
    setSaving(true);
    setSaveError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaveError("Not authenticated."); setSaving(false); return; }

    // Insert survey
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .insert({
        workspace_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        status,
        frequency,
      })
      .select()
      .single();

    if (surveyError) { setSaveError(surveyError.message); setSaving(false); return; }

    // Insert questions
    const validQuestions = questions.filter((q) => q.text.trim());
    if (validQuestions.length > 0) {
      const { error: qError } = await supabase.from("questions").insert(
        validQuestions.map((q, i) => ({
          survey_id: survey.id,
          text: q.text.trim(),
          type: q.type,
          options: q.options.length > 0 ? q.options : null,
          order_index: i,
        }))
      );
      if (qError) { setSaveError(qError.message); setSaving(false); return; }
    }

    await logAudit("survey.created", { resourceType: "survey", resourceId: survey.id, metadata: { title: title.trim(), status } });
    setSaving(false);
    router.push("/surveys");
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/surveys">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Survey</h1>
          <p className="text-sm text-gray-500 mt-0.5">Build your pulse survey</p>
        </div>
      </div>

      {/* Error */}
      {saveError && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
          {saveError}
        </div>
      )}

      {/* Templates */}
      <div className="mb-8">
        <p className="text-sm font-medium text-gray-300 mb-3">Start from a template</p>
        <div className="flex gap-3 flex-wrap">
          {templates.map((template) => (
            <button
              key={template.name}
              onClick={() => applyTemplate(template)}
              className="text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:border-violet-500/50 hover:bg-violet-500/10 transition-colors group"
            >
              <p className="font-medium text-gray-200 text-sm group-hover:text-violet-300">{template.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Survey details */}
      <Card className="mb-6">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label>Survey title</Label>
            <Input
              placeholder="e.g. Weekly Pulse — May Week 3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description <span className="text-gray-400 font-normal">(optional)</span></Label>
            <Textarea
              placeholder="Briefly explain the purpose of this survey to your employees..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One time</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Questions</h2>
          <Badge variant="secondary">{questions.length} question{questions.length !== 1 ? "s" : ""}</Badge>
        </div>

        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <GripVertical className="h-5 w-5 text-gray-300 mt-2 flex-shrink-0" />
                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold flex items-center justify-center mt-2">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-3">
                      <Input
                        placeholder="Type your question..."
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                      />
                      <div className="flex items-center gap-3">
                        <Select
                          value={question.type}
                          onValueChange={(v) => updateQuestion(question.id, { type: v as QuestionType, options: [] })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(questionTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                            className="rounded text-violet-600"
                          />
                          Required
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Scale preview */}
                  {question.type === "scale" && (
                    <div className="ml-9 p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">1 (Poor)</span>
                        <div className="flex gap-1">
                          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                            <div key={n} className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-gray-400">
                              {n}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">10 (Excellent)</span>
                      </div>
                    </div>
                  )}

                  {/* Multiple choice options */}
                  {question.type === "multiple_choice" && (
                    <div className="ml-9 space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border-2 border-white/20 flex-shrink-0" />
                          <Input
                            placeholder={`Option ${optIndex + 1}`}
                            value={option}
                            onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-300 hover:text-red-500"
                            onClick={() => removeOption(question.id, optIndex)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-violet-600 pl-6"
                        onClick={() => addOption(question.id)}
                      >
                        <Plus className="h-3 w-3" />
                        Add option
                      </Button>
                    </div>
                  )}

                  {/* Yes/No preview */}
                  {question.type === "yes_no" && (
                    <div className="ml-9 flex gap-3">
                      {["Yes", "No"].map((opt) => (
                        <div key={opt} className="px-6 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-400">
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-300 hover:text-red-500 flex-shrink-0"
                  onClick={() => removeQuestion(question.id)}
                  disabled={questions.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" className="w-full gap-2 border-dashed" onClick={addQuestion}>
          <Plus className="h-4 w-4" />
          Add question
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/8">
        <Link href="/surveys">
          <Button variant="ghost">Cancel</Button>
        </Link>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
            Save as draft
          </Button>
          <Button onClick={() => handleSave("active")} disabled={saving || !title || questions.every((q) => !q.text)}>
            {saving ? "Saving..." : "Publish & send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
