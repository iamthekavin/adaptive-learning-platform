"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Building2, BookOpen, GraduationCap, ClipboardList, ArrowRight, Loader2, BarChart3 } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  teachers: number;
  students: number;
  departments: number;
  programs: number;
  courses: number;
  activeEnrollments: number;
  totalEnrollments: number;
  publishedQuizzes: number;
  draftQuizzes: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/stats");
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
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-indigo-400" },
    { label: "Teachers", value: stats?.teachers ?? 0, icon: Users, color: "text-blue-400" },
    { label: "Students", value: stats?.students ?? 0, icon: GraduationCap, color: "text-emerald-400" },
    { label: "Departments", value: stats?.departments ?? 0, icon: Building2, color: "text-purple-400" },
    { label: "Programs", value: stats?.programs ?? 0, icon: BookOpen, color: "text-orange-400" },
    { label: "Courses", value: stats?.courses ?? 0, icon: ClipboardList, color: "text-cyan-400" },
  ];

  const quickActions = [
    { label: "Universities", desc: "Manage universities & institutions", href: "/dashboard/admin/universities" },
    { label: "Departments", desc: "Academic departments", href: "/dashboard/admin/departments" },
    { label: "Programs", desc: "Degree programs", href: "/dashboard/admin/programs" },
    { label: "Courses", desc: "Course catalog", href: "/dashboard/admin/courses" },
    { label: "Enrollments", desc: "Student enrollments", href: "/dashboard/admin/student-enrollments" },
    { label: "Batches", desc: "Academic batches", href: "/dashboard/admin/batches" },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <BarChart3 className="h-4 w-4 text-white/20" />
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Admin Dashboard</h2>
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
          </div>
        ))}
      </div>

      {/* Enrollment Summary */}
      <div className="mb-10 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Active Enrollments</p>
          <p className="text-3xl font-black text-emerald-400">{stats?.activeEnrollments ?? 0}</p>
          <p className="text-[10px] text-white/20 mt-1">of {stats?.totalEnrollments ?? 0} total</p>
        </div>
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Quizzes</p>
          <p className="text-3xl font-black text-indigo-400">{stats?.publishedQuizzes ?? 0}</p>
          <p className="text-[10px] text-white/20 mt-1">{stats?.draftQuizzes ?? 0} draft</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20 mb-4 border-b border-white/[0.04] pb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04] rounded-xl overflow-hidden">
        {quickActions.map((a) => (
          <Link key={a.href} href={a.href} className="bg-black py-5 px-6 group flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-white group-hover:text-indigo-400 transition-colors">{a.label}</h4>
              <p className="mt-0.5 text-[10px] font-medium text-white/20">{a.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-white/10 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
}
