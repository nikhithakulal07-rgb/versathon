import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, RotateCcw, ArrowLeft, ArrowRight, Sparkles, Layers, BookOpen } from 'lucide-react';
import { Flashcard } from '../../lib/api';
import { useSound } from '../../context/SoundContext';

interface FlashcardDeckProps {
  flashcards: Flashcard[];
  onRespond: (flashcardId: string, response: 'know' | 'revise') => Promise<any>;
  onFinish: (stats: { knowCount: number; reviseCount: number; revisedCards: Flashcard[] }) => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  flashcards,
  onRespond,
  onFinish,
}) => {
  const { playSound } = useSound();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knowCount, setKnowCount] = useState(0);
  const [reviseCount, setReviseCount] = useState(0);
  const [revisedCards, setRevisedCards] = useState<Flashcard[]>([]);
  const [isDone, setIsDone] = useState(false);

  // Framer Motion Drag values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacityRevise = useTransform(x, [-120, 0], [1, 0]);
  const opacityKnow = useTransform(x, [0, 120], [0, 1]);

  const currentCard = flashcards[currentIndex];

  const handleResponse = async (response: 'know' | 'revise') => {
    if (!currentCard || isDone) return;

    if (response === 'know') {
      setKnowCount((prev) => prev + 1);
      playSound('correct');
    } else {
      setReviseCount((prev) => prev + 1);
      setRevisedCards((prev) => [...prev, currentCard]);
      playSound('wrong');
    }

    try {
      await onRespond(currentCard.id, response);
    } catch (e) {
      console.error('Failed to log flashcard response:', e);
    }

    setIsFlipped(false);
    x.set(0);

    if (currentIndex + 1 < flashcards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsDone(true);
      onFinish({
        knowCount: response === 'know' ? knowCount + 1 : knowCount,
        reviseCount: response === 'revise' ? reviseCount + 1 : reviseCount,
        revisedCards: response === 'revise' ? [...revisedCards, currentCard] : revisedCards,
      });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDone) return;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleResponse('revise');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleResponse('know');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isDone, currentCard, knowCount, reviseCount]);

  if (flashcards.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-900/80 rounded-2xl border border-slate-800 text-slate-400">
        No flashcards available for this topic.
      </div>
    );
  }

  if (isDone) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/90 border border-slate-700/60 rounded-3xl p-8 text-white shadow-2xl max-w-xl mx-auto text-center"
      >
        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-indigo-500/30">
          ✨
        </div>
        <h3 className="text-2xl font-bold mb-2">Deck Completed!</h3>
        <p className="text-sm text-slate-400 mb-6">
          Great work reviewing this concept deck. Progress updated via Leitner algorithm.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4">
            <span className="text-2xl font-bold text-emerald-400 font-mono">{knowCount}</span>
            <span className="block text-xs text-emerald-300 font-medium mt-1">Mastered (Right Swipe)</span>
          </div>
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-4">
            <span className="text-2xl font-bold text-rose-400 font-mono">{reviseCount}</span>
            <span className="block text-xs text-rose-300 font-medium mt-1">Revision Queue (Left Swipe)</span>
          </div>
        </div>

        {reviseCount > 0 ? (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-left text-xs text-yellow-200 mb-6 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">Adaptive Revision Ready:</strong>
              {reviseCount} card{reviseCount > 1 ? 's' : ''} added to your Revision Required queue for concept re-explanation and mini-practice!
            </div>
          </div>
        ) : (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-left text-xs text-emerald-200 mb-6 flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="block font-bold">Flawless Recall!</strong>
              You knew every single concept in this deck.
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="max-w-xl mx-auto select-none">
      {/* Deck Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono text-slate-400">
            Card {currentIndex + 1} of {flashcards.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-emerald-400">{knowCount} ✓</span>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-mono text-rose-400">{reviseCount} ✗</span>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-6">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
        />
      </div>

      {/* 3D Interactive Flip Card with Drag */}
      <div className="relative h-80 sm:h-96 w-full cursor-pointer perspective-1000">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100) {
                handleResponse('know');
              } else if (info.offset.x < -100) {
                handleResponse('revise');
              }
            }}
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-full relative"
          >
            {/* Visual Drag Overlays */}
            <motion.div
              style={{ opacity: opacityKnow }}
              className="absolute top-4 right-4 z-30 px-3 py-1 bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-1.5 text-xs pointer-events-none"
            >
              <Check className="w-4 h-4" /> I KNOW THIS
            </motion.div>

            <motion.div
              style={{ opacity: opacityRevise }}
              className="absolute top-4 left-4 z-30 px-3 py-1 bg-rose-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-1.5 text-xs pointer-events-none"
            >
              <RotateCcw className="w-4 h-4" /> NEED REVISION
            </motion.div>

            {/* Front & Back Faces */}
            <div
              className={`w-full h-full rounded-3xl p-8 flex flex-col justify-between transition-all duration-500 border-2 shadow-2xl ${
                isFlipped
                  ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border-indigo-500/70 shadow-indigo-500/20'
                  : 'bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border-slate-700/80 hover:border-slate-600'
              }`}
            >
              {/* Card Top Pill */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
                  {isFlipped ? '💡 Explanation & Answer' : '❓ Concept Prompt'}
                </span>
                <span className="text-[11px] font-mono text-indigo-400">
                  Leitner Box {currentCard.leitner_box || 1}
                </span>
              </div>

              {/* Card Main Body */}
              <div className="my-auto text-center px-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                  {isFlipped ? currentCard.back : currentCard.front}
                </h3>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
                <span>{isFlipped ? 'Click or Space to flip back' : 'Click or Space to reveal answer'}</span>
                {currentCard.concept_tag && (
                  <span className="font-mono text-slate-400">#{currentCard.concept_tag}</span>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons for Desktop / Mobile */}
      <div className="flex items-center justify-between gap-4 mt-6">
        <button
          onClick={() => handleResponse('revise')}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/60 text-slate-300 hover:text-rose-300 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-rose-400" />
          <span>I Need Revision (←)</span>
        </button>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-2xl text-xs transition-colors"
          title="Flip Card"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleResponse('know')}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-emerald-600 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <span>I Know This (→)</span>
          <ArrowRight className="w-4 h-4 text-emerald-300" />
        </button>
      </div>
    </div>
  );
};
