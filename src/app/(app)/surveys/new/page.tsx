"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, GripVertical, BookmarkPlus, Check } from "lucide-react";
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
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/locales";

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

interface TemplateItem {
  id?: string;
  name: string;
  description: string;
  category?: string | null;
  isStarter?: boolean;
  questions: { text: string; type: QuestionType; options: string[]; required: boolean }[];
}

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
  const [dbTemplates, setDbTemplates] = useState<TemplateItem[]>([]);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [transLocale, setTransLocale] = useState<Locale>("ar");
  // qTrans: draftQuestionId -> { locale -> text }; metaTrans: locale -> {title, description}
  const [qTrans, setQTrans] = useState<Record<string, Partial<Record<Locale, string>>>>({});
  const [metaTrans, setMetaTrans] = useState<Partial<Record<Locale, { title: string; description: string }>>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("survey_templates")
      .select("id, name, description, category, is_starter, questions")
      .order("is_starter", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        setDbTemplates(
          data.map((t) => ({
            id: t.id as string,
            name: t.name as string,
            description: (t.description as string) ?? "",
            category: t.category as string | null,
            isStarter: t.is_starter as boolean,
            questions: (t.questions as TemplateItem["questions"]) ?? [],
          }))
        );
      });
  }, []);

  async function saveAsTemplate() {
    const valid = questions.filter((q) => q.text.trim());
    if (!title.trim() || valid.length === 0) {
      setSaveError("Add a title and at least one question before saving as a template.");
      return;
    }
    setSavingTemplate(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingTemplate(false); return; }
    await supabase.from("survey_templates").insert({
      workspace_id: user.id,
      name: title.trim(),
      description: description.trim() || null,
      is_starter: false,
      questions: valid.map((q) => ({ text: q.text, type: q.type, options: q.options, required: q.required })),
    });
    setSavingTemplate(false);
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 2500);
  }

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

  function applyTemplate(template: TemplateItem) {
    setTitle(template.name);
    if (template.description) setDescription(template.description);
    setQuestions(
      template.questions.map((q) => ({
        id: generateId(),
        text: q.text,
        type: q.type,
        options: q.options ?? [],
        required: q.required ?? false,
      }))
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
      const { data: insertedQuestions, error: qError } = await supabase.from("questions").insert(
        validQuestions.map((q, i) => ({
          survey_id: survey.id,
          text: q.text.trim(),
          type: q.type,
          options: q.options.length > 0 ? q.options : null,
          order_index: i,
        }))
      ).select("id, order_index");
      if (qError) { setSaveError(qError.message); setSaving(false); return; }

      // Persist translations, remapping draft IDs to the new DB question IDs.
      const byOrder = new Map((insertedQuestions ?? []).map((r) => [r.order_index as number, r.id as string]));
      const questionsTrans: Record<string, Partial<Record<Locale, string>>> = {};
      validQuestions.forEach((q, i) => {
        const dbId = byOrder.get(i);
        const t = qTrans[q.id];
        if (dbId && t && Object.keys(t).length) questionsTrans[dbId] = t;
      });
      const hasTranslations = Object.keys(questionsTrans).length > 0 || Object.keys(metaTrans).length > 0;
      if (hasTranslations) {
        await supabase
          .from("surveys")
          .update({ translations: { questions: questionsTrans, meta: metaTrans } })
          .eq("id", survey.id);
      }
    }

    await logAudit("survey.created", { resourceType: "survey", resourceId: survey.id, metadata: { title: title.trim(), status } });

    // If publishing as active, immediately email all active employees
    if (status === "active") {
      try {
        // Fetch all active employees for this workspace
        const { data: employees } = await supabase
          .from("employees")
          .select("id")
          .eq("workspace_id", user.id)
          .eq("is_active", true);

        if (employees && employees.length > 0) {
          await fetch("/api/send-survey", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              surveyId: survey.id,
              employeeIds: employees.map((e) => e.id),
            }),
          });
        }
      } catch {
        // Email failure should not block navigation
      }
    }

    setSaving(false);
    // Go to the survey detail page so they can see the link, results, and resend if needed
    router.push(`/surveys/${survey.id}`);
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 sm:mb-8">
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
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Start from a template</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(dbTemplates.length ? dbTemplates : (templates as TemplateItem[])).map((template) => (
            <button
              key={template.id ?? template.name}
              onClick={() => applyTemplate(template)}
              title={template.questions.map((q) => `• ${q.text}`).join("\n")}
              className="text-left p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:border-violet-400 hover:bg-violet-50 dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:hover:border-violet-500/50 dark:hover:bg-violet-500/10 transition-all duration-200 hover:-translate-y-0.5 group cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="font-medium text-gray-800 dark:text-gray-200 text-sm group-hover:text-violet-700 dark:group-hover:text-violet-300">{template.name}</p>
                {(template as TemplateItem).isStarter === false && (
                  <Badge variant="secondary" className="text-[10px]">Saved</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
              <p className="text-[11px] text-gray-400 mt-2">
                {template.questions.length} question{template.questions.length !== 1 ? "s" : ""}
                {(template as TemplateItem).category ? ` · ${(template as TemplateItem).category}` : ""}
              </p>
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
          <h2 className="font-semibold text-gray-900 dark:text-white">Questions</h2>
          <Badge variant="secondary">{questions.length} question{questions.length !== 1 ? "s" : ""}</Badge>
        </div>

        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <GripVertical className="h-5 w-5 text-gray-300 mt-2 flex-shrink-0" />
                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 text-xs font-bold flex items-center justify-center mt-2">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-3">
                      <Input
                        placeholder="Type your question..."
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                      />
                      <div className="flex items-center gap-3 flex-wrap">
                        <Select
                          value={question.type}
                          onValueChange={(v) => updateQuestion(question.id, { type: v as QuestionType, options: [] })}
                        >
                          <SelectTrigger className="w-40 sm:w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(questionTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
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
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10">
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                          <div key={n} className="h-9 rounded-lg bg-gray-200/70 dark:bg-white/10 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {n}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>1 — Not at all</span>
                        <span>10 — Excellent</span>
                      </div>
                    </div>
                  )}

                  {/* Multiple choice options */}
                  {question.type === "multiple_choice" && (
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-white/20 flex-shrink-0" />
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
                    <div className="flex gap-3">
                      {["Yes", "No"].map((opt) => (
                        <div key={opt} className="px-6 py-2 rounded-lg border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5 text-sm text-gray-500 dark:text-gray-400">
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

      {/* Manage translations */}
      <div className="mt-8">
        <button
          onClick={() => setShowTranslations((s) => !s)}
          className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
        >
          {showTranslations ? "Hide translations" : "🌐 Manage translations"}
        </button>

        {showTranslations && (
          <Card className="mt-3">
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center gap-3 flex-wrap">
                <Label className="mb-0">Language</Label>
                <select
                  value={transLocale}
                  onChange={(e) => setTransLocale(e.target.value as Locale)}
                  className="h-9 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm text-gray-700 dark:text-gray-200"
                >
                  {LOCALES.filter((l) => l !== "en").map((l) => (
                    <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-400">Leave a field blank to fall back to English.</span>
              </div>

              <div className="space-y-2">
                <Label>Survey title ({LOCALE_LABELS[transLocale]})</Label>
                <Input
                  dir={transLocale === "ar" ? "rtl" : "ltr"}
                  placeholder={title || "Translated title"}
                  value={metaTrans[transLocale]?.title ?? ""}
                  onChange={(e) =>
                    setMetaTrans((prev) => ({
                      ...prev,
                      [transLocale]: { title: e.target.value, description: prev[transLocale]?.description ?? "" },
                    }))
                  }
                />
              </div>

              {questions.filter((q) => q.text.trim()).map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <Label className="text-xs text-gray-500">Q{i + 1}: {q.text}</Label>
                  <Input
                    dir={transLocale === "ar" ? "rtl" : "ltr"}
                    placeholder={`Translate: ${q.text}`}
                    value={qTrans[q.id]?.[transLocale] ?? ""}
                    onChange={(e) =>
                      setQTrans((prev) => ({
                        ...prev,
                        [q.id]: { ...prev[q.id], [transLocale]: e.target.value },
                      }))
                    }
                  />
                </div>
              ))}
              <p className="text-xs text-gray-400">
                Employees receive the survey and email in their preferred language (set per employee). Button and system text are translated automatically.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-white/8">
        <Link href="/surveys">
          <Button variant="ghost" className="w-full sm:w-auto">Cancel</Button>
        </Link>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button variant="ghost" onClick={saveAsTemplate} disabled={savingTemplate} className="w-full sm:w-auto gap-2">
            {templateSaved ? <><Check className="h-4 w-4" />Saved as template</> : <><BookmarkPlus className="h-4 w-4" />{savingTemplate ? "Saving…" : "Save as template"}</>}
          </Button>
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving} className="w-full sm:w-auto">
            Save as draft
          </Button>
          <Button onClick={() => handleSave("active")} disabled={saving || !title || questions.every((q) => !q.text)} className="w-full sm:w-auto">
            {saving ? "Publishing & sending..." : "Publish & send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
