"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Upload, FileType, CheckCircle2, Bot, ChevronDown, ChevronRight, X } from "lucide-react";

export default function AISetupPage() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedInst, setSelectedInst] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/admin/institutions")
      .then((res) => res.json())
      .then((data) => setInstitutions(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load institutions", err));
  }, []);

  const handleAnalyze = async () => {
    if (!selectedInst) return toast.error("Please select an institution first.");
    if (!file) return toast.error("Please select a syllabus PDF.");

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/ai-setup", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      
      setPreviewData(data);
      toast.success("PDF analyzed successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewData || !selectedInst) return;
    
    setIsConfirming(true);
    try {
      const res = await fetch("/api/admin/ai-setup/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionId: selectedInst,
          data: previewData
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to commit data");
      
      toast.success(`Success! Created ${data.stats.departments} depts, ${data.stats.programs} programs, ${data.stats.courses} courses, ${data.stats.units} units, ${data.stats.topics} topics, and ${data.stats.outcomes} COs.`);
      setPreviewData(null);
      setFile(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsConfirming(false);
    }
  };

  const removeDepartment = (index: number) => {
    const newData = { ...previewData };
    newData.departments.splice(index, 1);
    setPreviewData(newData);
  };

  return (
    <div className="space-y-8">
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/10 p-8 shadow-[0_0_40px_rgba(99,102,241,0.1)]">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl"></div>
        
        <div className="relative flex items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 shadow-inner">
            <Bot className="h-8 w-8 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-emerald-300 flex items-center gap-3">
              AI Syllabus Setup
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
            </h2>
            <p className="mt-2 text-sm text-indigo-200/60 max-w-xl leading-relaxed font-medium">
              Automate curriculum mapping. Convert syllabus PDFs into structured courses, units, and learning outcomes instantly.
            </p>
          </div>
        </div>
      </div>

      {!previewData ? (
        <div className="max-w-xl space-y-6 rounded-2xl border border-white/[0.04] bg-[#0a0a0c] p-8 shadow-2xl">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Target Institution</label>
            <select
              value={selectedInst}
              onChange={(e) => setSelectedInst(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white outline-none transition-colors hover:border-white/20 focus:border-indigo-500/50 focus:bg-indigo-500/5"
            >
              <option value="" disabled>Select Institution</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.name} ({inst.code})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Syllabus Document (PDF)</label>
            <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed ${file ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/[0.08] hover:border-indigo-500/40 hover:bg-indigo-500/5'} rounded-xl cursor-pointer transition-all`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {file ? (
                  <>
                    <div className="rounded-full bg-emerald-500/20 p-3 mb-3">
                      <FileType className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-sm text-emerald-100 font-bold tracking-wide">{file.name}</p>
                    <p className="text-xs text-emerald-500/60 mt-1 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <div className="rounded-full bg-white/[0.04] p-3 mb-3">
                      <Upload className="w-8 h-8 text-white/40" />
                    </div>
                    <p className="text-sm text-white/60"><span className="font-bold text-white/90">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-white/30 mt-1 uppercase tracking-widest font-bold">PDF Only • Max 50MB</p>
                  </>
                )}
              </div>
              <input type="file" className="hidden" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !file || !selectedInst}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-indigo-500 px-4 py-4 font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-400 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing Document...
              </>
            ) : (
              <>
                <Bot className="h-5 w-5 transition-transform group-hover:scale-110" />
                Analyze via AI Engine
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="sticky top-4 z-10 flex items-center justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0c]/80 p-4 shadow-2xl backdrop-blur-xl">
            <div className="pl-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Verification Phase</h3>
              <p className="text-xs text-white/40 mt-0.5">Review the extracted curriculum tree. Close items to discard them.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreviewData(null)}
                disabled={isConfirming}
                className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                Discard
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
              >
                {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isConfirming ? "Committing..." : "Commit Setup"}
              </button>
            </div>
          </div>
          
          {previewData.regulation && (
            <div className="rounded-xl border border-white/[0.06] bg-indigo-500/10 p-6 mb-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Regulation</span>
              <h4 className="text-lg font-bold text-white">
                {previewData.regulation.name || previewData.regulation.code} 
                <span className="text-white/50 text-sm ml-2 font-mono">({previewData.regulation.code})</span>
              </h4>
              <p className="text-xs text-white/50 mt-1">Effective Year: {previewData.regulation.effectiveYear}</p>
            </div>
          )}

          <div className="space-y-4">
            {previewData.departments?.map((dept: any, i: number) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-6 relative group">
                <button onClick={() => removeDepartment(i)} className="absolute top-4 right-4 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-5 h-5" />
                </button>
                <div className="mb-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Department</span>
                  <h4 className="text-lg font-bold text-white">{dept.name} ({dept.code})</h4>
                </div>

                <div className="space-y-4 pl-4 border-l-2 border-white/[0.06]">
                  {dept.programs?.map((prog: any, j: number) => (
                    <div key={j}>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Program</span>
                      <h5 className="text-base font-semibold text-white/90">{prog.name} ({prog.code}) - {prog.durationYears} Years</h5>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-4">
                        {prog.courses?.map((course: any, k: number) => (
                          <div key={k} className="p-3 rounded border border-white/[0.04] bg-white/[0.02]">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-mono text-white/50">{course.code}</span>
                              <span className="text-[10px] font-bold uppercase text-white/30 px-1.5 py-0.5 rounded bg-white/5">{course.type}</span>
                            </div>
                            <p className="text-sm font-medium text-white mb-2 line-clamp-2">{course.name}</p>
                            <div className="text-[10px] text-white/40 flex items-center justify-between">
                              <span>Sem: {course.semester || "?"}</span>
                              <span>Credits: {course.credits}</span>
                              <span>Units: {course.courseUnits?.length || 0}</span>
                              <span>Topics: {course.courseUnits?.reduce((acc: number, u: any) => acc + (u.topics?.length || 0), 0) || 0}</span>
                              <span>COs: {course.courseOutcomes?.length || 0}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
