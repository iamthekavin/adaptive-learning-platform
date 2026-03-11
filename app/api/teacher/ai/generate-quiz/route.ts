import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quiz, question, option } from "@/lib/db/schema/assessment";
import { courseOutcome } from "@/lib/db/schema/course";
import { teacherGuard } from "@/lib/teacher/auth-guard";
import { eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    const { error, session } = await teacherGuard();
    if (error) return error;

    const body = await req.json();
    const { quizId, topicNames, difficulty, count } = body;

    if (!quizId || !topicNames || !Array.isArray(topicNames) || topicNames.length === 0 || !count) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch Quiz details to get the Course ID
    const quizData = await db.query.quiz.findFirst({
      where: eq(quiz.id, quizId),
    });

    if (!quizData) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // 2. Fetch Course Outcomes for this Course
    const outcomes = await db.query.courseOutcome.findMany({
      where: eq(courseOutcome.courseId, quizData.courseId),
    });

    // 3. Prepare the Gemini Prompt
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    const coString = outcomes.length > 0 
      ? outcomes.map(co => `ID: ${co.id} | Code: ${co.code} | Desc: ${co.description}`).join('\n')
      : "No Course Outcomes available.";

    const prompt = `
      You are an expert academic evaluator. Generate ${count} multiple-choice questions based on the following topics:
      Topics: ${topicNames.join(", ")}
      
      The overall requested difficulty is: ${difficulty || "medium"}. 
      (If "mixed", provide a balance of easy, medium, and hard questions).
      
      For each question, you MUST map it to one of the following Course Outcomes (COs) if they exist. Use the ID provided:
      ${coString}
      
      Return strictly a valid JSON array of question objects with the following structure:
      [
        {
          "text": "The actual question text",
          "marks": 1,
          "difficulty": "easy" | "medium" | "hard",
          "courseOutcomeId": "The ID of the best matching CO from the list above, or null if none fit",
          "options": [
            { "text": "Option A text", "isCorrect": true },
            { "text": "Option B text", "isCorrect": false },
            { "text": "Option C text", "isCorrect": false },
            { "text": "Option D text", "isCorrect": false }
          ]
        }
      ]
      
      Ensure exactly ONE option is isCorrect: true. Do not include markdown \`\`\`json block wrappers, just the raw JSON text.
    `;

    // 4. Call Gemini
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean up Markdown formatting from Gemini's response if present
    let cleanJsonString = responseText;
    console.log("----- RAW GEMINI RESPONSE -----");
    console.log(cleanJsonString);
    console.log("-------------------------------");
    
    const startIndex = cleanJsonString.indexOf('[');
    const endIndex = cleanJsonString.lastIndexOf(']');
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      cleanJsonString = cleanJsonString.substring(startIndex, endIndex + 1);
    } else {
      throw new Error("Invalid AI format returned: " + responseText.substring(0, 500));
    }
      
    const aiQuestions = JSON.parse(cleanJsonString);

    if (!Array.isArray(aiQuestions) || aiQuestions.length === 0) {
      throw new Error("AI returned invalid question format.");
    }

    // 5. Insert into Database in a Transaction
    let insertedCount = 0;
    await db.transaction(async (tx) => {
      // Get the current max orderIndex in the quiz
      const existingQs = await tx.query.question.findMany({
        where: eq(question.quizId, quizId),
        columns: { orderIndex: true },
      });
      let nextOrder = existingQs.length > 0 ? Math.max(...existingQs.map(q => q.orderIndex)) + 1 : 0;

      for (const q of aiQuestions) {
        // Insert Question
        const [insertedQ] = await tx.insert(question).values({
          quizId,
          text: q.text,
          marks: q.marks || 1,
          difficulty: q.difficulty || "medium",
          courseOutcomeId: q.courseOutcomeId || null,
          orderIndex: nextOrder++,
        }).returning();

        // Insert Options
        if (q.options && Array.isArray(q.options)) {
          const optionValues = q.options.map((opt: any, optIndex: number) => ({
            questionId: insertedQ.id,
            text: opt.text,
            isCorrect: opt.isCorrect === true,
            orderIndex: optIndex,
          }));
          await tx.insert(option).values(optionValues);
        }
        
        insertedCount++;
      }
      
      // Update Quiz Total Marks dynamically
      const allQs = await tx.query.question.findMany({
        where: eq(question.quizId, quizId),
        columns: { marks: true },
      });
      const newTotalMarks = allQs.reduce((sum, q) => sum + (q.marks || 0), 0) + aiQuestions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0);
      
      await tx.update(quiz).set({ totalMarks: newTotalMarks, updatedAt: new Date() }).where(eq(quiz.id, quizId));
    });

    return NextResponse.json({ success: true, count: insertedCount });
  } catch (error: any) {
    console.error("AI Generate Edit Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate questions" }, { status: 500 });
  }
}
