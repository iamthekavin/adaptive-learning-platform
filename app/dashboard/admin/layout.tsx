import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

const navItems = [
  { label: "AI Setup", href: "/dashboard/admin/ai-setup" },
  { label: "Universities", href: "/dashboard/admin/universities" },
  { label: "Institutions", href: "/dashboard/admin/institutions" },
  { label: "Departments", href: "/dashboard/admin/departments" },
  { label: "Programs", href: "/dashboard/admin/programs" },
  { label: "Regulations", href: "/dashboard/admin/regulations" },
  { label: "Batches", href: "/dashboard/admin/batches" },
  { label: "Courses", href: "/dashboard/admin/courses" },
  { label: "Semesters", href: "/dashboard/admin/semesters" },
  { label: "Sem–Course Maps", href: "/dashboard/admin/semester-course-maps" },
  { label: "Allocations", href: "/dashboard/admin/teacher-allocations" },
  { label: "Enrollments", href: "/dashboard/admin/student-enrollments" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  const role = (session.user as { role?: string }).role;
  if (role !== "admin") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-7xl px-6 pt-28 pb-20 lg:px-12">
      <div className="mb-12 border-b border-white/[0.04] pb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
          Admin Console.
        </h1>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-white/30">
          Academic Management
        </p>
      </div>

      <div className="flex gap-12">
        {/* Sidebar */}
        <nav className="hidden w-48 shrink-0 lg:block">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isAI = item.href === "/dashboard/admin/ai-setup";
              return (
                <li key={item.href} className={isAI ? "mb-4" : ""}>
                  <Link
                    href={item.href}
                    className={
                      isAI
                        ? "flex items-center gap-2 rounded border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-300 transition-all hover:scale-[1.02] hover:border-indigo-500/40 hover:from-indigo-500/20 hover:to-emerald-500/20 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                        : "block rounded px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white"
                    }
                  >
                    {isAI && (
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      </span>
                    )}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
