import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const result = location.state?.result;

  if (!result) {
    navigate('/levels');
    return null;
  }

  const isVictory = result.solvedCount === result.totalQuestions;

  return (
    <div className="dark bg-[#0a0a0a] text-white min-h-screen flex flex-col font-display">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-8 py-4 bg-[#0a0a0a] sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center bg-white text-black p-1 rounded-sm">
            <span className="material-symbols-outlined text-[20px]">architecture</span>
          </div>
          <h2 className="text-sm font-bold tracking-widest uppercase">The Circle of Inevitability</h2>
        </div>
        <nav className="flex items-center gap-10">
          <button
            onClick={() => navigate('/levels')}
            className="flex items-center justify-center p-2 border border-zinc-800 hover:bg-zinc-900 rounded-lg"
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          className="max-w-[800px] w-full text-center space-y-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Result Header */}
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={`inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm mb-2 ${
                isVictory ? 'bg-white text-black' : 'bg-red-500/20 text-red-400'
              }`}
            >
              Battle Status: {isVictory ? 'Victory' : 'Concluded'}
            </motion.div>

            <motion.h1
              className="text-6xl md:text-7xl font-black stark-heading uppercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {isVictory ? 'Monster Defeated' : 'Battle Complete'}
            </motion.h1>

            <motion.p
              className="text-zinc-500 text-sm uppercase tracking-widest font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {isVictory
                ? 'Outcome generated via optimal solution'
                : `${result.solvedCount}/${result.totalQuestions} objectives completed`}
            </motion.p>
          </div>

          {/* Reward Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {/* Level */}
            <div className="flex flex-col gap-4 p-8 border border-zinc-800 bg-zinc-900/50 rounded-lg text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Milestone</span>
                <span className="material-symbols-outlined text-sm opacity-40">trending_up</span>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold">Level</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black">Level {result.levelAfter}</p>
                  {result.levelAfter > result.levelBefore && (
                    <span className="text-green-400 text-sm font-bold">+{result.levelAfter - result.levelBefore}</span>
                  )}
                </div>
              </div>
              <div className="h-1 bg-zinc-800 w-full mt-2">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(result.levelAfter, 100)}%` }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                />
              </div>
            </div>

            {/* Rating */}
            <div className="flex flex-col gap-4 p-8 border border-zinc-800 bg-zinc-900/50 rounded-lg text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Power</span>
                <span className="material-symbols-outlined text-sm opacity-40">bolt</span>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold">Rating Change</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black">{result.ratingAfter}</p>
                  <span className={`text-sm font-bold ${result.ratingChange > 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                    {result.ratingChange > 0 ? '+' : ''}{result.ratingChange}
                  </span>
                </div>
              </div>
              <div className="text-xs text-zinc-500">
                {result.ratingBefore} → {result.ratingAfter}
              </div>
            </div>

            {/* Title/Traits */}
            <div className="flex flex-col gap-4 p-8 border border-zinc-800 bg-zinc-900/50 rounded-lg text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {result.newTitle ? 'Designation' : 'Abilities'}
                </span>
                <span className="material-symbols-outlined text-sm opacity-40">
                  {result.newTitle ? 'verified_user' : 'psychology'}
                </span>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold">
                  {result.newTitle ? 'New Title' : 'New Traits'}
                </p>
                {result.newTitle ? (
                  <p className="text-2xl font-black mt-1 leading-tight">{result.newTitle}</p>
                ) : result.newTraits?.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.newTraits.map((trait, i) => (
                      <span key={i} className="px-2 py-1 bg-white/10 rounded text-sm font-bold">
                        {trait}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-lg font-bold mt-1 text-zinc-500">Keep fighting!</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            className="border-y border-zinc-800 py-8 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h4 className="text-[10px] font-black tracking-[0.3em] uppercase mb-6 text-zinc-400">
              Battle Execution Logs
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center">
                <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Solved</p>
                <p className="text-xl font-mono font-bold tracking-tighter">
                  {result.solvedCount}/{result.totalQuestions}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Status</p>
                <p className={`text-xl font-mono font-bold tracking-tighter ${
                  isVictory ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {result.status.toUpperCase()}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Rating Gain</p>
                <p className={`text-xl font-mono font-bold tracking-tighter ${
                  result.ratingChange > 0 ? 'text-green-400' : ''
                }`}>
                  +{result.ratingChange}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Level Up</p>
                <p className="text-xl font-mono font-bold tracking-tighter">
                  {result.levelAfter > result.levelBefore ? `+${result.levelAfter - result.levelBefore}` : '-'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <motion.button
              onClick={() => navigate('/levels')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto px-10 py-5 bg-white text-black text-sm font-black uppercase tracking-[0.1em] hover:opacity-90 transition-all rounded-lg"
            >
              {isVictory ? 'Proceed to Next Circle' : 'Return to Lobby'}
            </motion.button>
            {!isVictory && (
              <motion.button
                onClick={() => navigate('/levels')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-10 py-5 border-2 border-zinc-800 hover:bg-zinc-900 text-sm font-black uppercase tracking-[0.1em] transition-all rounded-lg"
              >
                Try Again
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-zinc-800 flex justify-between items-center text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">
        <div>System Version 4.0.2</div>
        <div className="flex gap-4">
          <span className="hover:text-white cursor-pointer">Privacy Protocol</span>
          <span className="hover:text-white cursor-pointer">System Logs</span>
        </div>
      </footer>
    </div>
  );
};

export default ResultPage;
