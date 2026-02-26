"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { ResourceForm } from "@/components/admin/resource-form";

interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  type: string;
  departmentId: string;
  description: string | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const columns = [
  { key: "name" as const, label: "Name" },
  { key: "code" as const, label: "Code" },
  { key: "credits" as const, label: "Credits" },
  { key: "type" as const, label: "Type" },
];

export default function CoursesPage() {
  const [data, setData] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [courseRes, deptRes] = await Promise.all([
      fetch("/api/admin/courses"),
      fetch("/api/admin/departments"),
    ]);
    if (courseRes.ok) setData(await courseRes.json());
    if (deptRes.ok) setDepartments(await deptRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fields = [
    { name: "name", label: "Course Name", type: "text" as const, required: true, placeholder: "e.g. Data Structures" },
    { name: "code", label: "Code", type: "text" as const, required: true, placeholder: "e.g. CS201" },
    { name: "credits", label: "Credits", type: "number" as const, required: true },
    { name: "type", label: "Type", type: "select" as const, required: true, options: [
      { label: "Theory", value: "theory" },
      { label: "Lab", value: "lab" },
      { label: "Project", value: "project" },
      { label: "Elective", value: "elective" },
    ]},
    { name: "departmentId", label: "Department", type: "select" as const, required: true, options: departments.map((d) => ({ label: `${d.name} (${d.code})`, value: d.id })) },
    { name: "description", label: "Description", type: "textarea" as const, placeholder: "Optional description..." },
  ];

  const handleSubmit = async (values: Record<string, string | number>) => {
    const url = editing ? `/api/admin/courses/${editing.id}` : "/api/admin/courses";
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
    if (!confirm("Delete this course? All related mappings will be removed.")) return;
    await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Courses</h2>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="btn-premium !h-9 !px-4 !text-[9px]">
          <Plus className="h-3 w-3" />
          Add Course
        </button>
      </div>

      <DataTable columns={columns} data={data} loading={loading} onEdit={(item) => { setEditing(item); setFormOpen(true); }} onDelete={handleDelete} />

      <ResourceForm
        title={editing ? "Edit Course" : "New Course"}
        fields={fields}
        initialValues={editing ? { name: editing.name, code: editing.code, credits: editing.credits, type: editing.type, departmentId: editing.departmentId, description: editing.description ?? "" } : undefined}
        onSubmit={handleSubmit}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        isOpen={formOpen}
      />
    </div>
  );
}
