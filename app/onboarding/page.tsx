import { db } from "@/lib/db";
import { program, batch, studentEnrollment } from "@/lib/db/schema";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import OnboardingClient from "./client-page";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user || (session.user as { role?: string }).role !== "student") {
    redirect("/dashboard");
  }

  // Check if they already have an enrollment record
  const [existing] = await db
    .select()
    .from(studentEnrollment)
    .where(eq(studentEnrollment.userId, session.user.id))
    .limit(1);

  if (existing) {
    redirect("/dashboard/student");
  }

  // Fetch all programs and batches
  const programs = await db.select().from(program);
  const batches = await db.select().from(batch);

  return <OnboardingClient programs={programs} batches={batches} />;
}
