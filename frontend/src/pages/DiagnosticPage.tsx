import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, CheckCircle2, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { api, Question, AnswerResponse } from '../lib/api';
import { QuestionCard } from '../components/common/QuestionCard';
import { useSound } from '../context/SoundContext';

export const DiagnosticPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const [searchParams] = useSearchParams();
  const modeUsed = searchParams.get('mode') || 'school';
  const missionId = searchParams.get('mission_id');

  const { playSound } = useSound();
  const navigate = useNavigate();

  const [diagnosticId, setDiagnosticId] = useState<string | null>(null);
  const [topicTitle, setTopicTitle] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [totalEstimated, setTotalEstimated] = useState<number>(5);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) return;

    api
      .startDiagnostic({ topic_id: topicId, mode_used: modeUsed })
      .then((res) => {
        setDiagnosticId(res.diagnostic_id);
        setTopicTitle(res.title);
        return api.getNextDiagnosticQuestion(res.diagnostic_id);
      })
      .then((qData) => {
        if (qData.is_completed) {
          setIsCompleted(true);
          setSummary(qData.summary);
        } else {
          setCurrentQuestion(qData.question || null);
          setQuestionIndex(qData.current_index);
          setTotalEstimated(qData.total_estimated);
        }
      })
      .catch((err) => setError(err.message || 'Failed to start diagnostic'))
      .finally(() => setLoading(false));
  }, [topicId, modeUsed]);

  const handleAnswer = async (
    chosenIndex: number,
    timeTaken: number,
    hintUsed: boolean
  ): Promise<AnswerResponse> => {
    if (!diagnosticId || !currentQuestion) {
      throw new Error('No active question');
    }

    return await api.submitDiagnosticAnswer(diagnosticId, {
      question_id: currentQuestion.id,
      chosen_index: chosenIndex,
      time_taken_seconds: timeTaken,
      hint_used: hintUsed,
    });
  };

  const handleNext = async () => {
    if (!diagnosticId) return;
    setLoading(true);

    try {
      const qData = await api.getNextDiagnosticQuestion(diagnosticId);
      if (qData.is_completed) {
        const fin = await api.finishDiagnostic(diagnosticId);
        setIsCompleted(true);
        setSummary(fin.summary);
        playSound('levelUp');
      } else {
        setCurrentQuestion(qData.question || null);
        setQuestionIndex(qData.current_index);
        setTotalEstimated(qData.total_estimated);
      }
    } catch (err: any) {
      console.error('Failed to load next diagnostic question:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !currentQuestion && !isCompleted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Calibrating diagnostic questions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-rose-400 text-sm p-4 text-center">
        <AlertCircle className="w-10 h-10 mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-xl w-full shadow-2xl text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-3xl mx-auto shadow-xl shadow-indigo-500/30">
            🧭
          </div>

          <div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold rounded-full border border-indigo-500/30">
              Calibration Complete
            </span>
            <h2 className="text-2xl font-black text-white mt-2">
              Topic Baseline Initialized!
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
              Your responses have established baseline theta ability scores for each subtopic in <strong>{topicTitle}</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-left space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Diagnostic Rewards:
            </span>
            <div className="flex items-center justify-between text-xs text-slate-200">
              <span>XP Awarded</span>
              <strong className="text-amber-400 font-mono">+30 XP</strong>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-200">
              <span>Coverage</span>
              <strong className="text-indigo-400 font-mono">100% Subtopics Assessed</strong>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                if (missionId) {
                  navigate(`/game/mission/${missionId}`);
                } else {
                  navigate(`/topic/${topicId}`);
                }
              }}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Continue Learning Path</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200">Diagnostic Assessment:</span>
            <span className="text-xs text-indigo-300 font-semibold">{topicTitle}</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Progress: {questionIndex} / ~{totalEstimated}
          </span>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            questionNumber={questionIndex}
            totalQuestions={totalEstimated}
            onAnswer={handleAnswer}
            onNext={handleNext}
            isLastQuestion={questionIndex >= totalEstimated}
          />
        )}
      </div>
    </div>
  );
};
