"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Search, MoreHorizontal, Copy, Trash2, Eye, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";

const mockSurveys = [
  {
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
  },
  {
    id: "2",
    title: "Remote Work Satisfaction",
    description: "Understanding how the team feels about remote work setup.",
    status: "closed",
    frequency: "one_time",
    response_count: 21,
    sent_count: 24,
    created_at: "2025-05-05",
    closes_at: "2025-05-12",
    token: "def456",
  },
  {
    id: "3",
    title: "Q2 Engagement Check-in",
    description: "Quarterly deep-dive on engagement and culture.",
    status: "draft",
    frequency: "one_time",
    response_count: 0,
    sent_count: 0,
    created_at: "2025-05-14",
    closes_at: null,
    token: "ghi789",
  },
  {
    id: "4",
    title: "Manager Effectiveness Survey",
    description: "Anonymous feedback on management quality.",
    status: "active",
    frequency: "monthly",
    response_count: 8,
    sent_count: 24,
    created_at: "2025-05-01",
    closes_at: "2025-05-31",
    token: "jkl012",
  },
];

const statusColors = {
  active: "default",
  closed: "secondary",
  draft: "outline",
} as const;

export default function SurveysPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "draft" | "closed">("all");

  const filtered = mockSurveys.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || s.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Surveys</h1>
          <p className="text-gray-500 text-sm mt-1">{mockSurveys.length} surveys total</p>
        </div>
        <Link href="/surveys/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New survey
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
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
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
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
        {filtered.map((survey) => (
          <Card key={survey.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <Link
                      href={`/surveys/${survey.id}`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 truncate"
                    >
                      {survey.title}
                    </Link>
                    <Badge variant={statusColors[survey.status as keyof typeof statusColors]}>
                      {survey.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize text-xs">
                      {survey.frequency.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{survey.description}</p>
                  <div className="flex items-center gap-6 mt-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Response rate</p>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={survey.sent_count > 0 ? (survey.response_count / survey.sent_count) * 100 : 0}
                          className="w-24"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {survey.sent_count > 0
                            ? Math.round((survey.response_count / survey.sent_count) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Responses</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{survey.response_count} / {survey.sent_count}</p>
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

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/surveys/${survey.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-700"
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/s/${survey.token}`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {survey.status === "draft" && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-violet-600">
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium mb-1">No surveys found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
