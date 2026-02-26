import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema/auth";
import { adminGuard } from "@/lib/admin/auth-guard";
import { eq } from "drizzle-orm";

/**
 * Returns users with role "teacher" — used by admin to populate
 * the teacher dropdown in the allocation form.
 */
export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  const data = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.role, "teacher"));

  return NextResponse.json(data);
}
