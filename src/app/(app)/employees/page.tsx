"use client";
import { useState } from "react";
import { Plus, Search, Upload, Mail, MoreHorizontal, Trash2, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mockEmployees = [
  { id: "1", name: "Alice Johnson", email: "alice@acme.com", department: "Engineering", is_active: true, last_responded: "2025-05-14" },
  { id: "2", name: "Bob Chen", email: "bob@acme.com", department: "Design", is_active: true, last_responded: "2025-05-14" },
  { id: "3", name: "Carol Davis", email: "carol@acme.com", department: "Marketing", is_active: true, last_responded: "2025-05-07" },
  { id: "4", name: "David Kim", email: "david@acme.com", department: "Engineering", is_active: true, last_responded: "2025-05-14" },
  { id: "5", name: "Eva Martinez", email: "eva@acme.com", department: "Sales", is_active: true, last_responded: null },
  { id: "6", name: "Frank Lee", email: "frank@acme.com", department: "Engineering", is_active: false, last_responded: "2025-04-21" },
  { id: "7", name: "Grace Wang", email: "grace@acme.com", department: "HR", is_active: true, last_responded: "2025-05-14" },
  { id: "8", name: "Henry Brown", email: "henry@acme.com", department: "Product", is_active: true, last_responded: "2025-05-10" },
];

const departments = ["All", "Engineering", "Design", "Marketing", "Sales", "HR", "Product"];

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "", department: "" });

  const filtered = mockEmployees.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = dept === "All" || e.department === dept;
    return matchSearch && matchDept;
  });

  const activeCount = mockEmployees.filter((e) => e.is_active).length;
  const neverResponded = mockEmployees.filter((e) => e.is_active && !e.last_responded).length;

  function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  }

  function getDaysSince(date: string | null) {
    if (!date) return null;
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-gray-500 text-sm mt-1">{activeCount} active · {mockEmployees.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button className="gap-2" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            Add employee
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
              <p className="text-sm text-gray-500">Active employees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
              <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{neverResponded}</p>
              <p className="text-sm text-gray-500">Never responded</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">68%</p>
              <p className="text-sm text-gray-500">Average response rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
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
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                dept === d ? "bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Employee table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/8">
                <th className="text-left text-xs text-gray-400 dark:text-gray-400 font-medium px-6 py-3">Employee</th>
                <th className="text-left text-xs text-gray-400 dark:text-gray-400 font-medium px-6 py-3">Department</th>
                <th className="text-left text-xs text-gray-400 dark:text-gray-400 font-medium px-6 py-3">Status</th>
                <th className="text-left text-xs text-gray-400 dark:text-gray-400 font-medium px-6 py-3">Last responded</th>
                <th className="text-right text-xs text-gray-400 dark:text-gray-400 font-medium px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => {
                const daysSince = getDaysSince(employee.last_responded);
                const isLate = daysSince !== null && daysSince > 14;
                return (
                  <tr key={employee.id} className="border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/3">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{getInitials(employee.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm text-gray-100">{employee.name}</p>
                          <p className="text-xs text-gray-500">{employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-xs">{employee.department}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={employee.is_active ? "success" : "secondary"}>
                        {employee.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {employee.last_responded ? (
                        <span className={`text-sm ${isLate ? "text-amber-600" : "text-gray-600"}`}>
                          {daysSince === 0 ? "Today" : daysSince === 1 ? "Yesterday" : `${daysSince} days ago`}
                          {isLate && " ⚠️"}
                        </span>
                      ) : (
                        <span className="text-sm text-red-500">Never responded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-violet-600">
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add employee dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                placeholder="Jane Smith"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Work email</Label>
              <Input
                type="email"
                placeholder="jane@company.com"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Department <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input
                placeholder="Engineering"
                value={newEmployee.department}
                onChange={(e) => setNewEmployee((p) => ({ ...p, department: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => setShowAdd(false)}>Add employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
