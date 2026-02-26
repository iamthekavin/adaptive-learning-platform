"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { ResourceForm } from "@/components/admin/resource-form";

interface Institution {
  id: string;
  name: string;
  code: string;
  type: string;
  universityId: string;
}

interface University {
  id: string;
  name: string;
}

const columns = [
  { key: "name" as const, label: "Name" },
  { key: "code" as const, label: "Code" },
  { key: "type" as const, label: "Type" },
];

export default function InstitutionsPage() {
  const [data, setData] = useState<Institution[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Institution | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [instRes, uniRes] = await Promise.all([
      fetch("/api/admin/institutions"),
      fetch("/api/admin/universities"),
    ]);
    if (instRes.ok) setData(await instRes.json());
    if (uniRes.ok) setUniversities(await uniRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fields = [
    { name: "name", label: "Institution Name", type: "text" as const, required: true, placeholder: "e.g. ABC College of Engineering" },
    { name: "code", label: "Code", type: "text" as const, required: true, placeholder: "e.g. ABCCE" },
    { name: "type", label: "Type", type: "select" as const, required: true, options: [
      { label: "Engineering", value: "engineering" },
      { label: "Arts", value: "arts" },
      { label: "Science", value: "science" },
      { label: "Management", value: "management" },
      { label: "Pharmacy", value: "pharmacy" },
      { label: "Other", value: "other" },
    ]},
    { name: "universityId", label: "University", type: "select" as const, required: true, options: universities.map((u) => ({ label: u.name, value: u.id })) },
  ];

  const handleSubmit = async (values: Record<string, string | number>) => {
    const url = editing ? `/api/admin/institutions/${editing.id}` : "/api/admin/institutions";
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
    if (!confirm("Delete this institution? All child records will be removed.")) return;
    await fetch(`/api/admin/institutions/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">
          Institutions
        </h2>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="btn-premium !h-9 !px-4 !text-[9px]">
          <Plus className="h-3 w-3" />
          Add Institution
        </button>
      </div>

      <DataTable columns={columns} data={data} loading={loading} onEdit={(item) => { setEditing(item); setFormOpen(true); }} onDelete={handleDelete} />

      <ResourceForm
        title={editing ? "Edit Institution" : "New Institution"}
        fields={fields}
        initialValues={editing ? { name: editing.name, code: editing.code, type: editing.type, universityId: editing.universityId } : undefined}
        onSubmit={handleSubmit}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        isOpen={formOpen}
      />
    </div>
  );
}
