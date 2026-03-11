"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Sparkles, FileText } from "lucide-react";

interface AiUploadModalProps {
  quizId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AiUploadModal({ quizId, isOpen, onClose, onSuccess }: AiUploadModalProps) {
  const [extracting, setExtracting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setError("");
    } else {
      setFile(null);
      setError("Please select a valid PDF file.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type === "application/pdf") {
      setFile(dropped);
      setError("");
    } else {
      setError("Only PDF files are supported.");
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    
    setExtracting(true);
    setError("");
    
    const formData = new FormData();
    formData.append("quizId", quizId);
    formData.append("file", file);
    
    try {
      const res = await fetch("/api/teacher/ai/upload-paper", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to extract questions from PDF");
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExtracting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-auto py-8">
      <div className="w-full max-w-xl rounded-xl border border-emerald-500/20 bg-[#0a0a0a] p-8 shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)]">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400">Upload Question Paper</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-1">PDF Extraction & CO Mapping</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <p className="text-sm text-white/50 leading-relaxed">
            Upload a past mid-term or final exam PDF. The AI will extract all multiple-choice questions, determine the correct answers, and intelligently map them to the proper Course Outcomes.
          </p>

          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 
              ${file ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.02]"} 
              p-12 text-center`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf" 
              className="hidden" 
            />
            
            <div className="flex flex-col items-center justify-center gap-4">
              {file ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-400">{file.name}</p>
                    <p className="text-xs text-white/40 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/40 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/60">Click to upload or drag and drop</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-2">PDF files up to 10MB</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Cancel</button>
          <button 
             onClick={handleExtract} 
             disabled={extracting || !file} 
             className="btn-premium !bg-emerald-500 !text-white !border-emerald-400 hover:!bg-emerald-600 !h-9 !px-6 !text-[10px] shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] disabled:opacity-50"
          >
            {extracting ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Extracting & Mapping...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5 mr-2" /> Extract Questions</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
