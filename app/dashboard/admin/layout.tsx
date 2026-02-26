import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

const navItems = [
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
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
