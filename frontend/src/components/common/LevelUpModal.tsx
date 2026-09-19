import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Award, Zap, Sparkles, X } from 'lucide-react';
import { useSound } from '../../context/SoundContext';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldLevel: number;
  newLevel: number;
  levelTitle: string;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  oldLevel,
  newLevel,
  levelTitle,
}) => {
  const { playSound } = useSound();

  useEffect(() => {
    if (isOpen) {
      playSound('levelUp');
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899', '#eab308', '#10b981'],
        });
      } catch (_) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-2 border-amber-400/60 rounded-3xl p-8 text-center text-white shadow-2xl shadow-indigo-500/30 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Glow backdrop */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Level Badge Icon */}
          <div className="relative inline-block my-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-5xl shadow-2xl shadow-amber-500/50 mx-auto border-4 border-amber-200"
            >
              👑
            </motion.div>
            <span className="absolute -bottom-2 -right-2 bg-indigo-600 text-white font-mono text-xs font-bold px-2 py-0.5 rounded-full border-2 border-indigo-400">
              +{newLevel - oldLevel}
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white mb-1">
            LEVEL UP!
          </h2>
          <p className="text-amber-300 font-bold text-lg font-mono">
            Level {newLevel} • {levelTitle}
          </p>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-xs mx-auto">
            Your adaptive learning mastery has elevated your scholar rank! Keep conquering new topics.
          </p>

          <div className="mt-6 flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/40 text-sm tracking-wide transition-transform active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Claim Rewards & Continue
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
