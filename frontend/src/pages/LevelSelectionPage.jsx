import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  getContestHistory,
  generateContest,
  getActiveContest,
} from "../api/contests";
import { logout } from "../api/auth";

const LevelSelectionPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const historyData = await getContestHistory();
      setHistory(historyData.history || []);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFight = async () => {
    setGenerating(true);
    try {
      try {
        const active = await getActiveContest();
        if (active) {
          navigate("/fight");
          return;
        }
      } catch (e) {
        // No active contest, generate new one
      }

      await generateContest();
      await refreshUser();
      navigate("/fight");
    } catch (error) {
      console.error("Failed to generate contest:", error);
      alert(error.response?.data?.detail || "Failed to generate contest");
    } finally {
      setGenerating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const totalContests = history.length;
  const successfulContests = history.filter(
    (c) => c.status === "completed" && c.solvedCount === c.totalQuestions,
  ).length;

  const statCards = [
    {
      label: "Rating",
      value: user?.rating || 0,
      icon: "trending_up",
      color: "text-primary",
    },
    {
      label: "Level",
      value: user?.level || 1,
      icon: "military_tech",
      color: "text-warning",
    },
    {
      label: "Contests",
      value: totalContests,
      icon: "swords",
      color: "text-text-secondary",
    },
    {
      label: "Victories",
      value: successfulContests,
      icon: "emoji_events",
      color: "text-success",
    },
    {
      label: "Solved",
      value: user?.totalQuestionsSolved || 0,
      icon: "check_circle",
      color: "text-primary-light",
    },
    {
      label: "Traits",
      value: user?.traits?.length || 0,
      icon: "psychology",
      color: "text-text-muted",
    },
  ];

  return (
    <div className="min-h-screen bg-background-dark font-display text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background-dark/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-lg">
                all_inclusive
              </span>
            </div>
            <span className="text-sm font-semibold text-white/80 tracking-wide">
              Circle of Inevitability
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-2 text-right">
              <div>
                <p className="text-xs text-text-muted">
                  {user?.title || "Novice"}
                </p>
                <p className="text-sm font-semibold text-white">
                  {user?.username}
                </p>
              </div>
              <div className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm">
                {(user?.username || "U")[0].toUpperCase()}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-text-muted hover:text-white hover:bg-white/[0.06] transition-all duration-200"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-[18px]">
                logout
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10">
        {/* Page Title + Rating Bar */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="mt-1 text-text-secondary text-sm">
                Choose your next challenge
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/[0.06] bg-card-dark p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">
                  {stat.label}
                </span>
                <span
                  className={`material-symbols-outlined text-[18px] ${stat.color} opacity-60`}
                >
                  {stat.icon}
                </span>
              </div>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Action Card: Active Contest or New Challenge */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {user?.activeContestId ? (
            <div
              className="group cursor-pointer rounded-xl border border-primary/20 bg-primary/[0.04] p-6 flex items-center justify-between hover:bg-primary/[0.06] transition-all duration-200"
              onClick={() => navigate("/fight")}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    swords
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      Active Contest
                    </h3>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      In Progress
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    Continue where you left off
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-lg bg-primary hover:bg-primary-light text-background-dark px-6 py-2.5 text-sm font-semibold transition-colors duration-200"
              >
                Resume
              </motion.button>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-card-dark p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <span className="material-symbols-outlined text-text-secondary text-2xl">
                    bolt
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      New Challenge
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                      Ready
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    Generate a new set of problems to solve
                  </p>
                </div>
              </div>
              <motion.button
                onClick={handleFight}
                disabled={generating}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-lg bg-primary hover:bg-primary-light text-background-dark px-6 py-2.5 text-sm font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="h-4 w-4 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      play_arrow
                    </span>
                    Start
                  </>
                )}
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Battle History */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">History</h2>
            {history.length > 0 && (
              <span className="text-sm text-text-muted">
                {history.length} contest{history.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-text-muted">Loading history...</p>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-white/[0.04] bg-card-dark/50">
              <span className="material-symbols-outlined text-4xl text-text-muted/40 mb-3">
                history
              </span>
              <p className="text-text-muted text-sm">No contests yet</p>
              <p className="text-text-muted/60 text-xs mt-1">
                Start your first challenge to see your history here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 10).map((contest, index) => {
                const isFullSolve =
                  contest.solvedCount === contest.totalQuestions;
                const ratingChange =
                  (contest.ratingAfter || contest.ratingBefore) -
                  contest.ratingBefore;

                return (
                  <motion.div
                    key={contest.contestId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.04 }}
                    className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-card-dark p-4 hover:bg-white/[0.02] transition-all duration-200"
                  >
                    {/* Status icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isFullSolve
                          ? "bg-success/10 border border-success/20"
                          : contest.status === "abandoned"
                            ? "bg-white/[0.04] border border-white/[0.08]"
                            : "bg-warning/10 border border-warning/20"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-lg ${
                          isFullSolve
                            ? "text-success"
                            : contest.status === "abandoned"
                              ? "text-text-muted"
                              : "text-warning"
                        }`}
                      >
                        {isFullSolve
                          ? "check_circle"
                          : contest.status === "abandoned"
                            ? "close"
                            : "remove_done"}
                      </span>
                    </div>

                    {/* Title + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-white truncate">
                          {contest.title || `Contest #${contest.contestId}`}
                        </h3>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {contest.solvedCount}/{contest.totalQuestions} solved
                        <span className="mx-1.5 text-white/10">|</span>
                        <span className="capitalize">{contest.status}</span>
                      </p>
                    </div>

                    {/* Rating change */}
                    <div className="shrink-0 text-right">
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          ratingChange > 0
                            ? "text-success"
                            : ratingChange < 0
                              ? "text-danger"
                              : "text-text-muted"
                        }`}
                      >
                        {ratingChange > 0 ? "+" : ""}
                        {ratingChange}
                      </span>
                      <p className="text-xs text-text-muted/60 mt-0.5">
                        {contest.ratingBefore} →{" "}
                        {contest.ratingAfter || contest.ratingBefore}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {history.length > 10 && (
                <p className="text-center text-xs text-text-muted py-4">
                  Showing 10 of {history.length} contests
                </p>
              )}
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-4 px-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between text-xs text-text-muted/50">
          <span>Circle of Inevitability</span>
          <span>v1.0</span>
        </div>
      </footer>
    </div>
  );
};

export default LevelSelectionPage;
