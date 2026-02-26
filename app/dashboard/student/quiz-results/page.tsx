"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Trophy, ArrowLeft } from "lucide-react";

interface QuizResult {
  sessionId: string;
  quizId: string;
  quizTitle: string;
  courseName: string;
  courseCode: string;
  score: number | null;
  totalMarks: number | null;
  status: string;
  startedAt: string;
  submittedAt: string | null;
}

export default function QuizResultsPage() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/student/quiz-sessions");
      if (res.ok) setResults(await res.json());
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-white/20" />
      </div>
    );
  }

  return (
    <div>
      <Link href="/dashboard/student/quizzes" className="mb-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back to Quizzes
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <Trophy className="h-4 w-4 text-white/20" />
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Quiz Results</h2>
      </div>

      {results.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
          <p className="text-xs font-bold uppercase tracking-widest text-white/20">No quiz attempts yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.04]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Quiz</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Course</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Score</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">%</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const pct = r.totalMarks && r.score !== null ? Math.round((r.score / r.totalMarks) * 100) : null;
                const pctColor = pct !== null ? (pct >= 70 ? "text-emerald-400" : pct >= 40 ? "text-yellow-400" : "text-red-400") : "text-white/30";
                return (
                  <tr key={r.sessionId} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-white/70">{r.quizTitle}</td>
                    <td className="px-4 py-3 text-sm font-medium text-white/40">{r.courseName} ({r.courseCode})</td>
                    <td className="px-4 py-3 text-sm font-bold text-white/70">{r.score ?? "—"} / {r.totalMarks ?? "—"}</td>
                    <td className={`px-4 py-3 text-sm font-black ${pctColor}`}>{pct !== null ? `${pct}%` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${r.status === "submitted" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-white/30">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "In progress"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
