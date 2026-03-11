"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Loader2, FileText, ArrowRight, Eye, EyeOff } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  durationMinutes: number;
  maxAttempts: number;
  status: string;
  totalMarks: number;
  createdAt: string;
}

interface CourseAllocation {
  allocationId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
}

export default function TeacherQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<CourseAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", courseId: "", durationMinutes: 30, maxAttempts: 1 });



  const fetchData = useCallback(async () => {
    setLoading(true);
    const [qRes, cRes] = await Promise.all([
      fetch("/api/teacher/quizzes"),
      fetch("/api/teacher/my-courses"),
    ]);
    if (qRes.ok) setQuizzes(await qRes.json());
    if (cRes.ok) setCourses(await cRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/teacher/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create quiz");
        return;
      }
      setFormOpen(false);
      setForm({ title: "", description: "", courseId: "", durationMinutes: 30, maxAttempts: 1 });
      fetchData();
    } finally {
      setCreating(false);
    }
  };



  const toggleStatus = async (q: Quiz) => {
    const newStatus = q.status === "draft" ? "published" : "draft";
    await fetch(`/api/teacher/quizzes/${q.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quiz and all its questions?")) return;
    await fetch(`/api/teacher/quizzes/${id}`, { method: "DELETE" });
    fetchData();
  };

  const courseName = (courseId: string) => {
    const c = courses.find((x) => x.courseId === courseId);
    return c ? `${c.courseName} (${c.courseCode})` : courseId;
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-white/20" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Quizzes</h2>
        <div className="flex items-center gap-2">

          <button onClick={() => setFormOpen(true)} className="btn-premium !h-9 !px-4 !text-[9px]">
            <Plus className="h-3 w-3" /> Create Quiz
          </button>
        </div>
      </div>



      {/* Create Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-8">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-white">New Quiz</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/30">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-white/20" placeholder="e.g. Mid-Term Quiz 1" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/30">Course</label>
                <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} className="w-full rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-white/20">
                  <option value="">Select course...</option>
                  {courses.map((c) => (
                    <option key={c.courseId} value={c.courseId}>{c.courseName} ({c.courseCode})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/30">Duration (min)</label>
                  <input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: +e.target.value })} className="w-full rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/30">Max Attempts</label>
                  <input type="number" value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: +e.target.value })} className="w-full rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-white/20" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/30">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-white/20" rows={2} placeholder="Optional..." />
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !form.title || !form.courseId} className="btn-premium !h-9 !px-5 !text-[9px] disabled:opacity-30">
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz List */}
      {quizzes.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
          <p className="text-xs font-bold uppercase tracking-widest text-white/20">No quizzes yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((q) => (
            <div key={q.id} className="group rounded-xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all hover:border-white/[0.08]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-violet-500/10 text-violet-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">{q.title}</h3>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{courseName(q.courseId)}</p>
                  </div>
                </div>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${q.status === "published" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {q.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div><p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Duration</p><p className="text-xs font-medium text-white/60">{q.durationMinutes} min</p></div>
                <div><p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Max Attempts</p><p className="text-xs font-medium text-white/60">{q.maxAttempts}</p></div>
                <div><p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Total Marks</p><p className="text-xs font-medium text-white/60">{q.totalMarks}</p></div>
              </div>
              <div className="flex items-center gap-2 border-t border-white/[0.04] pt-4">
                <Link href={`/dashboard/teacher/quizzes/${q.id}`} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-indigo-400 transition-colors">
                  <ArrowRight className="h-3 w-3" /> Manage Questions
                </Link>
                <button onClick={() => toggleStatus(q)} className="ml-auto flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-emerald-400 transition-colors">
                  {q.status === "draft" ? <><Eye className="h-3 w-3" /> Publish</> : <><EyeOff className="h-3 w-3" /> Unpublish</>}
                </button>
                <button onClick={() => handleDelete(q.id)} className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-red-400 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

