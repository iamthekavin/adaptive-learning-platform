"use client";

import { useSession } from "@/lib/auth/client";

import {
  User,
  Mail,
  Shield,
  BookOpen,
  GraduationCap,
  Calendar,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const roleConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  admin: {
    label: "Administrator",
    icon: <Shield className="h-5 w-5" />,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  teacher: {
    label: "Teacher",
    icon: <BookOpen className="h-5 w-5" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  student: {
    label: "Student",
    icon: <GraduationCap className="h-5 w-5" />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
};

export default function ProfilePage() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 lg:px-12">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-white/20" />
        </div>
      </main>
    );
  }

  if (!session) return null;

  const user = session.user as {
    id: string;
    name: string;
    email: string;
    role?: string;
    image?: string;
    createdAt?: Date | string;
  };

  const role = user.role || "student";
  const config = roleConfig[role] || roleConfig.student;
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  const dashboardPath =
    role === "admin"
      ? "/dashboard/admin"
      : role === "teacher"
      ? "/dashboard/teacher"
      : "/dashboard/student";

  return (
    <>
      <main className="mx-auto max-w-3xl px-6 py-10 lg:px-12">
        {/* Back link */}
        <Link
          href={dashboardPath}
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors mb-8"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Dashboard
        </Link>

        {/* Profile Header Card */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-20 w-20 rounded-xl border border-white/10 object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center">
                  <span className="text-2xl font-black text-white/40">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              )}
              {/* Role badge on avatar */}
              <div
                className={`absolute -bottom-2 -right-2 h-8 w-8 rounded-lg ${config.bgColor} ${config.borderColor} border flex items-center justify-center ${config.color}`}
              >
                {config.icon}
              </div>
            </div>

            {/* Name & Role */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black uppercase tracking-tight text-white mb-1">
                {user.name}
              </h1>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${config.bgColor} ${config.borderColor} border ${config.color}`}
              >
                {config.icon}
                {config.label}
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          {/* Email */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">
                Email Address
              </p>
              <p className="text-sm text-white/80">{user.email}</p>
            </div>
          </div>

          {/* User ID */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">
                User ID
              </p>
              <p className="text-sm text-white/80 font-mono">{user.id}</p>
            </div>
          </div>

          {/* Joined Date */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">
                Member Since
              </p>
              <p className="text-sm text-white/80">{joinDate}</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
