"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { ResourceForm } from "@/components/admin/resource-form";

interface Regulation {
  id: string;
  name: string;
  code: string;
  effectiveYear: number;
  institutionId: string;
  description: string | null;
}

interface Institution {
  id: string;
  name: string;
}

const columns = [
  { key: "name" as const, label: "Name" },
  { key: "code" as const, label: "Code" },
  { key: "effectiveYear" as const, label: "Effective Year" },
];

export default function RegulationsPage() {
  const [data, setData] = useState<Regulation[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Regulation | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [regRes, instRes] = await Promise.all([
      fetch("/api/admin/regulations"),
      fetch("/api/admin/institutions"),
    ]);
    if (regRes.ok) setData(await regRes.json());
    if (instRes.ok) setInstitutions(await instRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fields = [
    { name: "name", label: "Regulation Name", type: "text" as const, required: true, placeholder: "e.g. Regulation 2020" },
    { name: "code", label: "Code", type: "text" as const, required: true, placeholder: "e.g. R20" },
    { name: "effectiveYear", label: "Effective Year", type: "number" as const, required: true },
    { name: "institutionId", label: "Institution", type: "select" as const, required: true, options: institutions.map((i) => ({ label: i.name, value: i.id })) },
    { name: "description", label: "Description", type: "textarea" as const, placeholder: "Optional description..." },
  ];

  const handleSubmit = async (values: Record<string, string | number>) => {
    const url = editing ? `/api/admin/regulations/${editing.id}` : "/api/admin/regulations";
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
    if (!confirm("Delete this regulation?")) return;
    await fetch(`/api/admin/regulations/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Regulations</h2>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="btn-premium !h-9 !px-4 !text-[9px]">
          <Plus className="h-3 w-3" />
          Add Regulation
        </button>
      </div>

      <DataTable columns={columns} data={data} loading={loading} onEdit={(item) => { setEditing(item); setFormOpen(true); }} onDelete={handleDelete} />

      <ResourceForm
        title={editing ? "Edit Regulation" : "New Regulation"}
        fields={fields}
        initialValues={editing ? { name: editing.name, code: editing.code, effectiveYear: editing.effectiveYear, institutionId: editing.institutionId, description: editing.description ?? "" } : undefined}
        onSubmit={handleSubmit}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        isOpen={formOpen}
      />
    </div>
  );
}
