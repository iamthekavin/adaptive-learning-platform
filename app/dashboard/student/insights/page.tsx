"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, BookOpen, TrendingUp, AlertTriangle, ChevronRight } from "lucide-react";

interface COInsight {
  coId: string;
  coCode: string;
  coDescription: string;
  totalQuestions: number;
  correctAnswers: number;
  masteryPct: number;
  level: string;
}

interface DifficultyBreakdown {
  difficulty: string;
  total: number;
  correct: number;
  pct: number;
}

interface Recommendation {
  coCode: string;
  coDescription: string;
  level: string;
  message: string;
}

interface CourseInfo {
  courseId: string;
  courseName: string;
  courseCode: string;
}

export default function StudentInsightsPage() {
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [insights, setInsights] = useState<{
    coInsights: COInsight[];
    difficultyBreakdown: DifficultyBreakdown[];
    recommendations: Recommendation[];
    overallMastery: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/student/my-courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
        if (data.length > 0) setSelectedCourse(data[0].courseId);
      }
      setLoading(false);
    })();
  }, []);

  const fetchInsights = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setInsightsLoading(true);
    const res = await fetch(`/api/student/insights/${courseId}`);
    if (res.ok) setInsights(await res.json());
    setInsightsLoading(false);
  }, []);

  const handleGeneratePractice = async () => {
    if (!selectedCourse) return;
    setGeneratingQuiz(true);
    try {
      const res = await fetch("/api/student/reinforcement/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourse })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Navigate to the quiz taking page for this adaptive session
      window.location.href = `/dashboard/student/quizzes/${data.quizId}?sessionId=${data.sessionId}`;
    } catch (err: any) {
      alert(err.message || "Failed to generate practice quiz");
      setGeneratingQuiz(false);
    }
  };

  useEffect(() => {
    if (selectedCourse) fetchInsights(selectedCourse);
  }, [selectedCourse, fetchInsights]);

  const levelColor: Record<string, string> = {
    weak: "bg-red-500",
    developing: "bg-yellow-500",
    proficient: "bg-blue-500",
    mastered: "bg-emerald-500",
  };

  const levelBadgeColor: Record<string, string> = {
    weak: "bg-red-500/20 text-red-400",
    developing: "bg-yellow-500/20 text-yellow-400",
    proficient: "bg-blue-500/20 text-blue-400",
    mastered: "bg-emerald-500/20 text-emerald-400",
  };

  const diffColor: Record<string, string> = {
    easy: "text-emerald-400",
    medium: "text-yellow-400",
    hard: "text-red-400",
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
      <div className="mb-8 flex items-center gap-3">
        <TrendingUp className="h-4 w-4 text-white/20" />
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Learning Insights</h2>
      </div>

      {/* Course Selector */}
      <div className="mb-8">
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/30">Select Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full max-w-sm rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-white/20"
        >
          {courses.map((c) => (
            <option key={c.courseId} value={c.courseId}>{c.courseName} ({c.courseCode})</option>
          ))}
        </select>
      </div>

      {insightsLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-white/20" />
        </div>
      ) : insights ? (
        <div className="space-y-8">
          {/* Overall Mastery */}
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Overall Mastery</p>
            <p className={`text-5xl font-black ${insights.overallMastery >= 70 ? "text-emerald-400" : insights.overallMastery >= 40 ? "text-yellow-400" : "text-red-400"}`}>
              {insights.overallMastery}%
            </p>
          </div>

          {/* CO Mastery Bars */}
          <div>
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white/20">Course Outcome Mastery</h3>
            {insights.coInsights.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
                <p className="text-xs font-bold text-white/20">No quiz data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.coInsights.map((co) => (
                  <div key={co.coId} className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white/50">{co.coCode}</span>
                        <span className="text-xs text-white/30 truncate max-w-xs">{co.coDescription}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white/60">{co.masteryPct}%</span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${levelBadgeColor[co.level]}`}>{co.level}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${levelColor[co.level]}`}
                        style={{ width: `${co.masteryPct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-white/20">{co.correctAnswers}/{co.totalQuestions} correct</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Difficulty Breakdown */}
          {insights.difficultyBreakdown.length > 0 && (
            <div>
              <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white/20">Difficulty Performance</h3>
              <div className="grid grid-cols-3 gap-4">
                {insights.difficultyBreakdown.map((d) => (
                  <div key={d.difficulty} className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 text-center">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${diffColor[d.difficulty]}`}>{d.difficulty}</p>
                    <p className="text-2xl font-black text-white/70">{d.pct}%</p>
                    <p className="text-[10px] text-white/20">{d.correct}/{d.total}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {insights.recommendations.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/20">
                  <AlertTriangle className="h-3 w-3 text-yellow-400" /> Study Recommendations
                </h3>
                <button
                  onClick={handleGeneratePractice}
                  disabled={generatingQuiz}
                  className="rounded-lg bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 flex items-center gap-2 transition-colors border border-emerald-500/20"
                >
                  {generatingQuiz && <Loader2 className="h-3 w-3 animate-spin" />}
                  Generate Targeted Practice
                </button>
              </div>
              <div className="space-y-2">
                {insights.recommendations.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-yellow-500/10 bg-yellow-500/[0.03] px-4 py-3">
                    <ChevronRight className="h-3 w-3 text-yellow-400 shrink-0" />
                    <p className="text-xs text-white/60">{r.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
          <p className="text-xs font-bold text-white/20">Select a course to view insights</p>
        </div>
      )}
    </div>
  );
}
