"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  Hash,
  Calendar,
  TrendingUp,
  Loader2,
  Target,
  Trophy,
  ClipboardList,
  BarChart3,
} from "lucide-react";

interface Enrollment {
  enrollmentId: string;
  rollNumber: string;
  currentSemester: number;
  status: string;
  batchStartYear: number;
  batchEndYear: number;
  programName: string;
  programCode: string;
  regulationName: string;
  regulationCode: string;
}

interface CourseInfo {
  courseId: string;
  courseName: string;
}

interface StudentStats {
  quizzesTaken: number;
  avgScore: number;
  bestScore: number;
  overallMastery: number;
}

export default function StudentOverviewPage() {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [enrollRes, courseRes, statsRes] = await Promise.all([
        fetch("/api/student/my-enrollment"),
        fetch("/api/student/my-courses"),
        fetch("/api/student/stats"),
      ]);
      if (enrollRes.ok) setEnrollment(await enrollRes.json());
      if (courseRes.ok) setCourses(await courseRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      setLoading(false);
    })();
  }, []);

  const statusColor: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400",
    graduated: "bg-blue-500/20 text-blue-400",
    dropped: "bg-red-500/20 text-red-400",
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-white/20" />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
        <p className="text-xs font-bold uppercase tracking-widest text-white/20">
          Not enrolled yet — contact your admin
        </p>
      </div>
    );
  }

  const masteryColor = (stats?.overallMastery ?? 0) >= 70 ? "text-emerald-400" : (stats?.overallMastery ?? 0) >= 40 ? "text-yellow-400" : "text-red-400";
  const avgColor = (stats?.avgScore ?? 0) >= 70 ? "text-emerald-400" : (stats?.avgScore ?? 0) >= 40 ? "text-yellow-400" : "text-red-400";

  const quickActions = [
    { label: "My Courses", desc: `Semester ${enrollment.currentSemester} subjects`, href: "/dashboard/student/my-courses", icon: BookOpen },
    { label: "Quizzes", desc: "Take available assessments", href: "/dashboard/student/quizzes", icon: ClipboardList },
    { label: "Results", desc: "View past quiz scores", href: "/dashboard/student/quiz-results", icon: Trophy },
    { label: "Insights", desc: "CO mastery & study tips", href: "/dashboard/student/insights", icon: BarChart3 },
  ];

  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20 mb-8">
        Overview
      </h2>

      {/* Enrollment Info Card */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-indigo-500/10 text-indigo-400">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              {enrollment.programName}
            </h3>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
              {enrollment.programCode} · {enrollment.regulationCode}
            </p>
          </div>
          <span
            className={`ml-auto rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${statusColor[enrollment.status] ?? "bg-white/10 text-white/40"}`}
          >
            {enrollment.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-3 w-3 text-white/20" />
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Roll No</span>
            </div>
            <p className="text-sm font-bold text-white">{enrollment.rollNumber}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3 w-3 text-white/20" />
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Semester</span>
            </div>
            <p className="text-sm font-bold text-white">{enrollment.currentSemester}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-3 w-3 text-white/20" />
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Batch</span>
            </div>
            <p className="text-sm font-bold text-white">
              {enrollment.batchStartYear}–{enrollment.batchEndYear}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-3 w-3 text-white/20" />
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Courses</span>
            </div>
            <p className="text-sm font-bold text-white">{courses.length}</p>
          </div>
        </div>
      </div>

      {/* Quiz Performance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04] mb-10 rounded-xl overflow-hidden">
        <div className="bg-black p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="h-3 w-3 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Quizzes Taken</span>
          </div>
          <p className="text-3xl font-black text-white">{stats?.quizzesTaken ?? 0}</p>
        </div>
        <div className="bg-black p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className={`h-3 w-3 ${avgColor}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Avg Score</span>
          </div>
          <p className={`text-3xl font-black ${avgColor}`}>{stats?.avgScore ?? 0}%</p>
        </div>
        <div className="bg-black p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-3 w-3 text-yellow-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Best Score</span>
          </div>
          <p className="text-3xl font-black text-yellow-400">{stats?.bestScore ?? 0}%</p>
        </div>
        <div className="bg-black p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className={`h-3 w-3 ${masteryColor}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">CO Mastery</span>
          </div>
          <p className={`text-3xl font-black ${masteryColor}`}>{stats?.overallMastery ?? 0}%</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20 mb-4 border-b border-white/[0.04] pb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04] rounded-xl overflow-hidden">
        {quickActions.map((a) => (
          <Link key={a.href} href={a.href} className="bg-black py-5 px-6 group flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <a.icon className="h-4 w-4 text-white/20 group-hover:text-indigo-400 transition-colors" />
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-white group-hover:text-indigo-400 transition-colors">{a.label}</h4>
                <p className="mt-0.5 text-[10px] font-medium text-white/20">{a.desc}</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-white/10 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
}
