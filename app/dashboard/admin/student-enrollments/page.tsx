"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { ResourceForm } from "@/components/admin/resource-form";

interface Enrollment {
  id: string;
  userId: string;
  batchId: string;
  rollNumber: string;
  currentSemester: number;
  status: string;
}

interface StudentUser { id: string; name: string; email: string; }
interface Batch { id: string; startYear: number; endYear: number; programId: string; }
interface Program { id: string; name: string; code: string; }

export default function StudentEnrollmentsPage() {
  const [data, setData] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Enrollment | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [enrollRes, studentRes, batchRes, progRes] = await Promise.all([
      fetch("/api/admin/student-enrollments"),
      fetch("/api/admin/students"),
      fetch("/api/admin/batches"),
      fetch("/api/admin/programs"),
    ]);
    if (enrollRes.ok) setData(await enrollRes.json());
    if (studentRes.ok) setStudents(await studentRes.json());
    if (batchRes.ok) setBatches(await batchRes.json());
    if (progRes.ok) setPrograms(await progRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const batchLabel = (batchId: string) => {
    const b = batches.find((x) => x.id === batchId);
    if (!b) return batchId;
    const p = programs.find((x) => x.id === b.programId);
    return p ? `${p.code} ${b.startYear}–${b.endYear}` : `${b.startYear}–${b.endYear}`;
  };

  const columns = [
    { key: "rollNumber" as const, label: "Roll No" },
    { key: "userId" as const, label: "Student", render: (_v: Enrollment[keyof Enrollment], row: Enrollment) => { const s = students.find((x) => x.id === row.userId); return s ? s.name : row.userId; } },
    { key: "batchId" as const, label: "Batch", render: (_v: Enrollment[keyof Enrollment], row: Enrollment) => batchLabel(row.batchId) },
    { key: "currentSemester" as const, label: "Semester" },
    { key: "status" as const, label: "Status" },
  ];

  const fields = [
    { name: "userId", label: "Student", type: "select" as const, required: true, options: students.map((s) => ({ label: `${s.name} (${s.email})`, value: s.id })) },
    { name: "batchId", label: "Batch", type: "select" as const, required: true, options: batches.map((b) => ({ label: batchLabel(b.id), value: b.id })) },
    { name: "rollNumber", label: "Roll Number", type: "text" as const, required: true, placeholder: "e.g. 21CS101" },
    { name: "currentSemester", label: "Current Semester", type: "number" as const, required: true },
    { name: "status", label: "Status", type: "select" as const, required: true, options: [
      { label: "Active", value: "active" },
      { label: "Graduated", value: "graduated" },
      { label: "Dropped", value: "dropped" },
    ]},
  ];

  const handleSubmit = async (values: Record<string, string | number>) => {
    const url = editing ? `/api/admin/student-enrollments/${editing.id}` : "/api/admin/student-enrollments";
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
    if (!confirm("Delete this enrollment?")) return;
    await fetch(`/api/admin/student-enrollments/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Student Enrollments</h2>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="btn-premium !h-9 !px-4 !text-[9px]">
          <Plus className="h-3 w-3" />
          Enroll Student
        </button>
      </div>

      <DataTable columns={columns} data={data} loading={loading} onEdit={(item) => { setEditing(item); setFormOpen(true); }} onDelete={handleDelete} />

      <ResourceForm
        title={editing ? "Edit Enrollment" : "New Enrollment"}
        fields={fields}
        initialValues={editing ? { userId: editing.userId, batchId: editing.batchId, rollNumber: editing.rollNumber, currentSemester: editing.currentSemester, status: editing.status } : undefined}
        onSubmit={handleSubmit}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        isOpen={formOpen}
      />
    </div>
  );
}
