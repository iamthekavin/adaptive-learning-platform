"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { ResourceForm } from "@/components/admin/resource-form";

interface Program {
  id: string;
  name: string;
  code: string;
  durationYears: number;
  departmentId: string;
}

interface Department {
  id: string;
  name: string;
}

const columns = [
  { key: "name" as const, label: "Name" },
  { key: "code" as const, label: "Code" },
  { key: "durationYears" as const, label: "Duration (Yrs)" },
];

export default function ProgramsPage() {
  const [data, setData] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [progRes, deptRes] = await Promise.all([
      fetch("/api/admin/programs"),
      fetch("/api/admin/departments"),
    ]);
    if (progRes.ok) setData(await progRes.json());
    if (deptRes.ok) setDepartments(await deptRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fields = [
    { name: "name", label: "Program Name", type: "text" as const, required: true, placeholder: "e.g. B.Tech Computer Science" },
    { name: "code", label: "Code", type: "text" as const, required: true, placeholder: "e.g. BTCSE" },
    { name: "durationYears", label: "Duration (Years)", type: "number" as const, required: true },
    { name: "departmentId", label: "Department", type: "select" as const, required: true, options: departments.map((d) => ({ label: d.name, value: d.id })) },
  ];

  const handleSubmit = async (values: Record<string, string | number>) => {
    const url = editing ? `/api/admin/programs/${editing.id}` : "/api/admin/programs";
    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.fieldErrors ? JSON.stringify(err.error.fieldErrors) : "Failed to save");
    }
    setEditing(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this program?")) return;
    await fetch(`/api/admin/programs/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Programs</h2>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="btn-premium !h-9 !px-4 !text-[9px]">
          <Plus className="h-3 w-3" />
          Add Program
        </button>
      </div>

      <DataTable columns={columns} data={data} loading={loading} onEdit={(item) => { setEditing(item); setFormOpen(true); }} onDelete={handleDelete} />

      <ResourceForm
        title={editing ? "Edit Program" : "New Program"}
        fields={fields}
        initialValues={editing ? { name: editing.name, code: editing.code, durationYears: editing.durationYears, departmentId: editing.departmentId } : undefined}
        onSubmit={handleSubmit}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        isOpen={formOpen}
      />
    </div>
  );
}
