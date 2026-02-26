"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Users, GraduationCap } from "lucide-react";

interface Student {
  enrollmentId: string;
  rollNumber: string;
  currentSemester: number;
  status: string;
  studentName: string;
  studentEmail: string;
}

interface CourseAllocation {
  allocationId: string;
  courseName: string;
  courseCode: string;
  credits: number;
  courseType: string;
  semesterNumber: number;
  yearNumber: number;
  programName: string;
  programCode: string;
  academicYearLabel: string;
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [courseInfo, setCourseInfo] = useState<CourseAllocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Fetch students and course info in parallel
      const [studentsRes, coursesRes] = await Promise.all([
        fetch(`/api/teacher/my-courses/${params.id}/students`),
        fetch("/api/teacher/my-courses"),
      ]);

      if (studentsRes.ok) setStudents(await studentsRes.json());

      if (coursesRes.ok) {
        const allCourses: CourseAllocation[] = await coursesRes.json();
        const found = allCourses.find((c) => c.allocationId === params.id);
        if (found) setCourseInfo(found);
      }

      setLoading(false);
    })();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-white/20" />
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400",
    graduated: "bg-blue-500/20 text-blue-400",
    dropped: "bg-red-500/20 text-red-400",
  };

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/dashboard/teacher/my-courses"
        className="mb-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Courses
      </Link>

      {/* Course Header */}
      {courseInfo && (
        <div className="mb-10 border-b border-white/[0.04] pb-8">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-1">
            {courseInfo.courseName}
          </h2>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30">
            {courseInfo.courseCode} · {courseInfo.programName} · Year{" "}
            {courseInfo.yearNumber} Sem {courseInfo.semesterNumber} ·{" "}
            {courseInfo.academicYearLabel}
          </p>
        </div>
      )}

      {/* Student Count */}
      <div className="mb-8 flex items-center gap-3">
        <Users className="h-4 w-4 text-white/20" />
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">
          Enrolled Students ({students.length})
        </span>
      </div>

      {/* Student Table */}
      {students.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
          <p className="text-xs font-bold uppercase tracking-widest text-white/20">
            No students enrolled yet
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.04]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Roll No
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Semester
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr
                  key={s.enrollmentId}
                  className="border-b border-white/[0.02] transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 text-sm font-bold text-white/70 uppercase tracking-wide">
                    {s.rollNumber}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-white/70 flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-white/20" />
                    {s.studentName}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-white/40">
                    {s.studentEmail}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-white/70">
                    {s.currentSemester}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${statusColor[s.status] ?? "bg-white/10 text-white/40"}`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
