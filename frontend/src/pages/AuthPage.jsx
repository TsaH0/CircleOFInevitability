import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createUser, login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await createUser(username, password);
      }
      await checkAuth();
      navigate("/levels");
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background-dark px-4 font-display overflow-hidden">
      {/* Subtle background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute -bottom-1/3 right-0 h-[600px] w-[600px] rounded-full bg-primary-dark/[0.06] blur-[100px]" />
      </div>

      {/* Header */}
      <header className="absolute top-0 w-full flex items-center justify-between px-8 py-6 z-10">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <span className="material-symbols-outlined text-primary text-lg">
              all_inclusive
            </span>
          </div>
          <span className="text-sm font-semibold text-white/80 tracking-wide">
            Circle of Inevitability
          </span>
        </motion.div>
      </header>

      {/* Main Card */}
      <motion.main
        className="z-10 w-full max-w-[420px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="rounded-2xl border border-white/[0.08] bg-card-dark/80 backdrop-blur-xl shadow-card overflow-hidden">
          {/* Card Header */}
          <div className="px-8 pt-8 pb-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              {isLogin
                ? "Sign in to continue your training."
                : "Start your competitive programming journey."}
            </p>
          </div>

          {/* Tabs */}
          <div className="mx-8 mt-6 flex rounded-lg bg-white/[0.04] p-1">
            <button
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-all duration-200 ${
                isLogin
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-all duration-200 ${
                !isLogin
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <div className="px-8 pt-6 pb-8">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 overflow-hidden"
                >
                  <div className="flex items-center gap-2.5 rounded-lg bg-danger-muted border border-danger/20 px-4 py-3">
                    <span className="material-symbols-outlined text-danger text-lg">
                      error
                    </span>
                    <p className="text-sm text-danger">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-text-secondary"
                  htmlFor="username"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] text-white px-4 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all duration-200"
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-text-secondary"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] text-white px-4 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all duration-200"
                  placeholder="Enter your password"
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full rounded-lg bg-primary hover:bg-primary-light text-background-dark py-3 px-6 text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{isLogin ? "Sign In" : "Create Account"}</span>
                )}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-text-muted">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-primary hover:text-primary-light font-medium transition-colors"
              >
                {isLogin ? "Register" : "Sign In"}
              </button>
            </p>
          </div>
        </div>

        {/* Footer tagline */}
        <motion.p
          className="mt-8 text-center text-xs text-text-muted/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Train with algorithmic challenges. Level up your skills.
        </motion.p>
      </motion.main>
    </div>
  );
};

export default AuthPage;
