"use server";

import { db } from "@/lib/db";
import { studentEnrollment } from "@/lib/db/schema";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function submitOnboarding(data: {
  batchId: string;
  currentSemester: number;
  rollNumber: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user || (session.user as any).role !== "student") {
    return { error: "Unauthorized" };
  }

  try {
    // Check if the user is already enrolled
    const existing = await db.query.studentEnrollment.findFirst({
      where: (table, { eq }) => eq(table.userId, session.user.id),
    });

    if (existing) {
      return { error: "Already mapped" };
    }

    await db.insert(studentEnrollment).values({
      userId: session.user.id,
      batchId: data.batchId,
      currentSemester: data.currentSemester,
      rollNumber: data.rollNumber,
      status: "active",
    });

    revalidatePath("/dashboard/student", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return { error: error.message || "Failed to complete onboarding" };
  }
}
