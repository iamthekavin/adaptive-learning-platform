"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { ResourceForm } from "@/components/admin/resource-form";

interface Department {
  id: string;
  name: string;
  code: string;
  institutionId: string;
}

interface Institution {
  id: string;
  name: string;
}

const columns = [
  { key: "name" as const, label: "Name" },
  { key: "code" as const, label: "Code" },
];

export default function DepartmentsPage() {
  const [data, setData] = useState<Department[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [deptRes, instRes] = await Promise.all([
      fetch("/api/admin/departments"),
      fetch("/api/admin/institutions"),
    ]);
    if (deptRes.ok) setData(await deptRes.json());
    if (instRes.ok) setInstitutions(await instRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fields = [
    { name: "name", label: "Department Name", type: "text" as const, required: true, placeholder: "e.g. Computer Science and Engineering" },
    { name: "code", label: "Code", type: "text" as const, required: true, placeholder: "e.g. CSE" },
    { name: "institutionId", label: "Institution", type: "select" as const, required: true, options: institutions.map((i) => ({ label: i.name, value: i.id })) },
  ];

  const handleSubmit = async (values: Record<string, string | number>) => {
    const url = editing ? `/api/admin/departments/${editing.id}` : "/api/admin/departments";
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
    if (!confirm("Delete this department?")) return;
    await fetch(`/api/admin/departments/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Departments</h2>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="btn-premium !h-9 !px-4 !text-[9px]">
          <Plus className="h-3 w-3" />
          Add Department
        </button>
      </div>

      <DataTable columns={columns} data={data} loading={loading} onEdit={(item) => { setEditing(item); setFormOpen(true); }} onDelete={handleDelete} />

      <ResourceForm
        title={editing ? "Edit Department" : "New Department"}
        fields={fields}
        initialValues={editing ? { name: editing.name, code: editing.code, institutionId: editing.institutionId } : undefined}
        onSubmit={handleSubmit}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        isOpen={formOpen}
      />
    </div>
  );
}
