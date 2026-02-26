"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, Loader2, User } from "lucide-react";

interface CourseInfo {
  mappingId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  credits: number;
  courseType: string;
  description: string | null;
  semesterNumber: number;
  yearNumber: number;
  teacherName: string | null;
  teacherEmail: string | null;
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/student/my-courses");
      if (res.ok) setCourses(await res.json());
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-white/20" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">
          My Courses
        </h2>
      </div>

      {courses.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
          <p className="text-xs font-bold uppercase tracking-widest text-white/20">
            No courses found for your current semester
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <Link
              key={c.mappingId}
              href={`/dashboard/student/my-courses/${c.courseId}`}
              className="group rounded-xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-emerald-500/10 text-emerald-400">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide group-hover:text-emerald-400 transition-colors">
                      {c.courseName}
                    </h3>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                      {c.courseCode}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-white/10 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">
                    Credits
                  </p>
                  <p className="text-xs font-medium text-white/60">{c.credits}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">
                    Type
                  </p>
                  <p className="text-xs font-medium text-white/60 capitalize">{c.courseType}</p>
                </div>
                {c.teacherName && (
                  <div className="col-span-2">
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">
                      Teacher
                    </p>
                    <p className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                      <User className="h-3 w-3 text-white/20" />
                      {c.teacherName}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
