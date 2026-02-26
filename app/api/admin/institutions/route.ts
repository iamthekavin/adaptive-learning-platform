import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { institution } from "@/lib/db/schema/university";
import { adminGuard } from "@/lib/admin/auth-guard";
import { createInstitutionSchema } from "@/lib/admin/validators";

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  const data = await db.select().from(institution);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  const body = await req.json();
  const parsed = createInstitutionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db.insert(institution).values(parsed.data).returning();
  return NextResponse.json(created, { status: 201 });
}
