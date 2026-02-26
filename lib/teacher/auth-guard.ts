import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Validates the incoming request has an active teacher (or admin) session.
 * Returns the session on success, or a NextResponse error on failure.
 */
export async function teacherGuard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
      session: null,
    };
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "teacher" && role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Teacher access required" },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}
