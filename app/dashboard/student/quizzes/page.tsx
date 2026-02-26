"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ArrowRight, Loader2, Clock, Award } from "lucide-react";

interface AvailableQuiz {
  id: string;
  title: string;
  description: string | null;
  courseName: string;
  courseCode: string;
  durationMinutes: number;
  maxAttempts: number;
  totalMarks: number;
}

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState<AvailableQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/student/quizzes");
      if (res.ok) setQuizzes(await res.json());
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
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Available Quizzes</h2>
        <Link href="/dashboard/student/quiz-results" className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors">
          View Results →
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
          <p className="text-xs font-bold uppercase tracking-widest text-white/20">No quizzes available</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {quizzes.map((q) => (
            <Link
              key={q.id}
              href={`/dashboard/student/quizzes/${q.id}`}
              className="group rounded-xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-violet-500/10 text-violet-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide group-hover:text-violet-400 transition-colors">{q.title}</h3>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{q.courseName} ({q.courseCode})</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-white/10 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Duration</p>
                  <p className="text-xs font-medium text-white/60 flex items-center gap-1"><Clock className="h-3 w-3" />{q.durationMinutes} min</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Marks</p>
                  <p className="text-xs font-medium text-white/60 flex items-center gap-1"><Award className="h-3 w-3" />{q.totalMarks}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Attempts</p>
                  <p className="text-xs font-medium text-white/60">{q.maxAttempts}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
