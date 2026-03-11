"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { ResourceForm } from "@/components/admin/resource-form";

interface TeacherAllocation {
  id: string;
  userId: string;
  semesterCourseMapId: string;
  academicYearLabel: string;
}

interface TeacherUser { id: string; name: string; email: string; }
interface SemesterCourseMap { id: string; semesterId: string; courseId: string; programId: string; }
interface Course { id: string; name: string; code: string; }
interface Program { id: string; name: string; code: string; }

export default function TeacherAllocationsPage() {
  const [data, setData] = useState<TeacherAllocation[]>([]);
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [maps, setMaps] = useState<SemesterCourseMap[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherAllocation | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [allocRes, mapRes, courseRes, progRes] = await Promise.all([
      fetch("/api/admin/teacher-allocations"),
      fetch("/api/admin/semester-course-maps"),
      fetch("/api/admin/courses"),
      fetch("/api/admin/programs"),
    ]);
    if (allocRes.ok) setData(await allocRes.json());
    if (mapRes.ok) setMaps(await mapRes.json());
    if (courseRes.ok) setCourses(await courseRes.json());
    if (progRes.ok) setPrograms(await progRes.json());

    // Fetch teachers (users with role=teacher) via better-auth admin API
    try {
      const tRes = await fetch("/api/admin/teachers");
      if (tRes.ok) setTeachers(await tRes.json());
    } catch { /* endpoint may not exist yet */ }

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const mapLabel = (mapId: string) => {
    const m = maps.find((x) => x.id === mapId);
    if (!m) return mapId;
    const c = courses.find((x) => x.id === m.courseId);
    const p = programs.find((x) => x.id === m.programId);
    
    if (!c) return mapId;
    
    const programCode = p ? p.code : "Unknown Program";
    return `${c.name} (${c.code}) - ${programCode}`;
  };

  const columns = [
    { key: "userId" as const, label: "Teacher", render: (_v: TeacherAllocation[keyof TeacherAllocation], row: TeacherAllocation) => { const t = teachers.find((x) => x.id === row.userId); return t ? `${t.name} (${t.email})` : row.userId; } },
    { key: "semesterCourseMapId" as const, label: "Course", render: (_v: TeacherAllocation[keyof TeacherAllocation], row: TeacherAllocation) => mapLabel(row.semesterCourseMapId) },
    { key: "academicYearLabel" as const, label: "Academic Year" },
  ];

  const fields = [
    { name: "userId", label: "Teacher", type: "select" as const, required: true, options: teachers.map((t) => ({ label: `${t.name} (${t.email})`, value: t.id })) },
    { name: "semesterCourseMapId", label: "Semester-Course", type: "select" as const, required: true, options: maps.map((m) => ({ label: mapLabel(m.id), value: m.id })) },
    { name: "academicYearLabel", label: "Academic Year", type: "text" as const, required: true, placeholder: "e.g. 2024-2025" },
  ];

  const handleSubmit = async (values: Record<string, string | number>) => {
    const url = editing ? `/api/admin/teacher-allocations/${editing.id}` : "/api/admin/teacher-allocations";
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
    if (!confirm("Delete this teacher allocation?")) return;
    await fetch(`/api/admin/teacher-allocations/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Teacher Allocations</h2>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="btn-premium !h-9 !px-4 !text-[9px]">
          <Plus className="h-3 w-3" />
          Allocate Teacher
        </button>
      </div>

      <DataTable columns={columns} data={data} loading={loading} onEdit={(item) => { setEditing(item); setFormOpen(true); }} onDelete={handleDelete} />

      <ResourceForm
        title={editing ? "Edit Allocation" : "New Allocation"}
        fields={fields}
        initialValues={editing ? { userId: editing.userId, semesterCourseMapId: editing.semesterCourseMapId, academicYearLabel: editing.academicYearLabel } : undefined}
        onSubmit={handleSubmit}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        isOpen={formOpen}
      />
    </div>
  );
}
