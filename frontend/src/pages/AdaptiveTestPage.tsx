import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, AlertCircle } from 'lucide-react';
import { api, Question, AnswerResponse } from '../lib/api';
import { QuestionCard } from '../components/common/QuestionCard';
import { useSound } from '../context/SoundContext';

export const AdaptiveTestPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const [searchParams] = useSearchParams();
  const testType = searchParams.get('type') || 'adaptive';
  const modeUsed = searchParams.get('mode') || 'school';
  const missionId = searchParams.get('mission_id');

  const { playSound } = useSound();
  const navigate = useNavigate();

  const [testId, setTestId] = useState<string | null>(null);
  const [topicTitle, setTopicTitle] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) return;

    api
      .startTest({
        topic_id: topicId,
        type: testType,
        mode_used: modeUsed,
      })
      .then((res) => {
        setTestId(res.test_id);
        setTopicTitle(res.title);
        return api.getNextTestQuestion(res.test_id);
      })
      .then((qData) => {
        if (qData.is_completed) {
          setIsCompleted(true);
        } else {
          setCurrentQuestion(qData.question || null);
          setQuestionNumber(qData.question_number);
          setTotalQuestions(qData.total_questions);
        }
      })
      .catch((err) => setError(err.message || 'Failed to start adaptive test'))
      .finally(() => setLoading(false));
  }, [topicId, testType, modeUsed]);

  const handleAnswer = async (
    chosenIndex: number,
    timeTaken: number,
    hintUsed: boolean
  ): Promise<AnswerResponse> => {
    if (!testId || !currentQuestion) {
      throw new Error('No active question');
    }

    return await api.submitTestAnswer(testId, {
      question_id: currentQuestion.id,
      chosen_index: chosenIndex,
      time_taken_seconds: timeTaken,
      hint_used: hintUsed,
    });
  };

  const handleNext = async () => {
    if (!testId) return;
    setLoading(true);

    try {
      const qData = await api.getNextTestQuestion(testId);
      if (qData.is_completed) {
        // Complete test and generate report card
        await api.finishTest(testId);
        playSound('levelUp');
        navigate(`/report/${testId}${missionId ? `?mission_id=${missionId}` : ''}`);
      } else {
        setCurrentQuestion(qData.question || null);
        setQuestionNumber(qData.question_number);
        setTotalQuestions(qData.total_questions);
      }
    } catch (err: any) {
      console.error('Failed to load next test question:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Calibrating next adaptive question...
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

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Test Header */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">
              {testType === 'boss' ? 'Knowledge Guardian Boss Challenge:' : 'Adaptive MCQ Assessment:'}
            </span>
            <span className="text-xs text-indigo-300 font-semibold">{topicTitle}</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            onAnswer={handleAnswer}
            onNext={handleNext}
            isLastQuestion={questionNumber >= totalQuestions}
          />
        )}
      </div>
    </div>
  );
};
