"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { ResourceForm } from "@/components/admin/resource-form";

interface SemesterCourseMap {
  id: string;
  semesterId: string;
  courseId: string;
  programId: string;
}

interface Semester { id: string; semesterNumber: number; academicYearId: string; }
interface Course { id: string; name: string; code: string; }
interface Program { id: string; name: string; code: string; }
interface AcademicYear { id: string; yearNumber: number; regulationId: string; }

export default function SemesterCourseMapsPage() {
  const [data, setData] = useState<SemesterCourseMap[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SemesterCourseMap | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [mapRes, courseRes, progRes] = await Promise.all([
      fetch("/api/admin/semester-course-maps"),
      fetch("/api/admin/courses"),
      fetch("/api/admin/programs"),
    ]);
    if (mapRes.ok) setData(await mapRes.json());
    if (courseRes.ok) setCourses(await courseRes.json());
    if (progRes.ok) setPrograms(await progRes.json());

    // Fetch semesters – these don't have a dedicated admin route yet,
    // so we build semester labels from existing data. For now, use the
    // raw semester-course-map data. We'll need a lightweight semesters API.
    // Workaround: fetch academic-years if an endpoint exists, else leave empty.
    try {
      const semRes = await fetch("/api/admin/semesters");
      if (semRes.ok) setSemesters(await semRes.json());
      const ayRes = await fetch("/api/admin/academic-years");
      if (ayRes.ok) setAcademicYears(await ayRes.json());
    } catch { /* endpoints may not exist yet */ }

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const semesterLabel = (s: Semester) => {
    const ay = academicYears.find((a) => a.id === s.academicYearId);
    return ay ? `Year ${ay.yearNumber} — Sem ${s.semesterNumber}` : `Sem ${s.semesterNumber}`;
  };

  const columns = [
    { key: "courseId" as const, label: "Course", render: (_v: SemesterCourseMap[keyof SemesterCourseMap], row: SemesterCourseMap) => { const c = courses.find((x) => x.id === row.courseId); return c ? `${c.name} (${c.code})` : row.courseId; } },
    { key: "semesterId" as const, label: "Semester", render: (_v: SemesterCourseMap[keyof SemesterCourseMap], row: SemesterCourseMap) => { const s = semesters.find((x) => x.id === row.semesterId); return s ? semesterLabel(s) : row.semesterId; } },
    { key: "programId" as const, label: "Program", render: (_v: SemesterCourseMap[keyof SemesterCourseMap], row: SemesterCourseMap) => { const p = programs.find((x) => x.id === row.programId); return p ? p.name : row.programId; } },
  ];

  const fields = [
    { name: "semesterId", label: "Semester", type: "select" as const, required: true, options: semesters.map((s) => ({ label: semesterLabel(s), value: s.id })) },
    { name: "courseId", label: "Course", type: "select" as const, required: true, options: courses.map((c) => ({ label: `${c.name} (${c.code})`, value: c.id })) },
    { name: "programId", label: "Program", type: "select" as const, required: true, options: programs.map((p) => ({ label: `${p.name} (${p.code})`, value: p.id })) },
  ];

  const handleSubmit = async (values: Record<string, string | number>) => {
    const url = editing ? `/api/admin/semester-course-maps/${editing.id}` : "/api/admin/semester-course-maps";
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
    if (!confirm("Delete this semester-course mapping?")) return;
    await fetch(`/api/admin/semester-course-maps/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Semester–Course Mappings</h2>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="btn-premium !h-9 !px-4 !text-[9px]">
          <Plus className="h-3 w-3" />
          Add Mapping
        </button>
      </div>

      <DataTable columns={columns} data={data} loading={loading} onEdit={(item) => { setEditing(item); setFormOpen(true); }} onDelete={handleDelete} />

      <ResourceForm
        title={editing ? "Edit Mapping" : "New Mapping"}
        fields={fields}
        initialValues={editing ? { semesterId: editing.semesterId, courseId: editing.courseId, programId: editing.programId } : undefined}
        onSubmit={handleSubmit}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        isOpen={formOpen}
      />
    </div>
  );
}
