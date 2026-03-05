"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Users, GraduationCap, Target, Plus, Pencil, Trash2 } from "lucide-react";

interface Student {
  enrollmentId: string;
  rollNumber: string;
  currentSemester: number;
  status: string;
  studentName: string;
  studentEmail: string;
}

interface CourseAllocation {
  allocationId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  credits: number;
  courseType: string;
  semesterNumber: number;
  yearNumber: number;
  programName: string;
  programCode: string;
  academicYearLabel: string;
}

interface CourseOutcome {
  id: string;
  courseId: string;
  code: string;
  description: string;
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [courseInfo, setCourseInfo] = useState<CourseAllocation | null>(null);
  const [outcomes, setOutcomes] = useState<CourseOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"students" | "outcomes">("students");
  
  // Outcome Form State
  const [formOpen, setFormOpen] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<CourseOutcome | null>(null);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [studentsRes, coursesRes] = await Promise.all([
        fetch(`/api/teacher/my-courses/${params.id}/students`),
        fetch("/api/teacher/my-courses"),
      ]);

      if (studentsRes.ok) setStudents(await studentsRes.json());

      let foundCourseId: string | null = null;
      if (coursesRes.ok) {
        const allCourses: CourseAllocation[] = await coursesRes.json();
        const found = allCourses.find((c) => c.allocationId === params.id);
        if (found) {
          setCourseInfo(found);
          foundCourseId = found.courseId;
        }
      }

      if (foundCourseId) {
        const outcomesRes = await fetch(`/api/teacher/courses/${foundCourseId}/outcomes`);
        if (outcomesRes.ok) {
          setOutcomes(await outcomesRes.json());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOutcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseInfo) return;
    
    setSubmitting(true);
    setError(null);
    
    const url = editingOutcome 
      ? `/api/teacher/courses/${courseInfo.courseId}/outcomes/${editingOutcome.id}`
      : `/api/teacher/courses/${courseInfo.courseId}/outcomes`;
      
    try {
      const res = await fetch(url, {
        method: editingOutcome ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, description }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save outcome");
      }
      
      setFormOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOutcomeDelete = async (id: string) => {
    if (!courseInfo || !confirm("Are you sure you want to delete this Course Outcome?")) return;
    
    try {
      const res = await fetch(`/api/teacher/courses/${courseInfo.courseId}/outcomes/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete outcome");
      }
      
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openForm = (outcome?: CourseOutcome) => {
    if (outcome) {
      setEditingOutcome(outcome);
      setCode(outcome.code);
      setDescription(outcome.description);
    } else {
      setEditingOutcome(null);
      setCode("");
      setDescription("");
    }
    setError(null);
    setFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-white/20" />
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400",
    graduated: "bg-blue-500/20 text-blue-400",
    dropped: "bg-red-500/20 text-red-400",
  };

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/dashboard/teacher/my-courses"
        className="mb-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Courses
      </Link>

      {/* Course Header */}
      {courseInfo && (
        <div className="mb-8 border-b border-white/[0.04] pb-8">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-1">
            {courseInfo.courseName}
          </h2>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30">
            {courseInfo.courseCode} · {courseInfo.programName} · Year{" "}
            {courseInfo.yearNumber} Sem {courseInfo.semesterNumber} ·{" "}
            {courseInfo.academicYearLabel}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8 flex border-b border-white/[0.04]">
        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
            activeTab === "students"
              ? "border-b-2 border-primary text-white"
              : "text-white/30 hover:text-white/70"
          }`}
        >
          <Users className="h-4 w-4" />
          Enrolled Students
        </button>
        <button
          onClick={() => setActiveTab("outcomes")}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
            activeTab === "outcomes"
              ? "border-b-2 border-primary text-white"
              : "text-white/30 hover:text-white/70"
          }`}
        >
          <Target className="h-4 w-4" />
          Course Outcomes
        </button>
      </div>

      {activeTab === "students" && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">
              Students ({students.length})
            </span>
          </div>

          {students.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
              <p className="text-xs font-bold uppercase tracking-widest text-white/20">
                No students enrolled yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/[0.04]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Roll No</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Name</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Email</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Semester</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.enrollmentId} className="border-b border-white/[0.02] transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-sm font-bold text-white/70 uppercase tracking-wide">{s.rollNumber}</td>
                      <td className="px-4 py-3 text-sm font-medium text-white/70 flex items-center gap-2">
                        <GraduationCap className="h-3.5 w-3.5 text-white/20" />
                        {s.studentName}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-white/40">{s.studentEmail}</td>
                      <td className="px-4 py-3 text-sm font-medium text-white/70">{s.currentSemester}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${statusColor[s.status] ?? "bg-white/10 text-white/40"}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "outcomes" && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">
              Outcomes ({outcomes.length})
            </span>
            <button onClick={() => openForm()} className="btn-premium !h-9 !px-4 !text-[9px]">
              <Plus className="h-3 w-3" />
              Add Outcome
            </button>
          </div>

          {formOpen && (
            <div className="mb-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white/50">
                {editingOutcome ? "Edit Course Outcome" : "New Course Outcome"}
              </h3>
              <form onSubmit={handleOutcomeSubmit} className="space-y-4">
                {error && (
                  <div className="rounded border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                    {error}
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/30">Code (e.g. CO1)</label>
                  <input
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-white/20"
                    placeholder="CO1"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/30">Description</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-24 rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-white/20 resize-none"
                    placeholder="Understand the fundamentals of..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="rounded px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/30 hover:text-white/70"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                    Save Outcome
                  </button>
                </div>
              </form>
            </div>
          )}

          {!formOpen && outcomes.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
              <p className="text-xs font-bold uppercase tracking-widest text-white/20">
                No course outcomes defined
              </p>
            </div>
          ) : !formOpen && (
            <div className="space-y-3">
              {outcomes.map((co) => (
                <div key={co.id} className="group relative rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 transition-colors hover:border-white/10 hover:bg-white/[0.02]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-black text-white/70">
                        {co.code}
                      </h4>
                      <p className="mt-2 text-sm text-white/40 leading-relaxed">
                        {co.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => openForm(co)}
                        className="rounded p-2 text-white/30 hover:bg-white/5 hover:text-white"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOutcomeDelete(co.id)}
                        className="rounded p-2 text-red-400/50 hover:bg-red-500/10 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
