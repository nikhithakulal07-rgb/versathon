import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  BookOpen,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Award,
  Zap,
} from 'lucide-react';
import { api, RevisionItem } from '../lib/api';
import { useSound } from '../context/SoundContext';

export const RevisionRequiredPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const topicId = searchParams.get('topic_id') || undefined;
  const { playSound } = useSound();
  const navigate = useNavigate();

  const [revisionQueue, setRevisionQueue] = useState<RevisionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMiniOption, setSelectedMiniOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [clearedCount, setClearedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getRevisionRequired(topicId)
      .then((res) => {
        setRevisionQueue(res.revision_queue || []);
      })
      .catch((e) => console.error('Failed to load revision queue:', e))
      .finally(() => setLoading(false));
  }, [topicId]);

  const currentItem = revisionQueue[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (selectedMiniOption !== null) return;
    setSelectedMiniOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === 0; // Mini practice questions index 0 is correct
    if (isCorrect) {
      playSound('correct');
      setClearedCount((prev) => prev + 1);
    } else {
      playSound('wrong');
    }
  };

  const handleNextCard = () => {
    setSelectedMiniOption(null);
    setIsAnswered(false);
    if (currentIndex + 1 < revisionQueue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(revisionQueue.length); // Done state
      playSound('levelUp');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading revision queue...
      </div>
    );
  }

  if (revisionQueue.length === 0 || currentIndex >= revisionQueue.length) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-3xl mx-auto shadow-xl shadow-emerald-500/30">
            🎉
          </div>

          <div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold rounded-full border border-emerald-500/30">
              Revision Complete
            </span>
            <h2 className="text-2xl font-black text-white mt-2">
              All Weak Cards Cleared!
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              You reviewed concepts and answered mini-practice drills to strengthen weak memory traces.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-left space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Cards Reviewed</span>
              <strong className="text-emerald-400 font-mono">{clearedCount} Concepts</strong>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Achievement</span>
              <strong className="text-amber-400 font-mono">🔁 Revision Hero Badge!</strong>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-rose-500/30 rounded-2xl px-5 py-3 shadow">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-bold text-slate-200">Revision Required Queue:</span>
            <span className="text-xs text-rose-300 font-mono">
              Card {currentIndex + 1} of {revisionQueue.length}
            </span>
          </div>
          <span className="text-xs font-mono text-amber-400 font-bold">+5 XP per card</span>
        </div>

        {/* Re-explanation Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
              {currentItem.subtopic_title}
            </span>
            <span className="text-xs font-mono text-slate-400">
              #{currentItem.concept_tag}
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-300 mb-1">Concept Question:</h3>
            <p className="text-lg font-bold text-white mb-4">{currentItem.front}</p>
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-slate-300 leading-relaxed">
              <strong className="text-emerald-400 block mb-1">Answer & Explanation:</strong>
              {currentItem.back}
            </div>
          </div>
        </div>

        {/* Mini Practice Drill */}
        {currentItem.mini_practice_question && (
          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Mini Practice Check (Level {currentItem.mini_practice_question.difficulty})
              </span>
              <span className="text-[11px] text-slate-400">Verify Retention</span>
            </div>

            <p className="text-sm font-bold text-white">
              {currentItem.mini_practice_question.stem}
            </p>

            <div className="space-y-2.5">
              {currentItem.mini_practice_question.options.map((opt, idx) => {
                const isSelected = selectedMiniOption === idx;
                let btnStyle = 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750';

                if (isAnswered) {
                  if (idx === 0) {
                    btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/30';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-200';
                  } else {
                    btnStyle = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-50';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="flex justify-end pt-3">
                <button
                  onClick={handleNextCard}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
                >
                  <span>
                    {currentIndex + 1 < revisionQueue.length ? 'Next Revision Item' : 'Complete Revision'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
