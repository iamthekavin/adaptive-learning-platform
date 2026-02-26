"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Calendar } from "lucide-react";
import { ResourceForm } from "@/components/admin/resource-form";

interface Regulation { id: string; name: string; code: string; }
interface AcademicYear { id: string; yearNumber: number; regulationId: string; }
interface Semester { id: string; semesterNumber: number; academicYearId: string; }

export default function SemestersPage() {
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [ayFormOpen, setAyFormOpen] = useState(false);
  const [semFormOpen, setSemFormOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [regRes, ayRes, semRes] = await Promise.all([
      fetch("/api/admin/regulations"),
      fetch("/api/admin/academic-years"),
      fetch("/api/admin/semesters"),
    ]);
    if (regRes.ok) setRegulations(await regRes.json());
    if (ayRes.ok) setAcademicYears(await ayRes.json());
    if (semRes.ok) setSemesters(await semRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const regLabel = (regId: string) => {
    const r = regulations.find((x) => x.id === regId);
    return r ? `${r.name} (${r.code})` : regId;
  };

  const ayLabel = (ay: AcademicYear) => {
    return `Year ${ay.yearNumber} — ${regLabel(ay.regulationId)}`;
  };

  const handleCreateAY = async (values: Record<string, string | number>) => {
    const res = await fetch("/api/admin/academic-years", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yearNumber: Number(values.yearNumber), regulationId: values.regulationId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(typeof err.error === "string" ? err.error : "Failed to create");
    }
    setAyFormOpen(false);
    fetchData();
  };

  const handleCreateSem = async (values: Record<string, string | number>) => {
    const res = await fetch("/api/admin/semesters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ semesterNumber: Number(values.semesterNumber), academicYearId: values.academicYearId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(typeof err.error === "string" ? err.error : "Failed to create");
    }
    setSemFormOpen(false);
    fetchData();
  };

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Calendar className="h-4 w-4 text-white/20" />
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Academic Years & Semesters</h2>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="text-xs font-bold uppercase tracking-widest text-white/20">Loading...</div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Academic Years */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Academic Years</h3>
              <button onClick={() => setAyFormOpen(true)} className="btn-premium !h-8 !px-3 !text-[9px]">
                <Plus className="h-3 w-3" /> Add Year
              </button>
            </div>

            {academicYears.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
                <p className="text-xs font-bold uppercase tracking-widest text-white/20">No academic years yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/[0.04]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Year</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Regulation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academicYears.map((ay) => (
                      <tr key={ay.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-white/60">Year {ay.yearNumber}</td>
                        <td className="px-4 py-3 text-sm text-white/40">{regLabel(ay.regulationId)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Semesters */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Semesters</h3>
              <button onClick={() => setSemFormOpen(true)} className="btn-premium !h-8 !px-3 !text-[9px]" disabled={academicYears.length === 0}>
                <Plus className="h-3 w-3" /> Add Semester
              </button>
            </div>

            {semesters.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
                <p className="text-xs font-bold uppercase tracking-widest text-white/20">
                  {academicYears.length === 0 ? "Add academic years first" : "No semesters yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/[0.04]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Semester</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Academic Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semesters.map((s) => {
                      const ay = academicYears.find((a) => a.id === s.academicYearId);
                      return (
                        <tr key={s.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 text-sm font-bold text-white/60">Semester {s.semesterNumber}</td>
                          <td className="px-4 py-3 text-sm text-white/40">{ay ? ayLabel(ay) : s.academicYearId}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Academic Year Form */}
      <ResourceForm
        title="New Academic Year"
        fields={[
          { name: "yearNumber", label: "Year Number (e.g. 1, 2, 3)", type: "number" as const, required: true },
          { name: "regulationId", label: "Regulation", type: "select" as const, required: true, options: regulations.map((r) => ({ label: `${r.name} (${r.code})`, value: r.id })) },
        ]}
        onSubmit={handleCreateAY}
        onClose={() => setAyFormOpen(false)}
        isOpen={ayFormOpen}
      />

      {/* Semester Form */}
      <ResourceForm
        title="New Semester"
        fields={[
          { name: "semesterNumber", label: "Semester Number (e.g. 1, 2)", type: "number" as const, required: true },
          { name: "academicYearId", label: "Academic Year", type: "select" as const, required: true, options: academicYears.map((ay) => ({ label: ayLabel(ay), value: ay.id })) },
        ]}
        onSubmit={handleCreateSem}
        onClose={() => setSemFormOpen(false)}
        isOpen={semFormOpen}
      />
    </div>
  );
}
