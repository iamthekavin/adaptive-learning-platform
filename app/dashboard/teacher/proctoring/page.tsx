"use client";

import { useEffect, useState } from "react";
import { Loader2, Shield, AlertTriangle } from "lucide-react";

interface FlaggedSession {
  sessionId: string;
  quizTitle: string;
  courseName: string;
  courseCode: string;
  studentName: string;
  studentEmail: string;
  score: number | null;
  totalMarks: number | null;
  riskScore: number;
  eventCount: number;
  startedAt: string;
  submittedAt: string | null;
}

export default function TeacherProctoringPage() {
  const [sessions, setSessions] = useState<FlaggedSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/teacher/proctoring");
      if (res.ok) setSessions(await res.json());
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
      <div className="mb-8 flex items-center gap-3">
        <Shield className="h-4 w-4 text-white/20" />
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Quiz Proctoring</h2>
      </div>

      {sessions.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
          <p className="text-xs font-bold uppercase tracking-widest text-white/20">No flagged sessions</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-yellow-500/10 bg-yellow-500/[0.03] px-4 py-3">
            <p className="text-xs font-bold text-yellow-400 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              {sessions.length} flagged session{sessions.length > 1 ? "s" : ""} detected
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.04]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Student</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Quiz</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Course</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Score</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Risk</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Events</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Date</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const riskColor = s.riskScore >= 80 ? "text-red-400" : s.riskScore >= 50 ? "text-yellow-400" : "text-white/40";
                  return (
                    <tr key={s.sessionId} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-white/70">{s.studentName}</p>
                        <p className="text-[10px] text-white/30">{s.studentEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-white/60">{s.quizTitle}</td>
                      <td className="px-4 py-3 text-sm text-white/40">{s.courseName} ({s.courseCode})</td>
                      <td className="px-4 py-3 text-sm font-bold text-white/60">
                        {s.score ?? "—"} / {s.totalMarks ?? "—"}
                      </td>
                      <td className={`px-4 py-3 text-sm font-black ${riskColor}`}>
                        {s.riskScore}%
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                          {s.eventCount} event{s.eventCount !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/30">
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "In progress"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
