"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, Trash2, CheckCircle, Edit2, Brain, Upload } from "lucide-react";
import { AiGenerateModal } from "@/components/teacher/ai-generate-modal";
import { AiUploadModal } from "@/components/teacher/ai-upload-modal";

interface Option { id: string; text: string; isCorrect: boolean; orderIndex: number; }
interface Question { id: string; text: string; marks: number; difficulty: string; orderIndex: number; options: Option[]; }
interface Quiz { id: string; title: string; status: string; totalMarks: number; courseId: string; durationMinutes: number; }

export default function QuizDetailPage() {
  const params = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ text: "", marks: 1, difficulty: "medium", courseOutcomeId: "", options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }] });

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const [aiGenerateOpen, setAiGenerateOpen] = useState(false);
  const [aiUploadOpen, setAiUploadOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [qRes, questRes] = await Promise.all([
      fetch(`/api/teacher/quizzes/${params.id}`),
      fetch(`/api/teacher/quizzes/${params.id}/questions`),
    ]);
    if (qRes.ok) setQuiz(await qRes.json());
    if (questRes.ok) setQuestions(await questRes.json());
    setLoading(false);
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addOption = () => setForm({ ...form, options: [...form.options, { text: "", isCorrect: false }] });
  const removeOption = (i: number) => setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) });
  const updateOption = (i: number, key: string, value: string | boolean) => {
    const opts = [...form.options];
    opts[i] = { ...opts[i], [key]: value };
    setForm({ ...form, options: opts });
  };

  const openForm = (q?: Question) => {
    if (q) {
      setEditingQuestionId(q.id);
      setForm({
        text: q.text,
        marks: q.marks,
        difficulty: q.difficulty,
        courseOutcomeId: "", // Or lookup if you fetch it
        options: q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })),
      });
    } else {
      setEditingQuestionId(null);
      setForm({ text: "", marks: 1, difficulty: "medium", courseOutcomeId: "", options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }] });
    }
    setFormOpen(true);
  };

  const handleSaveQuestion = async () => {
    setAdding(true);
    try {
      const payload = { ...form, options: form.options };
      if (!payload.courseOutcomeId) delete (payload as Record<string, unknown>).courseOutcomeId;
      
      const url = editingQuestionId 
        ? `/api/teacher/quizzes/${params.id}/questions/${editingQuestionId}`
        : `/api/teacher/quizzes/${params.id}/questions`;
        
      const res = await fetch(url, {
        method: editingQuestionId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(typeof err.error === "string" ? err.error : JSON.stringify(err.error));
        return;
      }
      setFormOpen(false);
      setEditingQuestionId(null);
      setForm({ text: "", marks: 1, difficulty: "medium", courseOutcomeId: "", options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }] });
      fetchData();
    } finally {
      setAdding(false);
    }
  };

  const deleteQuestion = async (qid: string) => {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/teacher/quizzes/${params.id}/questions/${qid}`, { method: "DELETE" });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-white/20" />
      </div>
    );
  }

  const isDraft = quiz?.status === "draft";
  const diffColor: Record<string, string> = { easy: "text-emerald-400", medium: "text-yellow-400", hard: "text-red-400" };

  return (
    <div>
      <Link href="/dashboard/teacher/quizzes" className="mb-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back to Quizzes
      </Link>

      {quiz && (
        <div className="mb-10 border-b border-white/[0.04] pb-8">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-1">{quiz.title}</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30">
            {quiz.totalMarks} marks · {quiz.durationMinutes} min ·
            <span className={`ml-1 ${quiz.status === "published" ? "text-emerald-400" : "text-yellow-400"}`}>{quiz.status}</span>
          </p>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Questions ({questions.length})</h3>
        {isDraft && quiz && (
          <div className="flex items-center gap-3">
            <button onClick={() => setAiGenerateOpen(true)} className="btn-premium !bg-indigo-500/10 !text-indigo-400 !border-indigo-500/20 hover:!bg-indigo-500/20 !h-9 !px-4 !text-[9px]">
              <Brain className="h-3 w-3 mr-1.5" /> Generate with AI
            </button>
            <button onClick={() => setAiUploadOpen(true)} className="btn-premium !bg-emerald-500/10 !text-emerald-400 !border-emerald-500/20 hover:!bg-emerald-500/20 !h-9 !px-4 !text-[9px]">
              <Upload className="h-3 w-3 mr-1.5" /> Upload Paper
            </button>
            <button onClick={() => openForm()} className="btn-premium !h-9 !px-4 !text-[9px]">
              <Plus className="h-3 w-3" /> Add Question
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Question Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-auto py-8">
          <div className="w-full max-w-lg rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-8">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-white">
              {editingQuestionId ? "Edit Question" : "New Question"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/30">Question Text</label>
                <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="w-full rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-white/20" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/30">Marks</label>
                  <input type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: +e.target.value })} className="w-full rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/30">Difficulty</label>
                  <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="w-full rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-white/20">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Options</label>
                  <button onClick={addOption} className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300">+ Add Option</button>
                </div>
                {form.options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <button onClick={() => updateOption(i, "isCorrect", !o.isCorrect)} className={`shrink-0 h-5 w-5 rounded border flex items-center justify-center transition-colors ${o.isCorrect ? "border-emerald-400 bg-emerald-400/20" : "border-white/10"}`}>
                      {o.isCorrect && <CheckCircle className="h-3 w-3 text-emerald-400" />}
                    </button>
                    <input value={o.text} onChange={(e) => updateOption(i, "text", e.target.value)} placeholder={`Option ${i + 1}`} className="w-full rounded border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-sm text-white outline-none focus:border-white/20" />
                    {form.options.length > 2 && (
                      <button onClick={() => removeOption(i)} className="text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSaveQuestion} disabled={adding || !form.text || form.options.some((o) => !o.text)} className="btn-premium !h-9 !px-5 !text-[9px] disabled:opacity-30">
                {adding ? "Saving..." : editingQuestionId ? "Save Changes" : "Add Question"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
          <p className="text-xs font-bold uppercase tracking-widest text-white/20">No questions yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.sort((a, b) => a.orderIndex - b.orderIndex).map((q, i) => (
            <div key={q.id} className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-3">
                  <span className="text-xs font-black text-white/20">Q{i + 1}</span>
                  <p className="text-sm font-medium text-white leading-relaxed">{q.text}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${diffColor[q.difficulty] ?? "text-white/30"}`}>{q.difficulty}</span>
                  <span className="text-[10px] font-bold text-white/30">{q.marks}m</span>
                  {isDraft && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <button onClick={() => openForm(q)} className="text-white/20 hover:text-indigo-400 p-1"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteQuestion(q.id)} className="text-white/20 hover:text-red-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
              </div>
              <div className="ml-8 space-y-1.5">
                {q.options.sort((a, b) => a.orderIndex - b.orderIndex).map((o) => (
                  <div key={o.id} className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs ${o.isCorrect ? "bg-emerald-500/10 text-emerald-400 font-bold" : "text-white/50"}`}>
                    <span className={`h-2 w-2 rounded-full shrink-0 ${o.isCorrect ? "bg-emerald-400" : "bg-white/10"}`} />
                    {o.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {quiz && (
        <>
          <AiGenerateModal
            quizId={quiz.id}
            courseId={quiz.courseId}
            isOpen={aiGenerateOpen}
            onClose={() => setAiGenerateOpen(false)}
            onSuccess={fetchData}
          />
          <AiUploadModal
            quizId={quiz.id}
            isOpen={aiUploadOpen}
            onClose={() => setAiUploadOpen(false)}
            onSuccess={fetchData}
          />
        </>
      )}
    </div>
  );
}
