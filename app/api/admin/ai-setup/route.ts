import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin/auth-guard";
import { parseSyllabusPDF } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  try {
    const { error } = await adminGuard();
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const parsedData = await parseSyllabusPDF(arrayBuffer, file.type);

    return NextResponse.json(parsedData);
  } catch (err: any) {
    console.error("AI Setup Error:", err);
    return NextResponse.json({ error: err.message || "Failed to parse syllabus" }, { status: 500 });
  }
}
