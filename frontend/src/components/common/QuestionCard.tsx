import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, HelpCircle, CheckCircle, XCircle, ArrowRight, Award, Zap } from 'lucide-react';
import { Question, AnswerResponse } from '../../lib/api';
import { useSound } from '../../context/SoundContext';

interface QuestionCardProps {
  question: Question;
  questionNumber?: number;
  totalQuestions?: number;
  onAnswer: (chosenIndex: number, timeTaken: number, hintUsed: boolean) => Promise<AnswerResponse>;
  onNext?: () => void;
  isLastQuestion?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  onNext,
  isLastQuestion = false,
}) => {
  const { playSound } = useSound();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerResponse, setAnswerResponse] = useState<AnswerResponse | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Timer
  useEffect(() => {
    setSelectedIndex(null);
    setAnswerResponse(null);
    setShowHint(false);
    setHintUsed(false);
    setSecondsElapsed(0);

    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [question.id]);

  const handleSelectOption = async (index: number) => {
    if (selectedIndex !== null || isSubmitting) return;

    setSelectedIndex(index);
    setIsSubmitting(true);

    try {
      const resp = await onAnswer(index, secondsElapsed, hintUsed);
      setAnswerResponse(resp);
      if (resp.is_correct) {
        playSound('correct');
      } else {
        playSound('wrong');
      }
    } catch (err) {
      console.error('Answer submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseHint = () => {
    setShowHint(true);
    setHintUsed(true);
    playSound('click');
  };

  const difficultyNames = ['', 'Easy (L1)', 'Medium (L2)', 'Intermediate (L3)', 'Advanced (L4)', 'Expert (L5)'];
  const difficultyColors = [
    '',
    'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    'text-blue-400 bg-blue-500/10 border-blue-500/30',
    'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    'text-orange-400 bg-orange-500/10 border-orange-500/30',
    'text-rose-400 bg-rose-500/10 border-rose-500/30',
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-700/70 rounded-3xl p-6 sm:p-8 text-white shadow-2xl max-w-3xl mx-auto backdrop-blur-md">
      {/* Top Header info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          {questionNumber && (
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold rounded-full">
              Question {questionNumber} {totalQuestions ? `of ${totalQuestions}` : ''}
            </span>
          )}
          <span
            className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
              difficultyColors[question.difficulty] || difficultyColors[2]
            }`}
          >
            ⚡ {difficultyNames[question.difficulty] || `Level ${question.difficulty}`}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>{secondsElapsed}s</span>
            {question.expected_time_seconds && (
              <span className="text-slate-600">/ ~{question.expected_time_seconds}s</span>
            )}
          </div>

          {!answerResponse && (
            <button
              onClick={handleUseHint}
              disabled={showHint}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                showHint
                  ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Hint {hintUsed ? '(Used)' : ''}</span>
            </button>
          )}
        </div>
      </div>

      {/* Hint Alert */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-200 text-xs flex items-start gap-2"
          >
            <span className="text-base">💡</span>
            <div>
              <strong className="font-semibold block mb-0.5">Misconception Hint:</strong>
              Focus on the core relationship of the concept and verify unit conversions.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Stem */}
      <div className="mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-slate-100 leading-relaxed">
          {question.stem}
        </h3>
        {question.concept_tag && (
          <span className="inline-block mt-2 text-[11px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
            Concept: #{question.concept_tag}
          </span>
        )}
      </div>

      {/* Options List */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrectAnswer = answerResponse && answerResponse.correct_index === idx;
          const isWrongChosen = answerResponse && !answerResponse.is_correct && isSelected;

          let btnStyles = 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-200 hover:border-slate-600';
          let letterBg = 'bg-slate-700 text-slate-300';

          if (answerResponse) {
            if (isCorrectAnswer) {
              btnStyles = 'bg-emerald-950/70 border-emerald-500/80 text-emerald-100 ring-2 ring-emerald-500/40';
              letterBg = 'bg-emerald-500 text-white';
            } else if (isWrongChosen) {
              btnStyles = 'bg-rose-950/70 border-rose-500/80 text-rose-100 ring-2 ring-rose-500/40';
              letterBg = 'bg-rose-500 text-white';
            } else {
              btnStyles = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60';
              letterBg = 'bg-slate-800 text-slate-600';
            }
          } else if (isSelected) {
            btnStyles = 'bg-indigo-900/60 border-indigo-500 text-white ring-2 ring-indigo-500/50';
            letterBg = 'bg-indigo-500 text-white';
          }

          const letters = ['A', 'B', 'C', 'D'];

          return (
            <motion.button
              key={idx}
              whileHover={!answerResponse ? { scale: 1.01 } : {}}
              whileTap={!answerResponse ? { scale: 0.99 } : {}}
              onClick={() => handleSelectOption(idx)}
              disabled={selectedIndex !== null || isSubmitting}
              className={`w-full text-left p-4 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${btnStyles}`}
            >
              <div className="flex items-center gap-3.5">
                <span className={`w-8 h-8 rounded-xl font-bold font-mono text-sm flex items-center justify-center shrink-0 transition-colors ${letterBg}`}>
                  {letters[idx]}
                </span>
                <span className="text-sm sm:text-base font-medium leading-normal">{option}</span>
              </div>

              {answerResponse && (
                <div className="shrink-0">
                  {isCorrectAnswer && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  {isWrongChosen && <XCircle className="w-5 h-5 text-rose-400" />}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Answer Feedback & Explanation Drawer */}
      <AnimatePresence>
        {answerResponse && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className={`p-5 rounded-2xl border mb-6 ${
              answerResponse.is_correct
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-base">
                {answerResponse.is_correct ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Correct! +{answerResponse.xp_awarded} XP</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span>Incorrect</span>
                  </>
                )}
              </div>

              {answerResponse.xp_awarded > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30">
                  <Award className="w-3.5 h-3.5" /> +{answerResponse.xp_awarded} XP
                </span>
              )}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mt-2">{answerResponse.explanation}</p>

            {answerResponse.misconception_hint && (
              <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-yellow-300/90">
                <strong>Why common misconceptions happen:</strong> {answerResponse.misconception_hint}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Action */}
      {answerResponse && onNext && (
        <div className="flex justify-end">
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 text-sm"
          >
            <span>{isLastQuestion ? 'Complete Assessment' : 'Next Question'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
