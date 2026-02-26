"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, BookOpen, User, Target } from "lucide-react";

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

interface CourseOutcome {
  id: string;
  code: string;
  description: string;
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [outcomes, setOutcomes] = useState<CourseOutcome[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Fetch course info from my-courses API
      const coursesRes = await fetch("/api/student/my-courses");
      if (coursesRes.ok) {
        const allCourses: CourseInfo[] = await coursesRes.json();
        const found = allCourses.find((c) => c.courseId === params.id);
        if (found) setCourseInfo(found);
      }

      // Fetch course outcomes
      try {
        const coRes = await fetch(`/api/student/course-outcomes/${params.id}`);
        if (coRes.ok) setOutcomes(await coRes.json());
      } catch { /* endpoint may not exist yet */ }

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

  if (!courseInfo) {
    return (
      <div>
        <Link
          href="/dashboard/student/my-courses"
          className="mb-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Courses
        </Link>
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
          <p className="text-xs font-bold uppercase tracking-widest text-white/20">
            Course not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <Link
        href="/dashboard/student/my-courses"
        className="mb-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Courses
      </Link>

      {/* Course Header */}
      <div className="mb-10 border-b border-white/[0.04] pb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-emerald-500/10 text-emerald-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              {courseInfo.courseName}
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-white/30">
              {courseInfo.courseCode} · Year {courseInfo.yearNumber} Sem{" "}
              {courseInfo.semesterNumber}
            </p>
          </div>
        </div>
        {courseInfo.description && (
          <p className="mt-4 text-sm font-medium text-white/40 leading-relaxed">
            {courseInfo.description}
          </p>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04] mb-10">
        <div className="bg-black p-6">
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">
            Credits
          </p>
          <p className="text-2xl font-black text-white">{courseInfo.credits}</p>
        </div>
        <div className="bg-black p-6">
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">
            Type
          </p>
          <p className="text-2xl font-black text-white capitalize">{courseInfo.courseType}</p>
        </div>
        <div className="bg-black p-6 col-span-2">
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">
            Teacher
          </p>
          {courseInfo.teacherName ? (
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-white/20" />
              {courseInfo.teacherName}
              <span className="text-white/30 font-medium text-xs">
                ({courseInfo.teacherEmail})
              </span>
            </p>
          ) : (
            <p className="text-sm font-medium text-white/30">Not assigned yet</p>
          )}
        </div>
      </div>

      {/* Course Outcomes */}
      {outcomes.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <Target className="h-4 w-4 text-white/20" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">
              Course Outcomes ({outcomes.length})
            </span>
          </div>
          <div className="space-y-3">
            {outcomes.map((co) => (
              <div
                key={co.id}
                className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex gap-4"
              >
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider shrink-0 mt-0.5">
                  {co.code}
                </span>
                <p className="text-sm font-medium text-white/60 leading-relaxed">
                  {co.description}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
