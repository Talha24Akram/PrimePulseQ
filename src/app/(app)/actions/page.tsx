"use client";
import { useState, useEffect, useCallback } from "react";
import { CheckSquare, Plus, Circle, Clock, CheckCircle2, Trash2, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Status = "planned" | "in-progress" | "done";

interface ActionRow {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  due_date: string | null;
  survey_id: string | null;
  created_at: string;
}

const STATUSES: { value: Status; label: string; icon: typeof Circle; color: string }[] = [
  { value: "planned", label: "Planned", icon: Circle, color: "text-gray-400" },
  { value: "in-progress", label: "In progress", icon: Clock, color: "text-amber-500" },
  { value: "done", label: "Done", icon: CheckCircle2, color: "text-emerald-500" },
];

export default function ActionsPage() {
  const { profile } = useProfile();
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("actions")
      .select("id, title, description, status, due_date, survey_id, created_at")
      .eq("workspace_id", profile.id)
      .order("created_at", { ascending: false });
    setActions((data ?? []) as ActionRow[]);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  async function addAction() {
    if (!profile || !newTitle.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("actions").insert({
      workspace_id: profile.id,
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      status: "planned",
    });
    setNewTitle("");
    setNewDesc("");
    setShowAdd(false);
    setSaving(false);
    load();
  }

  async function setStatus(id: string, status: Status) {
    const supabase = createClient();
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    await supabase
      .from("actions")
      .update({ status, completed_at: status === "done" ? new Date().toISOString() : null })
      .eq("id", id);
  }

  async function remove(id: string) {
    const supabase = createClient();
    setActions((prev) => prev.filter((a) => a.id !== id));
    await supabase.from("actions").delete().eq("id", id);
  }

  const open = actions.filter((a) => a.status !== "done");
  const done = actions.filter((a) => a.status === "done");

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Actions</h1>
          <p className="text-gray-500 text-sm mt-1">
            {open.length} open · {done.length} completed
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowAdd((s) => !s)}>
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAdd ? "Cancel" : "New action"}
        </Button>
      </div>

      {showAdd && (
        <Card className="mb-6">
          <CardContent className="p-5 space-y-3">
            <Input placeholder="What needs to happen?" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus />
            <Textarea placeholder="Details (optional)" rows={2} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            <div className="flex justify-end">
              <Button onClick={addAction} disabled={!newTitle.trim() || saving}>{saving ? "Saving…" : "Add action"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading actions…</div>
      ) : actions.length === 0 ? (
        <Card>
          <CardContent className="p-12 sm:p-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="h-7 w-7 text-violet-500" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No actions yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Track what you do in response to survey feedback. Add an action here, or use &ldquo;Add to Actions&rdquo; on an AI recommendation in Analytics.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {actions.map((a) => (
            <Card key={a.id} className={cn(a.status === "done" && "opacity-70")}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium text-gray-900 dark:text-white", a.status === "done" && "line-through text-gray-400 dark:text-gray-500")}>{a.title}</p>
                  {a.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{a.description}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {STATUSES.map((s) => {
                    const Icon = s.icon;
                    const active = a.status === s.value;
                    return (
                      <button
                        key={s.value}
                        onClick={() => setStatus(a.id, s.value)}
                        title={s.label}
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center transition-colors border",
                          active
                            ? "bg-violet-50 border-violet-200 dark:bg-violet-500/15 dark:border-violet-500/30"
                            : "border-transparent hover:bg-gray-100 dark:hover:bg-white/5"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", active ? s.color : "text-gray-300 dark:text-gray-600")} />
                      </button>
                    );
                  })}
                  <button onClick={() => remove(a.id)} title="Delete" className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
