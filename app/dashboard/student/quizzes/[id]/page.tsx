"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Clock, CheckCircle, AlertCircle, Shield, WifiOff, RefreshCcw } from "lucide-react";

interface QuizOption { id: string; text: string; orderIndex: number; }
interface QuizQuestion { id: string; text: string; marks: number; difficulty: string; orderIndex?: number; options: QuizOption[]; }
interface QuizSession { id: string; startedAt: string; status: string; }
interface QuizInfo { title: string; durationMinutes: number; totalMarks: number; isAdaptive: boolean; }

export default function QuizTakingPage() {
  const params = useParams<{ id: string }>();
  const [quizInfo, setQuizInfo] = useState<QuizInfo | null>(null);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; totalMarks: number; percentage: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0); // seconds remaining
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [adaptiveLoadingNext, setAdaptiveLoadingNext] = useState(false);
  const [currentAdaptiveQuestion, setCurrentAdaptiveQuestion] = useState<QuizQuestion | null>(null);
  const [adaptiveIndex, setAdaptiveIndex] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmittedRef = useRef(false);
  const autosaveQueueRef = useRef<{ questionId: string; selectedOptionId: string; timeTakenSeconds?: number }[]>([]);

  // Track per-question start times
  const questionStartRef = useRef<Record<string, number>>({});
  const timeSpentRef = useRef<Record<string, number>>({});

  // POST proctor event
  const logProctorEvent = useCallback(async (eventType: string) => {
    if (!session) return;
    try {
      await fetch(`/api/student/quizzes/${params.id}/proctor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, eventType }),
      });
    } catch {}
  }, [session, params.id]);

  // Start quiz
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/student/quizzes/${params.id}/start`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to start quiz");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSession(data.session);
      setQuestions(data.questions);
      setQuizInfo(data.quiz);

      // We receive exact elapsedSeconds from the server, eliminating clock skew completely!
      const totalDurationSec = data.quiz.durationMinutes * 60;
      const remaining = Math.max(0, Math.floor(totalDurationSec - data.elapsedSeconds));
      setTimeLeft(remaining);

      if (data.savedAnswers) {
        setAnswers(data.savedAnswers);
      }

      if (data.quiz.isAdaptive) {
        await loadNextAdaptiveQuestion(data.session.id);
      } else if (data.questions.length > 0) {
        questionStartRef.current[data.questions[0].id] = Date.now();
      }

      setLoading(false);
    })();
  }, [params.id]);

  const loadNextAdaptiveQuestion = async (sessionId: string) => {
    setAdaptiveLoadingNext(true);
    try {
      const res = await fetch(`/api/student/quiz-sessions/${sessionId}/next-question`);
      const data = await res.json();
      if (data.question) {
        setCurrentAdaptiveQuestion(data.question);
        setQuestions((prev) => [...prev, data.question]); // keep track of history
        questionStartRef.current[data.question.id] = Date.now();
      } else {
        // No more questions
        setCurrentAdaptiveQuestion(null);
      }
    } catch (err) {
      console.error(err);
    }
    setAdaptiveLoadingNext(false);
  };

  const handleNextAdaptive = async () => {
      // Must answer current question first
      if (currentAdaptiveQuestion && !answers[currentAdaptiveQuestion.id]) {
          alert("Please answer the current question before moving on.");
          return;
      }
      setAdaptiveIndex((prev) => prev + 1);
      if (session) {
         await loadNextAdaptiveQuestion(session.id);
      }
  };

  // Countdown timer
  useEffect(() => {
    if (loading || result) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading, result]);

  const doSubmit = useCallback(async (auto = false) => {
    if (!session || submitting) return;
    if (!auto && !confirm("Are you sure you want to submit? You cannot change answers after submission.")) return;

    setSubmitting(true);
    try {
      const answerArray = Object.entries(answers).map(([questionId, selectedOptionId]) => {
        const timeTaken = timeSpentRef.current[questionId];
        return {
          questionId,
          selectedOptionId,
          timeTakenSeconds: timeTaken ? Math.round(timeTaken / 1000) : undefined,
        };
      });

      const res = await fetch(`/api/student/quizzes/${params.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, answers: answerArray }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          setError("This quiz was deleted by the instructor. Your attempt has been canceled.");
          return;
        }

        const err = await res.json();
        alert(err.error || "Submission failed");
        return;
      }

      const data = await res.json();
      setResult(data);
    } finally {
      setSubmitting(false);
    }
  }, [answers, params.id, session, submitting]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && !loading && !result && session && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      doSubmit(true);
    }
  }, [timeLeft, loading, result, session, doSubmit]);

  // Tab-switch / visibility tracking
  useEffect(() => {
    if (!session || result) return;

    const handleVisibility = () => {
      if (document.hidden) {
        logProctorEvent("tab_switch");
        setTabSwitches((prev) => prev + 1);
      } else {
        logProctorEvent("focus");
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logProctorEvent("copy_attempt");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [session, result, logProctorEvent]);

  // Offline detection and Autosave Flush
  const flushAutosaveQueue = useCallback(async () => {
    if (!session || isOffline || autosaveQueueRef.current.length === 0 || syncing) return;
    setSyncing(true);
    
    // Process queue sequentially
    const queue = [...autosaveQueueRef.current];
    for (const item of queue) {
      try {
        await fetch(`/api/student/quiz-sessions/${session.id}/autosave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        // Remove from queue upon success
        autosaveQueueRef.current = autosaveQueueRef.current.filter(q => q.questionId !== item.questionId);
      } catch {
        // Failed -> stop processing queue and break
        break;
      }
    }
    setSyncing(false);
  }, [session, isOffline, syncing]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      flushAutosaveQueue();
    };
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushAutosaveQueue]);

  const selectAnswer = (questionId: string, optionId: string) => {
    // Track time spent
    if (questionStartRef.current[questionId]) {
      const elapsed = Date.now() - questionStartRef.current[questionId];
      timeSpentRef.current[questionId] = (timeSpentRef.current[questionId] || 0) + elapsed;
    }
    questionStartRef.current[questionId] = Date.now();
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));

    if (session) {
      const payload = {
        questionId,
        selectedOptionId: optionId,
        timeTakenSeconds: timeSpentRef.current[questionId] ? Math.round(timeSpentRef.current[questionId] / 1000) : undefined,
      };
      
      const existingIdx = autosaveQueueRef.current.findIndex(q => q.questionId === questionId);
      if (existingIdx > -1) autosaveQueueRef.current[existingIdx] = payload;
      else autosaveQueueRef.current.push(payload);
      
      if (!isOffline) flushAutosaveQueue();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-white/20" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link href="/dashboard/student/quizzes" className="mb-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-red-500/20">
          <p className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </p>
        </div>
      </div>
    );
  }

  // Result screen
  if (result) {
    const pct = result.percentage;
    const color = pct >= 70 ? "text-emerald-400" : pct >= 40 ? "text-yellow-400" : "text-red-400";
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-12 text-center max-w-md">
          <CheckCircle className={`h-12 w-12 mx-auto mb-6 ${color}`} />
          <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Quiz Submitted!</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-8">{quizInfo?.title}</p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div>
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Score</p>
              <p className={`text-3xl font-black ${color}`}>{result.score}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Total</p>
              <p className="text-3xl font-black text-white/60">{result.totalMarks}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Percentage</p>
              <p className={`text-3xl font-black ${color}`}>{pct}%</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/student/quizzes" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
              Back to Quizzes
            </Link>
            <Link href="/dashboard/student/quiz-results" className="btn-premium !h-9 !px-5 !text-[9px]">
              View All Results
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const timerColor = timeLeft <= 60 ? "text-red-400 animate-pulse" : timeLeft <= 300 ? "text-yellow-400" : "text-white/60";

  return (
    <div>
      {/* Quiz Header with Timer */}
      <div className="mb-8 flex items-center justify-between border-b border-white/[0.04] pb-6">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white">{quizInfo?.title}</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mt-1 flex items-center gap-2">
            <Shield className="h-3 w-3 text-indigo-400" /> Proctored · {questions.length} questions · {quizInfo?.totalMarks} marks
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className={`flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 ${timerColor}`}>
            <Clock className="h-4 w-4" />
            <span className="text-lg font-black font-mono">{formatTime(timeLeft)}</span>
          </div>
          <button
            onClick={() => doSubmit(false)}
            disabled={submitting || Object.keys(answers).length === 0}
            className="btn-premium !h-10 !px-6 !text-[10px] disabled:opacity-30"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      </div>

      {/* Network States Handling */}
      {isOffline && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/[0.05] px-4 py-3 flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-xs font-bold text-red-400">
            You are currently offline. Answers will be saved locally and synced when connection is restored.
          </p>
        </div>
      )}
      {!isOffline && autosaveQueueRef.current.length > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-500/20 bg-yellow-500/[0.05] px-4 py-3 flex items-center gap-2">
          <RefreshCcw className="h-4 w-4 text-yellow-400 shrink-0 animate-spin" />
          <p className="text-xs font-bold text-yellow-400">
            Syncing answers to server...
          </p>
        </div>
      )}

      {/* Tab switch warning */}
      {tabSwitches > 0 && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/[0.05] px-4 py-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-xs font-bold text-red-400">
            {tabSwitches} tab switch{tabSwitches > 1 ? "es" : ""} detected. This activity is being monitored.
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Progress</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            {Object.keys(answers).length} {quizInfo?.isAdaptive ? "" : `/ ${questions.length}`} answered
          </span>
        </div>
        {!quizInfo?.isAdaptive && (
          <div className="h-1 rounded-full bg-white/[0.04]">
            <div
              className="h-1 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${(Object.keys(answers).length / Math.max(questions.length, 1)) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {quizInfo?.isAdaptive ? (
          /* Adaptive Mode: Show one question */
          currentAdaptiveQuestion ? (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.02] p-6 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
              <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-indigo-400 mt-0.5 animate-pulse flex items-center gap-2">
                    <RefreshCcw className="h-3 w-3" /> Adaptive Match Active
                  </span>
              </div>
              <div className="flex items-start gap-3 mb-4">
                <span className="text-xs font-black text-white/20 mt-0.5">Q{adaptiveIndex + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white leading-relaxed">{currentAdaptiveQuestion.text}</p>
                </div>
              </div>
              <div className="ml-7 space-y-2 mb-6">
                {currentAdaptiveQuestion.options.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => selectAnswer(currentAdaptiveQuestion.id, o.id)}
                    className={`w-full text-left rounded-lg px-4 py-3 text-sm font-medium transition-all border ${
                      answers[currentAdaptiveQuestion.id] === o.id
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                        : "border-white/[0.04] text-white/50 hover:border-white/[0.08] hover:bg-white/[0.02]"
                    }`}
                  >
                    {o.text}
                  </button>
                ))}
              </div>
              <div className="ml-7 flex justify-end pt-4 border-t border-white/[0.04]">
                 <button
                   onClick={handleNextAdaptive}
                   disabled={adaptiveLoadingNext || !answers[currentAdaptiveQuestion.id]}
                   className="rounded bg-indigo-500/10 px-4 py-2 text-xs font-bold text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                 >
                   {adaptiveLoadingNext && <Loader2 className="h-3 w-3 animate-spin"/>}
                   Next Question
                 </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/[0.06] rounded-xl text-center">
              <CheckCircle className="h-8 w-8 text-emerald-400 mb-3" />
              <p className="text-sm font-bold text-white mb-2">You have completed the adaptive question pool!</p>
              <p className="text-xs text-white/40 mb-6">Submit your quiz to see the final results and updated mastery scores.</p>
              <button
                onClick={() => doSubmit(false)}
                disabled={submitting || Object.keys(answers).length === 0}
                className="btn-premium !h-10 !px-6 !text-[10px] disabled:opacity-30"
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
            </div>
          )
        ) : (
          /* Standard Mode: Show all questions */
          questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-xs font-black text-white/20 mt-0.5">Q{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white leading-relaxed">{q.text}</p>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">{q.marks} marks · {q.difficulty}</p>
                </div>
              </div>
              <div className="ml-7 space-y-2">
                {q.options.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => selectAnswer(q.id, o.id)}
                    className={`w-full text-left rounded-lg px-4 py-3 text-sm font-medium transition-all border ${
                      answers[q.id] === o.id
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                        : "border-white/[0.04] text-white/50 hover:border-white/[0.08] hover:bg-white/[0.02]"
                    }`}
                  >
                    {o.text}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Submit for Standard Quiz */}
      {(!quizInfo?.isAdaptive && questions.length > 3) && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => doSubmit(false)}
            disabled={submitting || Object.keys(answers).length === 0}
            className="btn-premium !h-10 !px-6 !text-[10px] disabled:opacity-30"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      )}
    </div>
  );
}
