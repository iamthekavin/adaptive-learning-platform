import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { studentEnrollment } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const navItems = [
  { label: "Overview", href: "/dashboard/student" },
  { label: "My Courses", href: "/dashboard/student/my-courses" },
  { label: "Quizzes", href: "/dashboard/student/quizzes" },
  { label: "Results", href: "/dashboard/student/quiz-results" },
  { label: "Insights", href: "/dashboard/student/insights" },
];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  const role = (session.user as { role?: string }).role;
  if (role !== "student" && role !== "admin") redirect("/dashboard");

  if (role === "student") {
    // Check if the student has mapped their semester/batch
    const [enrollment] = await db
      .select()
      .from(studentEnrollment)
      .where(eq(studentEnrollment.userId, session.user.id))
      .limit(1);

    if (!enrollment) {
      redirect("/onboarding");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pt-28 pb-20 lg:px-12">
      <div className="mb-12 border-b border-white/[0.04] pb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
          Learning Portal.
        </h1>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-white/30">
          Your Personalized Path
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
