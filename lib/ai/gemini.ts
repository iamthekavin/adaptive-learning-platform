import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini AI SDK
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

/**
 * Parses a syllabus PDF into structured JSON containing the academic hierarchy.
 * @param fileBuffer The PDF file as an ArrayBuffer or Buffer
 * @param mimeType The MIME type, defaults to application/pdf
 * @returns Parsed JSON array of departments
 */
export async function parseSyllabusPDF(
  fileBuffer: ArrayBuffer | Buffer,
  mimeType: string = "application/pdf"
) {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please add GEMINI_API_KEY to your .env.local file.");
  }

  // Use the recommended model for multimodal text tasks
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

  // Convert Buffer to base64
  let base64Data: string;
  if (Buffer.isBuffer(fileBuffer)) {
    base64Data = fileBuffer.toString("base64");
  } else {
    base64Data = Buffer.from(fileBuffer).toString("base64");
  }

  const prompt = `
    Analyze the provided syllabus PDF document.
    Extract the academic hierarchy contained within it.
    
    Return the result strictly as a valid JSON object with the following structure:
    {
      "regulation": {
        "name": "Regulation Name (e.g., Regulation 2021)",
        "code": "Regulation Code (e.g., R2021)",
        "effectiveYear": number (e.g., 2021)
      },
      "departments": [
        {
          "name": "Name of the department (e.g., Computer Science and Engineering)",
          "code": "A short code (e.g., CSE)",
          "programs": [
            {
              "name": "Name of the program (e.g., B.Tech Computer Science)",
              "code": "Program code (e.g., BTCSE)",
              "durationYears": number (e.g., 4),
              "courses": [
                {
                  "name": "Course name (e.g., Data Structures)",
                  "code": "Course code (e.g., CS301)",
                  "credits": number (e.g., 3),
                  "type": "theory" | "lab" | "project" | "elective",
                  "semester": number (e.g., 3, representing which semester it belongs to),
                  "courseUnits": [
                    {
                      "unitNumber": number (e.g., 1),
                      "title": "Unit title (e.g., Fundamentals)",
                      "description": "Short explanation of the unit",
                      "topics": [
                        { "name": "Topic 1 (e.g., Arrays)" },
                        { "name": "Topic 2 (e.g., Linked Lists)" }
                      ]
                    }
                  ],
                  "courseOutcomes": [
                    { "code": "CO1", "description": "Outcome description" },
                    { "code": "CO2", "description": "Outcome description" }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
    
    CRITICAL UNIVERSAL MULTI-PROGRAM INSTRUCTION:
    Different colleges format shared courses differently (e.g., "Common to IT & CS", "Applicable for AI&DS", table headers, footers, etc.).
    You MUST actively scan the content to determine every specific academic program a course belongs to.
    If a course belongs to multiple programs, you MUST extract BOTH/ALL programs as entirely separate objects inside the "programs" array. 
    Do NOT combine them into one program name (e.g., never output "IT and AI"). Instead, generate two separate programs: "B.Tech Information Technology" and "B.Tech Artificial Intelligence and Data Science".
    Then, duplicate the entire course object and place it inside EVERY relevant program's array.

    If any specific information is missing (like a course type or credits), make a best guess based on academic standards or omit it if impossible to guess, and default to rational fallbacks (e.g., 3 credits, "theory" type). Ensure semester maps strictly to an integer between 1 and 8. If regulation year is missing, try to infer it from the title.
  `;

  try {
    // Generate content using the text prompt and the inline PDF file
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
    ]);

    const responseText = result.response.text();
    
    // Clean up Markdown formatting from Gemini's response if present
    const cleanJsonString = responseText
      .replace(/^`{3}json\n/m, '') 
      .replace(/^`{3}\n/m, '')
      .replace(/`{3}$/m, '')
      .trim();
      
    const parsedData = JSON.parse(cleanJsonString);
    
    return parsedData;
  } catch (error: any) {
    console.error("Error formatting or parsing response from Gemini:", error);
    throw new Error(`Failed to map PDF to structure: ${error.message}`);
  }
}
