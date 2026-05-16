"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Copy, Trash2, Eye, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { canAccess, getTemplateLimit, TIER_LABELS } from "@/lib/tiers";

interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "active" | "closed";
  frequency: string;
  closes_at: string | null;
  created_at: string;
  response_count?: number;
}

const statusVariant = {
  active: "default",
  closed: "secondary",
  draft: "outline",
} as const;

export default function SurveysPage() {
  const { profile } = useProfile();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "draft" | "closed">("all");
  const [copied, setCopied] = useState<string | null>(null);

  const tier = profile?.subscription_tier ?? "free";
  const isOwner = profile?.is_owner ?? false;
  const templateLimit = getTemplateLimit(tier, isOwner);
  const canWeekly = canAccess("weekly_surveys", tier, isOwner);

  const loadSurveys = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("surveys")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSurveys(data as Survey[]);

      // Load response counts for each survey
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (survey) => {
          const { count } = await supabase
            .from("responses")
            .select("*", { count: "exact", head: true })
            .eq("survey_id", survey.id);
          counts[survey.id] = count ?? 0;
        })
      );
      setResponseCounts(counts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadSurveys(); }, [loadSurveys]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this survey? This cannot be undone.")) return;
    const supabase = createClient();
    await supabase.from("surveys").delete().eq("id", id);
    setSurveys((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleActivate(survey: Survey) {
    const supabase = createClient();
    const { error } = await supabase
      .from("surveys")
      .update({ status: "active" })
      .eq("id", survey.id);
    if (!error) {
      setSurveys((prev) => prev.map((s) => s.id === survey.id ? { ...s, status: "active" } : s));
    }
  }

  function copyLink(surveyId: string) {
    const url = `${window.location.origin}/s/${surveyId}`;
    navigator.clipboard.writeText(url);
    setCopied(surveyId);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = surveys.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || s.status === filter;
    return matchSearch && matchFilter;
  });

  const draftCount = surveys.filter((s) => s.status === "draft").length;
  const atTemplateLimit = !isOwner && templateLimit !== Infinity && draftCount >= templateLimit;

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><div className="text-gray-400 text-sm">Loading surveys...</div></div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Surveys</h1>
          <p className="text-gray-500 text-sm mt-1">
            {surveys.length} surveys
            {!isOwner && templateLimit !== Infinity && <span className="ml-1">(template limit: {templateLimit} on {TIER_LABELS[tier]})</span>}
          </p>
        </div>
        <Link href="/surveys/new">
          <Button className="gap-2" disabled={atTemplateLimit} title={atTemplateLimit ? "Upgrade to create more surveys" : undefined}>
            <Plus className="h-4 w-4" />
            New survey
          </Button>
        </Link>
      </div>

      {/* Weekly surveys tier note */}
      {!canWeekly && (
        <div className="mb-6 p-4 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-300 text-sm">
          Weekly & recurring surveys are available on Starter and above.{" "}
          <a href="/settings?tab=billing" className="underline font-medium">Upgrade to unlock.</a>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search surveys..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {(["all", "active", "draft", "closed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize cursor-pointer ${
                filter === f
                  ? "bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Survey list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {surveys.length === 0 ? (
              <>
                <p className="text-lg font-medium mb-1">No surveys yet</p>
                <p className="text-sm mb-4">Create your first survey to start collecting employee feedback.</p>
                <Link href="/surveys/new"><Button>Create your first survey</Button></Link>
              </>
            ) : (
              <>
                <p className="text-lg font-medium mb-1">No surveys match</p>
                <p className="text-sm">Try adjusting your search or filter.</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((survey) => {
            const responseCount = responseCounts[survey.id] ?? 0;
            return (
              <Card key={survey.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                        <Link
                          href={`/surveys/${survey.id}`}
                          className="font-semibold text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 truncate"
                        >
                          {survey.title}
                        </Link>
                        <Badge variant={statusVariant[survey.status]}>
                          {survey.status}
                        </Badge>
                        <Badge variant="outline" className="capitalize text-xs hidden sm:inline-flex">
                          {survey.frequency.replace(/-/g, " ")}
                        </Badge>
                      </div>
                      {survey.description && (
                        <p className="text-sm text-gray-500 truncate">{survey.description}</p>
                      )}
                      <div className="flex items-center gap-4 sm:gap-6 mt-3 flex-wrap">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Responses</p>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{responseCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Created</p>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{formatDate(survey.created_at)}</p>
                        </div>
                        {survey.closes_at && (
                          <div>
                            <p className="text-xs text-gray-400">Closes</p>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{formatDate(survey.closes_at)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Link href={`/surveys/${survey.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {survey.status !== "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-700"
                          onClick={() => copyLink(survey.id)}
                          title="Copy survey link"
                        >
                          {copied === survey.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      )}
                      {survey.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-violet-600"
                          onClick={() => handleActivate(survey)}
                          title="Activate survey"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                        onClick={() => handleDelete(survey.id)}
                        title="Delete survey"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
