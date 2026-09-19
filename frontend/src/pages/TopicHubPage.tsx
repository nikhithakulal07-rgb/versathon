import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass,
  BookOpen,
  Layers,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  FileText,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api, Topic, Subtopic } from '../lib/api';
import { MasteryRing } from '../components/common/MasteryRing';
import { MasteryBar } from '../components/common/MasteryBar';
import { StatusPill } from '../components/common/StatusPill';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export const TopicHubPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [pipelineState, setPipelineState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topicId) return;

    Promise.all([
      api.getTopicDetails(topicId),
      api.getTopicPipelineState(topicId).catch(() => null),
    ])
      .then(([topData, pipeData]) => {
        setTopic(topData);
        setPipelineState(pipeData);
      })
      .finally(() => setLoading(false));
  }, [topicId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading topic hub...
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Topic not found.
      </div>
    );
  }

  const subtopics = topic.subtopics || [];
  const firstSubtopicId = subtopics[0]?.id;

  const pipelineStages = [
    {
      step: 1,
      title: 'Diagnostic Calibration',
      desc: 'Rapid 5–10 question test to assess baseline understanding across subtopics.',
      icon: '🧭',
      actionTitle: 'Start Diagnostic',
      to: `/diagnostic/${topic.id}`,
      color: 'from-blue-600 to-indigo-700',
    },
    {
      step: 2,
      title: 'Personalized Lesson & Visual',
      desc: 'Interactive visual models with explanations tailored to your mastery level.',
      icon: '💡',
      actionTitle: 'Read Explanation',
      to: firstSubtopicId ? `/lesson/${firstSubtopicId}` : '#',
      color: 'from-purple-600 to-pink-700',
    },
    {
      step: 3,
      title: 'Leitner Flashcard Deck',
      desc: '3D interactive cards: swipe right for know, swipe left for revision.',
      icon: '📇',
      actionTitle: 'Practice Cards',
      to: firstSubtopicId ? `/flashcards/${firstSubtopicId}` : '#',
      color: 'from-amber-600 to-orange-700',
    },
    {
      step: 4,
      title: 'Revision Required',
      desc: 'Remedial queue for left-swiped flashcards with re-explanations & mini practice.',
      icon: '🔁',
      actionTitle: 'Revise Weak Cards',
      to: `/revision?topic_id=${topic.id}`,
      color: 'from-rose-600 to-red-700',
    },
    {
      step: 5,
      title: 'Adaptive MCQ Test',
      desc: 'Calibrated difficulty assessment adapting to your answers in real time.',
      icon: '⚡',
      actionTitle: 'Take Adaptive Test',
      to: `/test/${topic.id}`,
      color: 'from-emerald-600 to-teal-700',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        <Breadcrumbs
          items={[
            { label: 'School Mode', href: '/school' },
            { label: topic.title },
          ]}
        />

        {/* Topic Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <MasteryRing mastery={topic.overall_mastery || 0} size={76} strokeWidth={7} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold rounded-full border border-indigo-500/30">
                  Topic Hub
                </span>
                <StatusPill mastery={topic.overall_mastery || 0} size="sm" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{topic.title}</h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                {topic.description ||
                  'Unified adaptive learning track covering foundational and advanced concepts.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/diagnostic/${topic.id}`}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4" /> Start Diagnostic
            </Link>
            <Link
              to={`/game`}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              🎮 Play in Game Mode
            </Link>
          </div>
        </div>

        {/* Learning Pipeline Stages Checklist */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Shared Learning Pipeline
            </h2>
            <span className="text-xs text-slate-400">Step 1 through 5</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {pipelineStages.map((stg) => (
              <div
                key={stg.step}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{stg.icon}</span>
                    <span className="text-[10px] font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                      Step {stg.step}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white mb-1.5">{stg.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{stg.desc}</p>
                </div>

                <Link
                  to={stg.to}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 shadow"
                >
                  <span>{stg.actionTitle}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Subtopics Mastery Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Subtopic Mastery Breakdown
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Individual mastery levels update dynamically with every answer and flashcard swipe.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {subtopics.length} Concepts
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {subtopics.map((sub, idx) => (
              <div
                key={sub.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-7 h-7 rounded-xl bg-slate-800 text-slate-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-white">{sub.title}</h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      Concept: #{sub.concept_tag}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:w-1/2 justify-end">
                  <div className="w-36 hidden sm:block">
                    <MasteryBar mastery={sub.mastery || 0} size="sm" showPercentage />
                  </div>
                  <StatusPill mastery={sub.mastery || 0} status={sub.status} size="sm" />

                  <div className="flex items-center gap-1">
                    <Link
                      to={`/lesson/${sub.id}`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                      title="View Lesson"
                    >
                      Lesson
                    </Link>
                    <Link
                      to={`/flashcards/${sub.id}`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                      title="Practice Flashcards"
                    >
                      Cards
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
