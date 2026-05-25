"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Upload, Mail, Trash2, UserCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { logAudit } from "@/lib/audit";
import { getEmployeeLimit, TIER_LABELS } from "@/lib/tiers";

interface Employee {
  id: string;
  name: string | null;
  email: string;
  department: string | null;
  role: string | null;
  is_active: boolean;
  created_at: string;
}

const departments = ["All", "Engineering", "Design", "Marketing", "Sales", "HR", "Product", "Operations", "Finance"];

export default function EmployeesPage() {
  const { profile } = useProfile();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "", department: "", role: "" });

  const tier = profile?.subscription_tier ?? "free";
  const isOwner = profile?.is_owner ?? false;
  const limit = getEmployeeLimit(tier, isOwner);
  const activeCount = employees.filter((e) => e.is_active).length;
  const atLimit = !isOwner && activeCount >= limit;

  const loadEmployees = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setEmployees(data as Employee[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const filtered = employees.filter((e) => {
    const matchSearch = (e.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = dept === "All" || e.department === dept;
    return matchSearch && matchDept;
  });

  function getInitials(name: string | null) {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }

  function getDaysSince(date: string) {
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  }

  async function handleAdd() {
    if (!newEmployee.email) { setAddError("Email is required."); return; }
    setAdding(true);
    setAddError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("employees").insert({
      workspace_id: user.id,
      email: newEmployee.email,
      name: newEmployee.name || null,
      department: newEmployee.department || null,
      role: newEmployee.role || null,
    });

    if (error) {
      setAddError(error.message.includes("unique") ? "This email is already added." : error.message);
    } else {
      await logAudit("employee.added", { resourceType: "employee", metadata: { email: newEmployee.email } });

      // Send welcome / confirmation email (fire and forget — don't block on failure)
      try {
        await fetch("/api/employees/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeEmail: newEmployee.email,
            employeeName: newEmployee.name || null,
            companyName: profile?.company_name ?? profile?.full_name ?? undefined,
            adminEmail: profile?.email ?? undefined,
          }),
        });
      } catch {
        // ignore — email failure should not block adding the employee
      }

      setShowAdd(false);
      setNewEmployee({ name: "", email: "", department: "", role: "" });
      await loadEmployees();
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this employee from your workspace?")) return;
    const supabase = createClient();
    await supabase.from("employees").delete().eq("id", id);
    await logAudit("employee.deleted", { resourceType: "employee", resourceId: id });
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }

  async function toggleActive(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("employees").update({ is_active: !current }).eq("id", id);
    setEmployees((prev) => prev.map((e) => e.id === id ? { ...e, is_active: !current } : e));
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const rows = lines.slice(1).map((line) => {
      const [name, email, department, role] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
      return { workspace_id: user.id, email, name: name || null, department: department || null, role: role || null };
    }).filter((r) => r.email);

    await supabase.from("employees").upsert(rows, { onConflict: "workspace_id,email" });
    await logAudit("employee.imported", { metadata: { count: rows.length } });
    await loadEmployees();
    e.target.value = "";
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeCount} active · {employees.length} total
            {!isOwner && <span className="ml-1">(limit: {limit === Infinity ? "∞" : limit} on {TIER_LABELS[tier]})</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <label className={`flex items-center gap-2 px-4 h-10 rounded-lg border border-gray-300 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer transition-colors ${atLimit ? "opacity-50 pointer-events-none" : ""}`}>
            <Upload className="h-4 w-4" />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} disabled={atLimit} />
          </label>
          <Button
            className="gap-2"
            onClick={() => { setAddError(""); setShowAdd(true); }}
            disabled={atLimit}
            title={atLimit ? `Upgrade from ${TIER_LABELS[tier]} to add more employees` : undefined}
          >
            <Plus className="h-4 w-4" />
            Add employee
          </Button>
        </div>
      </div>

      {atLimit && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          You&apos;ve reached the {limit}-employee limit on the {TIER_LABELS[tier]} plan.{" "}
          <a href="/settings?tab=billing" className="underline font-medium">Upgrade to add more.</a>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 sm:mb-8">
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
              <p className="text-xs sm:text-sm text-gray-500">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{employees.length - activeCount}</p>
              <p className="text-xs sm:text-sm text-gray-500">Inactive</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{employees.length}</p>
              <p className="text-xs sm:text-sm text-gray-500">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search employees..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {departments.map((d) => (
            <button
              key={d}
              onClick={() => setDept(d)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                dept === d ? "bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Employee list */}
      <Card>
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            {employees.length === 0 ? "No employees yet. Add your first employee or import a CSV." : "No employees match your filter."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/8">
                  <th className="text-left text-xs text-gray-400 font-medium px-4 sm:px-6 py-3">Employee</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 sm:px-6 py-3 hidden sm:table-cell">Department</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 sm:px-6 py-3">Status</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 sm:px-6 py-3 hidden md:table-cell">Added</th>
                  <th className="text-right text-xs text-gray-400 font-medium px-4 sm:px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((employee) => (
                  <tr key={employee.id} className="border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/3">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs">{getInitials(employee.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{employee.name ?? "—"}</p>
                          <p className="text-xs text-gray-500 truncate">{employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                      {employee.department ? (
                        <Badge variant="outline" className="text-xs">{employee.department}</Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        onClick={() => toggleActive(employee.id, employee.is_active)}
                        className="cursor-pointer"
                        title="Click to toggle active/inactive"
                      >
                        <Badge variant={employee.is_active ? "success" : "secondary"}>
                          {employee.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                      <span className="text-xs text-gray-500">{getDaysSince(employee.created_at)}d ago</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                        onClick={() => handleDelete(employee.id)}
                        title="Remove employee"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs text-gray-400 mt-3">
        CSV format: <code className="bg-gray-100 dark:bg-white/8 px-1 rounded">name,email,department,role</code> (first row = header)
      </p>

      {/* Add employee dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add employee</DialogTitle>
          </DialogHeader>
          {addError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
              {addError}
            </div>
          )}
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full name <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input
                placeholder="Jane Smith"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Work email <span className="text-red-400">*</span></Label>
              <Input
                type="email"
                placeholder="jane@company.com"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input
                  placeholder="Engineering"
                  value={newEmployee.department}
                  onChange={(e) => setNewEmployee((p) => ({ ...p, department: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Role <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input
                  placeholder="Engineer"
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee((p) => ({ ...p, role: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={adding}>
              {adding ? "Adding..." : "Add employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
