"use client";

import { useState, useEffect } from "react";
import { Brain, X, Loader2, Sparkles, CheckSquare, Square } from "lucide-react";

interface AiGenerateModalProps {
  quizId: string;
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Unit {
  id: string;
  unitNumber: number;
  title: string;
}

interface Topic {
  id: string;
  name: string;
  unitId: string;
}

export function AiGenerateModal({ quizId, courseId, isOpen, onClose, onSuccess }: AiGenerateModalProps) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicNames, setSelectedTopicNames] = useState<string[]>([]);
  
  const [difficulty, setDifficulty] = useState("mixed");
  const [count, setCount] = useState(5);
  
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !courseId) return;
    
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/teacher/courses/${courseId}/syllabus`);
        if (res.ok) {
          const data = await res.json();
          setUnits(data.units || []);
          setTopics(data.topics || []);
        }
      } catch (err: any) {
        console.error("Failed to fetch curriculum data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isOpen, courseId]);

  const toggleTopic = (name: string) => {
    if (selectedTopicNames.includes(name)) {
      setSelectedTopicNames(selectedTopicNames.filter(n => n !== name));
    } else {
      setSelectedTopicNames([...selectedTopicNames, name]);
    }
  };

  const handleGenerate = async () => {
    if (selectedTopicNames.length === 0) {
      setError("Please select at least one topic.");
      return;
    }
    
    setGenerating(true);
    setError("");
    
    try {
      const res = await fetch("/api/teacher/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId,
          topicNames: selectedTopicNames,
          difficulty,
          count
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate questions");
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-auto">
      <div className="w-full max-w-2xl rounded-xl border border-indigo-500/20 bg-[#0a0a0a] p-8 shadow-[0_0_40px_-10px_rgba(99,102,241,0.15)] max-h-[90vh] flex flex-col">
        <div className="mb-6 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400">Generate with AI</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-1">Topic-Based MCQ Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 shrink-0">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          <div>
            <label className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
              <span>Select Topics to Test</span>
              <span className="text-indigo-400 normal-case tracking-normal">{selectedTopicNames.length} selected</span>
            </label>
            
            {loading ? (
               <div className="flex items-center justify-center p-8 gap-3 text-xs text-white/40 border border-white/5 rounded-xl border-dashed">
                 <Loader2 className="h-4 w-4 animate-spin"/> Loading syllabus...
               </div>
            ) : units.length === 0 ? (
               <div className="p-8 text-center text-xs text-white/40 border border-white/5 rounded-xl border-dashed">
                 No units or topics found for this course's syllabus. Please set up the syllabus first.
               </div>
            ) : (
               <div className="space-y-4">
                 {units.map((unit) => {
                   const unitTopics = topics.filter(t => t.unitId === unit.id);
                   if (unitTopics.length === 0) return null;
                   
                   return (
                     <div key={unit.id} className="rounded-lg border border-white/[0.04] bg-white/[0.01] overflow-hidden">
                       <div className="bg-white/[0.02] px-4 py-2 border-b border-white/[0.04]">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Unit {unit.unitNumber}: {unit.title}</span>
                       </div>
                       <div className="p-2 grid grid-cols-1 gap-1">
                         {unitTopics.map(topic => (
                           <button
                             key={topic.id}
                             onClick={() => toggleTopic(topic.name)}
                             className="flex items-center gap-3 w-full p-2 rounded hover:bg-white/[0.04] transition-colors text-left"
                           >
                             <div className="shrink-0 text-indigo-400">
                               {selectedTopicNames.includes(topic.name) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-white/20" />}
                             </div>
                             <span className={`text-sm ${selectedTopicNames.includes(topic.name) ? "text-white font-medium" : "text-white/60"}`}>
                               {topic.name}
                             </span>
                           </button>
                         ))}
                       </div>
                     </div>
                   );
                 })}
               </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 shrink-0 bg-[#0a0a0a] pt-2">
             <div>
               <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/30">Question Count</label>
               <input type="number" min="1" max="20" value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" />
             </div>
             <div>
               <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/30">Difficulty Mix</label>
               <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50">
                 <option value="mixed">Mixed (All levels)</option>
                 <option value="easy">Easy (Fundamentals)</option>
                 <option value="medium">Medium (Application)</option>
                 <option value="hard">Hard (Analysis)</option>
               </select>
             </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/10 flex gap-3 justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Cancel</button>
          <button 
             onClick={handleGenerate} 
             disabled={generating || selectedTopicNames.length === 0} 
             className="btn-premium !bg-indigo-500 !text-white !border-indigo-400 hover:!bg-indigo-600 !h-9 !px-6 !text-[10px] shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)] disabled:opacity-50"
          >
            {generating ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Generating...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5 mr-2" /> Generate Questions</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
