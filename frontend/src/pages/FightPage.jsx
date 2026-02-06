import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getActiveContest,
  markQuestionSolved,
  completeContest,
  abandonContest,
} from "../api/contests";
import { useAuth } from "../context/AuthContext";

const FightPage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [contest, setContest] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    loadContest();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!loading && contest) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, contest]);

  const loadContest = async () => {
    try {
      const data = await getActiveContest();
      setContest(data);
    } catch (error) {
      console.error("No active contest:", error);
      navigate("/levels");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSolved = async (questionId) => {
    if (markingId) return;
    setMarkingId(questionId);
    try {
      const result = await markQuestionSolved(questionId);
      setContest((prev) => ({
        ...prev,
        questionStates: { ...prev.questionStates, [questionId]: 1 },
        solvedCount: result.solvedCount,
      }));
    } catch (error) {
      console.error("Failed to mark solved:", error);
      alert(error.response?.data?.detail || "Failed to mark as solved");
    } finally {
      setMarkingId(null);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const result = await completeContest();
      await refreshUser();
      navigate("/result", { state: { result } });
    } catch (error) {
      console.error("Failed to complete:", error);
      alert(error.response?.data?.detail || "Failed to complete contest");
      setCompleting(false);
    }
  };

  const handleAbandon = async () => {
    if (!window.confirm("Are you sure you want to abandon this contest?"))
      return;
    try {
      await abandonContest();
      await refreshUser();
      navigate("/levels");
    } catch (error) {
      console.error("Failed to abandon:", error);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-text-muted">Loading contest...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return null;
  }

  const questions = contest.questions || [];
  const currentQuestion = questions[activeQuestion];
  const solvedCount = contest.solvedCount || 0;
  const totalQuestions = contest.totalQuestions || 4;
  const progress = (solvedCount / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-background-dark text-white flex flex-col font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background-dark/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-lg">
                all_inclusive
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-text-muted">Current Mission</p>
              <p className="text-sm font-semibold text-white truncate max-w-[200px]">
                {contest.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">Active</span>
            </div>
            <button
              onClick={handleAbandon}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-text-muted hover:text-danger hover:border-danger/30 hover:bg-danger/10 transition-all duration-200"
              title="Abandon contest"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-8">
        {/* Progress Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text-secondary">
                Progress
              </span>
              <span className="text-sm font-semibold text-white">
                {solvedCount}/{totalQuestions}
              </span>
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <span className="material-symbols-outlined text-[18px]">
                timer
              </span>
              <span className="font-mono text-sm tabular-nums">
                {formatTime(timer)}
              </span>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Problem Tabs */}
        <motion.div
          className="flex gap-2 mb-8 overflow-x-auto pb-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          {questions.map((q, index) => {
            const isSolved = contest.questionStates?.[q.id] === 1;
            const isActive = activeQuestion === index;

            return (
              <button
                key={q.id}
                onClick={() => setActiveQuestion(index)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shrink-0 ${
                  isActive
                    ? "bg-white/[0.08] text-white border border-white/[0.12]"
                    : "text-text-muted hover:text-text-secondary hover:bg-white/[0.04]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${
                    isSolved
                      ? "bg-success/20 text-success"
                      : isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-white/[0.06] text-text-muted"
                  }`}
                >
                  {isSolved ? (
                    <span className="material-symbols-outlined text-[14px]">
                      check
                    </span>
                  ) : (
                    String.fromCharCode(65 + index)
                  )}
                </span>
                <span className="hidden sm:inline">
                  Problem {String.fromCharCode(65 + index)}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Problem Card */}
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl border border-white/[0.06] bg-card-dark overflow-hidden"
            >
              {/* Problem Header */}
              <div className="p-6 border-b border-white/[0.06]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          contest.questionStates?.[currentQuestion.id] === 1
                            ? "bg-success/15 text-success"
                            : "bg-warning/15 text-warning"
                        }`}
                      >
                        {contest.questionStates?.[currentQuestion.id] === 1
                          ? "Solved"
                          : "Unsolved"}
                      </span>
                      <span className="text-xs text-text-muted">
                        {currentQuestion.source}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white leading-tight">
                      {currentQuestion.name}
                    </h2>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-text-muted mb-1">Difficulty</p>
                    <p className="text-lg font-bold text-primary tabular-nums">
                      {currentQuestion.internal_rating}
                    </p>
                  </div>
                </div>
              </div>

              {/* Problem Meta */}
              <div className="p-6 space-y-6">
                {/* Tags */}
                {currentQuestion.tags?.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted mb-2">Topics</p>
                    <div className="flex flex-wrap gap-2">
                      {currentQuestion.tags.slice(0, 6).map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.a
                    href={currentQuestion.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-light text-background-dark py-3.5 px-6 text-sm font-semibold transition-colors duration-200"
                  >
                    <span>Open Problem</span>
                    <span className="material-symbols-outlined text-[18px]">
                      open_in_new
                    </span>
                  </motion.a>

                  {contest.questionStates?.[currentQuestion.id] !== 1 && (
                    <motion.button
                      onClick={() => handleMarkSolved(currentQuestion.id)}
                      disabled={markingId === currentQuestion.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-success/30 bg-success/10 text-success hover:bg-success/20 py-3.5 px-6 text-sm font-semibold transition-colors duration-200 disabled:opacity-50"
                    >
                      {markingId === currentQuestion.id ? (
                        <>
                          <div className="h-4 w-4 border-2 border-success/30 border-t-success rounded-full animate-spin" />
                          <span>Marking...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">
                            check_circle
                          </span>
                          <span>Mark as Solved</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Complete Button */}
        {solvedCount > 0 && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <motion.button
              onClick={handleComplete}
              disabled={completing}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-success to-emerald-400 text-background-dark py-4 px-6 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {completing ? (
                <>
                  <div className="h-4 w-4 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin" />
                  <span>Finishing Contest...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    flag
                  </span>
                  <span>
                    Complete Contest ({solvedCount}/{totalQuestions} solved)
                  </span>
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-4 px-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between text-xs text-text-muted/50">
          <span>
            {solvedCount === totalQuestions
              ? "All problems solved!"
              : `${totalQuestions - solvedCount} problem${totalQuestions - solvedCount !== 1 ? "s" : ""} remaining`}
          </span>
          <span>Session: {formatTime(timer)}</span>
        </div>
      </footer>
    </div>
  );
};

export default FightPage;
