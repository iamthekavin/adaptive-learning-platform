import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { department, program, regulation, academicYear, semester } from "@/lib/db/schema/academic";
import { course, courseOutcome, semesterCourseMap, courseUnit, unitTopic } from "@/lib/db/schema/course";
import { adminGuard } from "@/lib/admin/auth-guard";

export async function POST(req: Request) {
  try {
    const { error } = await adminGuard();
    if (error) return error;

    const body = await req.json();
    const { institutionId, data } = body;

    if (!institutionId || !data || !data.departments) {
      return NextResponse.json({ error: "Missing institutionId or AI data" }, { status: 400 });
    }

    let stats = { departments: 0, programs: 0, courses: 0, outcomes: 0, mappings: 0, units: 0, topics: 0 };

    await db.transaction(async (tx) => {
      // Create Regulation if exists in AI Data
      let insertedReg: any = null;
      if (data.regulation && data.regulation.code) {
        insertedReg = await tx.query.regulation.findFirst({
          where: (r, { and, eq }) => and(eq(r.code, data.regulation.code), eq(r.institutionId, institutionId)),
        });

        if (!insertedReg) {
          const [newReg] = await tx.insert(regulation).values({
            name: data.regulation.name || data.regulation.code,
            code: data.regulation.code,
            effectiveYear: data.regulation.effectiveYear || new Date().getFullYear(),
            institutionId,
            description: "Auto-created by AI Syllabus Setup",
          }).returning();
          insertedReg = newReg;
        }
      }

      // Helper function to resolve Semester ID based on the Regulation
      async function getOrCreateSemesterId(semNumber: number): Promise<string | null> {
        if (!insertedReg || !semNumber) return null;
        
        // e.g., Semester 3 belongs to Academic Year 2
        const yearNumber = Math.max(1, Math.ceil(semNumber / 2));
        
        let acYear: any = await tx.query.academicYear.findFirst({
          where: (y, { and, eq }) => and(eq(y.yearNumber, yearNumber), eq(y.regulationId, insertedReg!.id)),
        });

        if (!acYear) {
          const [newAcYear] = await tx.insert(academicYear).values({
            yearNumber,
            regulationId: insertedReg!.id,
          }).returning();
          acYear = newAcYear;
        }

        let sem: any = await tx.query.semester.findFirst({
          where: (s, { and, eq }) => and(eq(s.semesterNumber, semNumber), eq(s.academicYearId, acYear.id)),
        });

        if (!sem) {
          const [newSem] = await tx.insert(semester).values({
            semesterNumber: semNumber,
            academicYearId: acYear.id,
          }).returning();
          sem = newSem;
        }

        return sem.id;
      }

      for (const deptData of data.departments) {
        // Check if Department exists
        let insertedDept: any = await tx.query.department.findFirst({
          where: (dept, { and, eq }) => and(eq(dept.code, deptData.code), eq(dept.institutionId, institutionId)),
        });

        if (!insertedDept) {
          const deptValues = {
            name: deptData.name,
            code: deptData.code,
            institutionId,
          };
          const [newDept] = await tx.insert(department).values(deptValues).returning();
          insertedDept = newDept;
          stats.departments++;
        }

        const programs = deptData.programs || [];
        for (const progData of programs) {
          // Check if Program exists
          let insertedProg: any = await tx.query.program.findFirst({
            where: (prog, { and, eq }) => and(eq(prog.code, progData.code), eq(prog.departmentId, insertedDept!.id)),
          });

          if (!insertedProg) {
            const progValues = {
              name: progData.name,
              code: progData.code,
              durationYears: progData.durationYears || 4,
              departmentId: insertedDept!.id,
            };
            const [newProg] = await tx.insert(program).values(progValues).returning();
            insertedProg = newProg;
            stats.programs++;
          }

          const courses = progData.courses || [];
          for (const courseData of courses) {
            // Check if Course exists
            let insertedCourse: any = await tx.query.course.findFirst({
              where: (c, { and, eq }) => and(eq(c.code, courseData.code), eq(c.departmentId, insertedDept!.id)),
            });

            if (!insertedCourse) {
              const courseValues = {
                name: courseData.name,
                code: courseData.code,
                credits: parseFloat(courseData.credits + "") || 3,
                type: courseData.type || "theory",
                departmentId: insertedDept!.id,
                description: `Suggested Semester: ${courseData.semester || "Unknown"}`,
              };
              const [newCourse] = await tx.insert(course).values(courseValues).returning();
              insertedCourse = newCourse;
              stats.courses++;
            }

            // Always attempt to map Course to Semester + Program
            if (courseData.semester) {
               const semNumber = parseInt(courseData.semester + "", 10);
               if (!isNaN(semNumber)) {
                 const semId = await getOrCreateSemesterId(semNumber);
                 if (semId) {
                   // Ensure it's not already mapped
                   const existingMap = await tx.query.semesterCourseMap.findFirst({
                     where: (m, { and, eq }) => and(
                       eq(m.courseId, insertedCourse!.id), 
                       eq(m.programId, insertedProg!.id), 
                       eq(m.semesterId, semId)
                     ),
                   });

                   if (!existingMap) {
                     await tx.insert(semesterCourseMap).values({
                       courseId: insertedCourse!.id,
                       programId: insertedProg!.id,
                       semesterId: semId,
                     });
                     stats.mappings++;
                   }
                 }
               }
            }

            // Create Course Outcomes
            const outcomes = courseData.courseOutcomes || [];
            if (outcomes.length > 0) {
              // check if existing
              const existingCOs = await tx.query.courseOutcome.findMany({
                 where: (co, { eq }) => eq(co.courseId, insertedCourse!.id)
              });
              
              const newCOs = outcomes.filter((co: any) => !existingCOs.some(e => e.code === co.code));

              if (newCOs.length > 0) {
                const outcomeValues = newCOs.map((co: any) => ({
                  code: co.code,
                  description: co.description,
                  courseId: insertedCourse!.id,
                }));
                await tx.insert(courseOutcome).values(outcomeValues);
                stats.outcomes += newCOs.length;
              }
            }

            // Create Course Units & Topics
            const units = courseData.courseUnits || [];
            for (const unitData of units) {
              // Check if unit exists
              let insertedUnit: any = await tx.query.courseUnit.findFirst({
                where: (u, { and, eq }) => and(
                  eq(u.unitNumber, unitData.unitNumber),
                  eq(u.courseId, insertedCourse!.id)
                ),
              });

              if (!insertedUnit) {
                const [newUnit] = await tx.insert(courseUnit).values({
                  unitNumber: unitData.unitNumber || 1,
                  title: unitData.title || "Untitled Unit",
                  description: unitData.description || null,
                  courseId: insertedCourse!.id,
                }).returning();
                insertedUnit = newUnit;
                stats.units++;
              }

              // Bulk insert topics for the unit
              const topics = unitData.topics || [];
              if (topics.length > 0) {
                const existingTopics = await tx.query.unitTopic.findMany({
                   where: (t, { eq }) => eq(t.unitId, insertedUnit.id)
                });
                
                const newTopics = topics.filter((t: any) => !existingTopics.some(e => e.name === t.name));

                if (newTopics.length > 0) {
                  const topicValues = newTopics.map((t: any) => ({
                    name: t.name,
                    unitId: insertedUnit.id,
                  }));
                  await tx.insert(unitTopic).values(topicValues);
                  stats.topics += newTopics.length;
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true, stats });
  } catch (err: any) {
    console.error("AI Setup Confirm Error:", err);
    return NextResponse.json({ error: err.message || "Failed to commit data" }, { status: 500 });
  }
}
