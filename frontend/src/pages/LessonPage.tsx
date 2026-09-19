import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Sparkles,
  Layers,
  Zap,
  ArrowRight,
  HelpCircle,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { api, ExplanationData } from '../lib/api';
import { VisualRenderer } from '../components/visuals/VisualRenderer';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export const LessonPage: React.FC = () => {
  const { subtopicId } = useParams<{ subtopicId: string }>();
  const [searchParams] = useSearchParams();
  const missionId = searchParams.get('mission_id');

  const [explanation, setExplanation] = useState<ExplanationData | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('beginner');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subtopicId) return;
    setLoading(true);

    api
      .getExplanation(subtopicId, selectedLevel)
      .then((data) => {
        setExplanation(data);
        if (data.level) setSelectedLevel(data.level);
      })
      .catch((e) => console.error('Failed to load lesson:', e))
      .finally(() => setLoading(false));
  }, [subtopicId, selectedLevel]);

  if (loading && !explanation) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Preparing personalized lesson explanation...
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Lesson not found.
      </div>
    );
  }

  const levelLabels = [
    { id: 'beginner', label: 'Beginner', desc: 'Simple terms, intuitive analogies, step-by-step', emoji: '🌱' },
    { id: 'intermediate', label: 'Intermediate', desc: 'Core formulas, practical circuit & code examples', emoji: '🌿' },
    { id: 'advanced', label: 'Advanced', desc: 'Deep derivations, edge cases, challenge scenarios', emoji: '🌳' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Curriculum', href: '/school' },
            { label: explanation.subtopic_title },
            { label: 'Interactive Lesson' },
          ]}
        />

        {/* Lesson Title & Adaptive Complexity Level Switcher */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold rounded-full border border-indigo-500/30 inline-block mb-2">
              Concept Breakdown
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {explanation.subtopic_title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Explanation complexity tailored automatically by the adaptive mastery engine.
            </p>
          </div>

          {/* Level Toggle Tabs */}
          <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
            {levelLabels.map((lvl) => {
              const isSelected = selectedLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={lvl.desc}
                >
                  <span>{lvl.emoji}</span>
                  <span>{lvl.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Visual Model Component */}
        {explanation.visual_spec && (
          <div className="my-6">
            <VisualRenderer spec={explanation.visual_spec} />
          </div>
        )}

        {/* Lesson Markdown Body */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl prose prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200 font-sans space-y-4">
            {explanation.body_markdown}
          </div>
        </div>

        {/* Next Step Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl">
          <div>
            <h3 className="font-bold text-sm text-white">Reinforce This Concept</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Practice Leitner flashcards or take an adaptive quiz.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to={`/flashcards/${subtopicId}${missionId ? `?mission_id=${missionId}` : ''}`}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Layers className="w-4 h-4" /> Practice Flashcards →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
