"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, BarChart3, AlertTriangle, Users } from "lucide-react";

interface COAnalytic {
  coId: string;
  coCode: string;
  coDescription: string;
  avgMastery: number;
  studentCount: number;
  weakCount: number;
  developingCount: number;
  proficientCount: number;
  masteredCount: number;
}

interface AtRiskStudent {
  userId: string;
  name: string;
  email: string;
  avgMastery: number;
}

interface CourseInfo {
  allocationId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
}

export default function TeacherAnalyticsPage() {
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [analytics, setAnalytics] = useState<{
    coAnalytics: COAnalytic[];
    atRiskStudents: AtRiskStudent[];
    totalStudents: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/teacher/my-courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
        if (data.length > 0) setSelectedCourse(data[0].courseId);
      }
      setLoading(false);
    })();
  }, []);

  const fetchAnalytics = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setAnalyticsLoading(true);
    const res = await fetch(`/api/teacher/analytics/${courseId}`);
    if (res.ok) setAnalytics(await res.json());
    setAnalyticsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedCourse) fetchAnalytics(selectedCourse);
  }, [selectedCourse, fetchAnalytics]);

  const levelColor: Record<string, string> = {
    weak: "bg-red-500",
    developing: "bg-yellow-500",
    proficient: "bg-blue-500",
    mastered: "bg-emerald-500",
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
        <BarChart3 className="h-4 w-4 text-white/20" />
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Course Analytics</h2>
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

      {analyticsLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-white/20" />
        </div>
      ) : analytics ? (
        <div className="space-y-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-6 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Total Students</p>
              <p className="text-3xl font-black text-white/70">{analytics.totalStudents}</p>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-6 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Course Outcomes</p>
              <p className="text-3xl font-black text-white/70">{analytics.coAnalytics.length}</p>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-6 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/40 mb-2">At-Risk Students</p>
              <p className="text-3xl font-black text-red-400">{analytics.atRiskStudents.length}</p>
            </div>
          </div>

          {/* CO Attainment */}
          <div>
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white/20">CO Attainment</h3>
            {analytics.coAnalytics.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
                <p className="text-xs font-bold text-white/20">No mastery data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.coAnalytics.map((co) => (
                  <div key={co.coId} className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white/50">{co.coCode}</span>
                        <span className="text-xs text-white/30 truncate max-w-xs">{co.coDescription}</span>
                      </div>
                      <span className="text-sm font-black text-white/60">{co.avgMastery}% avg</span>
                    </div>
                    {/* Mastery bar */}
                    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden mb-3">
                      <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${co.avgMastery}%` }} />
                    </div>
                    {/* Level distribution */}
                    <div className="grid grid-cols-4 gap-2">
                      {(["weak", "developing", "proficient", "mastered"] as const).map((level) => {
                        const count = co[`${level}Count` as keyof typeof co] as number;
                        return (
                          <div key={level} className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${levelColor[level]}`} />
                            <span className="text-[10px] text-white/30 capitalize">{level}</span>
                            <span className="text-[10px] font-bold text-white/50">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* At-Risk Students */}
          {analytics.atRiskStudents.length > 0 && (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/20">
                <AlertTriangle className="h-3 w-3 text-red-400" /> At-Risk Students
                <span className="text-[10px] text-white/10">(avg mastery &lt; 40%)</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-white/[0.04]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Student</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Email</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Avg Mastery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.atRiskStudents.map((s) => (
                      <tr key={s.userId} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-white/70 flex items-center gap-2">
                          <Users className="h-3 w-3 text-red-400" /> {s.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-white/40">{s.email}</td>
                        <td className="px-4 py-3 text-sm font-black text-red-400">{s.avgMastery}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
          <p className="text-xs font-bold text-white/20">Select a course to view analytics</p>
        </div>
      )}
    </div>
  );
}
