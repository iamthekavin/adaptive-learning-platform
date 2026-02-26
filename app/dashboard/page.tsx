import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * /dashboard — redirects to the role-specific dashboard.
 */
export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const role = (session.user as { role?: string }).role || "student";

  switch (role) {
    case "admin":
      redirect("/dashboard/admin");
    case "teacher":
      redirect("/dashboard/teacher");
    default:
      redirect("/dashboard/student");
  }
}
