"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { ResourceForm } from "@/components/admin/resource-form";

interface University {
  id: string;
  name: string;
  code: string;
  address: string | null;
  website: string | null;
}

const columns = [
  { key: "name" as const, label: "Name" },
  { key: "code" as const, label: "Code" },
  { key: "address" as const, label: "Address" },
  { key: "website" as const, label: "Website" },
];

const fields = [
  { name: "name", label: "University Name", type: "text" as const, required: true, placeholder: "e.g. JNTU Hyderabad" },
  { name: "code", label: "Code", type: "text" as const, required: true, placeholder: "e.g. JNTUH" },
  { name: "address", label: "Address", type: "text" as const, placeholder: "City, State" },
  { name: "website", label: "Website", type: "text" as const, placeholder: "https://..." },
];

export default function UniversitiesPage() {
  const [data, setData] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<University | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/universities");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (values: Record<string, string | number>) => {
    const url = editing
      ? `/api/admin/universities/${editing.id}`
      : "/api/admin/universities";
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
    if (!confirm("Delete this university? All child records will be removed.")) return;
    await fetch(`/api/admin/universities/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">
          Universities
        </h2>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="btn-premium !h-9 !px-4 !text-[9px]"
        >
          <Plus className="h-3 w-3" />
          Add University
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={(item) => { setEditing(item); setFormOpen(true); }}
        onDelete={handleDelete}
      />

      <ResourceForm
        title={editing ? "Edit University" : "New University"}
        fields={fields}
        initialValues={editing ? { name: editing.name, code: editing.code, address: editing.address ?? "", website: editing.website ?? "" } : undefined}
        onSubmit={handleSubmit}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        isOpen={formOpen}
      />
    </div>
  );
}
