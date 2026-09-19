import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Printer,
  ChevronDown,
  ChevronUp,
  Share2,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api, ReportCard } from '../lib/api';
import { MasteryRing } from '../components/common/MasteryRing';
import { StatusPill } from '../components/common/StatusPill';
import { useSound } from '../context/SoundContext';

export const ReportCardPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [searchParams] = useSearchParams();
  const missionId = searchParams.get('mission_id');

  const { playSound } = useSound();
  const navigate = useNavigate();

  const [report, setReport] = useState<ReportCard | null>(null);
  const [showMistakes, setShowMistakes] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!testId) return;

    api
      .getTestReport(testId)
      .then((data) => setReport(data))
      .catch((e) => console.error('Failed to load report:', e))
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Generating comprehensive report card...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Report not found.
      </div>
    );
  }

  const chartData = [
    { name: 'Baseline', mastery: report.mastery_before },
    { name: 'Mid Assessment', mastery: Math.round((report.mastery_before + report.mastery_after) / 2) },
    { name: 'Final Mastery', mastery: report.mastery_after },
  ];

  const masteryGain = report.mastery_after - report.mastery_before;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 print:bg-white print:text-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Printable/Share Bar */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            to={`/topic/${report.topic_id}`}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            ← Return to Topic Hub
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
        </div>

        {/* Main Report Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 print:border-slate-300">
            <div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold rounded-full border border-emerald-500/30 inline-block mb-2 print:border-emerald-600 print:text-emerald-800">
                Assessment Report
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white print:text-black">
                {report.topic_title}
              </h1>
              <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
                Adaptive Mastery Calibration Summary
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">XP Earned</span>
                <span className="text-lg font-black font-mono text-amber-400">+{report.xp_earned} XP</span>
              </div>
              <MasteryRing mastery={report.mastery_after} size={64} strokeWidth={6} />
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl print:border-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Score</span>
              <span className="text-2xl font-black font-mono text-white print:text-black">
                {report.score} / {report.total_questions}
              </span>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl print:border-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Accuracy</span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                {report.accuracy}%
              </span>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl print:border-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Mastery Shift</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold font-mono text-slate-400">{report.mastery_before}%</span>
                <span className="text-xs text-slate-600">→</span>
                <span className="text-xl font-black font-mono text-indigo-400">{report.mastery_after}%</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl print:border-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Time Elapsed</span>
              <span className="text-2xl font-black font-mono text-purple-400">
                {report.duration_seconds}s
              </span>
            </div>
          </div>

          {/* Strong / Needs Practice / Weak Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Strong */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl print:border-emerald-300">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-4 h-4" /> Strong Concepts (🟢)
              </span>
              {report.strong_areas && report.strong_areas.length > 0 ? (
                <ul className="space-y-1 text-xs text-slate-200">
                  {report.strong_areas.map((st, i) => (
                    <li key={i}>• {st}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-slate-500">None yet</span>
              )}
            </div>

            {/* Needs Practice */}
            <div className="p-4 bg-yellow-950/30 border border-yellow-500/30 rounded-2xl print:border-yellow-300">
              <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5 mb-2">
                <span>🟡</span> Needs Practice
              </span>
              {report.needs_practice_areas && report.needs_practice_areas.length > 0 ? (
                <ul className="space-y-1 text-xs text-slate-200">
                  {report.needs_practice_areas.map((st, i) => (
                    <li key={i}>• {st}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-slate-500">None</span>
              )}
            </div>

            {/* Weak */}
            <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl print:border-rose-300">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-2">
                <XCircle className="w-4 h-4" /> Weak Areas (🔴)
              </span>
              {report.weak_areas && report.weak_areas.length > 0 ? (
                <ul className="space-y-1 text-xs text-slate-200">
                  {report.weak_areas.map((st, i) => (
                    <li key={i}>• {st}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-slate-500">None (All Passed!)</span>
              )}
            </div>
          </div>

          {/* Progress Curve Chart */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl print:hidden">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Mastery Growth Trend:
            </h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="masteryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mastery"
                    stroke="#818cf8"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#masteryGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommended Next Activity */}
          {report.recommended_next && (
            <div className="p-5 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/70 border border-indigo-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Recommended Next Action:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed max-w-xl">
                  {report.recommended_next.reason_text ||
                    'Review weak concepts through Leitner flashcards and take 5 adaptive practice drills.'}
                </p>
              </div>

              <button
                onClick={() => {
                  if (missionId) {
                    navigate(`/game/mission/${missionId}`);
                  } else {
                    navigate(`/topic/${report.topic_id}`);
                  }
                }}
                className="shrink-0 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Execute Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mistakes Review Accordion */}
          {report.answers_review && report.answers_review.length > 0 && (
            <div className="border-t border-slate-800 pt-4">
              <button
                onClick={() => setShowMistakes(!showMistakes)}
                className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                <span>Review Question Breakdown ({report.answers_review.length} Questions)</span>
                {showMistakes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showMistakes && (
                <div className="space-y-3 mt-3">
                  {report.answers_review.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border text-xs space-y-2 ${
                        item.is_correct
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-rose-950/20 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-300">Q{idx + 1}. {item.stem}</span>
                        {item.is_correct ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Incorrect
                          </span>
                        )}
                      </div>

                      {!item.is_correct && (
                        <div className="space-y-1 text-[11px]">
                          <p className="text-rose-300">Your Answer: {item.chosen_option}</p>
                          <p className="text-emerald-300 font-semibold">Correct Answer: {item.correct_option}</p>
                        </div>
                      )}

                      <p className="text-slate-400 text-[11px] mt-1 pt-1 border-t border-slate-800/60">
                        {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
