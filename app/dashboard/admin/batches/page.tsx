"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { ResourceForm } from "@/components/admin/resource-form";

interface Batch {
  id: string;
  startYear: number;
  endYear: number;
  programId: string;
  regulationId: string;
}

interface Program {
  id: string;
  name: string;
}

interface Regulation {
  id: string;
  name: string;
  code: string;
}

const columns = [
  { key: "startYear" as const, label: "Start Year" },
  { key: "endYear" as const, label: "End Year" },
];

export default function BatchesPage() {
  const [data, setData] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Batch | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [batchRes, progRes, regRes] = await Promise.all([
      fetch("/api/admin/batches"),
      fetch("/api/admin/programs"),
      fetch("/api/admin/regulations"),
    ]);
    if (batchRes.ok) setData(await batchRes.json());
    if (progRes.ok) setPrograms(await progRes.json());
    if (regRes.ok) setRegulations(await regRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fields = [
    { name: "startYear", label: "Start Year", type: "number" as const, required: true },
    { name: "endYear", label: "End Year", type: "number" as const, required: true },
    { name: "programId", label: "Program", type: "select" as const, required: true, options: programs.map((p) => ({ label: p.name, value: p.id })) },
    { name: "regulationId", label: "Regulation", type: "select" as const, required: true, options: regulations.map((r) => ({ label: `${r.name} (${r.code})`, value: r.id })) },
  ];

  const handleSubmit = async (values: Record<string, string | number>) => {
    const url = editing ? `/api/admin/batches/${editing.id}` : "/api/admin/batches";
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
    if (!confirm("Delete this batch?")) return;
    await fetch(`/api/admin/batches/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Batches</h2>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="btn-premium !h-9 !px-4 !text-[9px]">
          <Plus className="h-3 w-3" />
          Add Batch
        </button>
      </div>

      <DataTable columns={columns} data={data} loading={loading} onEdit={(item) => { setEditing(item); setFormOpen(true); }} onDelete={handleDelete} />

      <ResourceForm
        title={editing ? "Edit Batch" : "New Batch"}
        fields={fields}
        initialValues={editing ? { startYear: editing.startYear, endYear: editing.endYear, programId: editing.programId, regulationId: editing.regulationId } : undefined}
        onSubmit={handleSubmit}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        isOpen={formOpen}
      />
    </div>
  );
}
