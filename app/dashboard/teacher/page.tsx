"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Users, ArrowRight, Loader2, BarChart3, ClipboardList, AlertTriangle, FileQuestion, TrendingUp, Shield } from "lucide-react";

interface TeacherStats {
  allocatedCourses: number;
  totalQuizzes: number;
  publishedQuizzes: number;
  totalQuestions: number;
  totalStudents: number;
  avgScore: number;
  flaggedSessions: number;
}

export default function TeacherOverviewPage() {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/teacher/stats");
      if (res.ok) setStats(await res.json());
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

  const statCards = [
    { label: "Courses", value: stats?.allocatedCourses ?? 0, icon: BookOpen, color: "text-indigo-400" },
    { label: "Quizzes", value: stats?.totalQuizzes ?? 0, icon: ClipboardList, color: "text-blue-400", sub: `${stats?.publishedQuizzes ?? 0} published` },
    { label: "Questions", value: stats?.totalQuestions ?? 0, icon: FileQuestion, color: "text-purple-400" },
    { label: "Students", value: stats?.totalStudents ?? 0, icon: Users, color: "text-emerald-400" },
    { label: "Avg Score", value: `${stats?.avgScore ?? 0}%`, icon: TrendingUp, color: stats?.avgScore && stats.avgScore >= 70 ? "text-emerald-400" : "text-yellow-400" },
    { label: "Flagged", value: stats?.flaggedSessions ?? 0, icon: Shield, color: stats?.flaggedSessions ? "text-red-400" : "text-white/40" },
  ];

  const quickActions = [
    { label: "My Courses", desc: "View allocated subjects & students", href: "/dashboard/teacher/my-courses", icon: BookOpen },
    { label: "Quizzes", desc: "Create & manage assessments", href: "/dashboard/teacher/quizzes", icon: ClipboardList },
    { label: "Analytics", desc: "CO attainment & performance data", href: "/dashboard/teacher/analytics", icon: BarChart3 },
    { label: "Proctoring", desc: "Review flagged quiz sessions", href: "/dashboard/teacher/proctoring", icon: AlertTriangle },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <BarChart3 className="h-4 w-4 text-white/20" />
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Teacher Dashboard</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/[0.04] mb-10 rounded-xl overflow-hidden">
        {statCards.map((s) => (
          <div key={s.label} className="bg-black p-6">
            <div className="flex items-center gap-2 mb-4">
              <s.icon className={`h-3 w-3 ${s.color}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{s.label}</span>
            </div>
            <p className="text-3xl font-black text-white">{s.value}</p>
            {s.sub && <p className="text-[10px] text-white/20 mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20 mb-4 border-b border-white/[0.04] pb-4">Quick Actions</h3>
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
