"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitOnboarding } from "./actions";

type Program = { id: string; name: string };
type Batch = { id: string; startYear: number; endYear: number; programId: string };

export default function OnboardingClient({
  programs,
  batches,
}: {
  programs: Program[];
  batches: Batch[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [currentSemester, setCurrentSemester] = useState<number>(1);
  const [rollNumber, setRollNumber] = useState("");

  const filteredBatches = batches.filter((b) => b.programId === selectedProgramId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedProgramId || !selectedBatchId || !currentSemester || !rollNumber.trim()) {
      setError("Please fill all fields.");
      return;
    }

    setLoading(true);
    const result = await submitOnboarding({
      batchId: selectedBatchId,
      currentSemester: currentSemester,
      rollNumber: rollNumber.trim(),
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/dashboard/student");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black/95 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <h1 className="mb-2 text-2xl font-black uppercase tracking-tight">
          Complete Your Profile
        </h1>
        <p className="mb-8 text-sm text-white/50">
          Please provide your current academic details before continuing.
        </p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Program Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-white/50">
              Program
            </label>
            <select
              value={selectedProgramId}
              onChange={(e) => {
                setSelectedProgramId(e.target.value);
                setSelectedBatchId(""); // Reset batch on program change
              }}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-white/30"
              required
            >
              <option value="" className="text-black">
                Select a program...
              </option>
              {programs.map((p) => (
                <option key={p.id} value={p.id} className="text-black">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-white/50">
              Batch (Year)
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              disabled={!selectedProgramId}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-white/30 disabled:opacity-50"
              required
            >
              <option value="" className="text-black">
                Select your batch...
              </option>
              {filteredBatches.map((b) => (
                <option key={b.id} value={b.id} className="text-black">
                  {b.startYear} - {b.endYear}
                </option>
              ))}
            </select>
          </div>

          {/* Current Semester */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-white/50">
              Current Semester
            </label>
            <select
              value={currentSemester}
              onChange={(e) => setCurrentSemester(parseInt(e.target.value))}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-white/30"
              required
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem} className="text-black">
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Roll Number */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-white/50">
              Roll Number
            </label>
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g. 23CS012"
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-white/30 placeholder:text-white/20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white p-3 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Details"}
          </button>
        </form>
      </div>
    </div>
  );
}
