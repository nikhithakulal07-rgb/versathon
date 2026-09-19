import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api, Badge } from '../lib/api';
import { MasteryRing } from '../components/common/MasteryRing';

export const ProgressPage: React.FC = () => {
  const [masteryData, setMasteryData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getUserMastery().catch(() => null),
      api.getProgressHistory().catch(() => []),
      api.getBadges().catch(() => []),
    ]).then(([m, h, b]) => {
      if (m) setMasteryData(m);
      setHistory(h || []);
      setBadges(b || []);
      setLoading(false);
    });
  }, []);

  const dummyWeeklyData = [
    { day: 'Mon', xp: 45, mastery: 62 },
    { day: 'Tue', xp: 80, mastery: 68 },
    { day: 'Wed', xp: 60, mastery: 71 },
    { day: 'Thu', xp: 120, mastery: 76 },
    { day: 'Fri', xp: 95, mastery: 82 },
    { day: 'Sat', xp: 140, mastery: 85 },
    { day: 'Sun', xp: 110, mastery: 88 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Header */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold rounded-full border border-indigo-500/30 inline-block mb-2">
              Learning Analytics
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-indigo-400" />
              Progress & Mastery Tracker
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Continuous item response theory calibration tracking your long-term concept retention.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <MasteryRing
              mastery={masteryData?.overall_mastery || 75}
              size={76}
              strokeWidth={7}
            />
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold block">Overall Mastery</span>
              <span className="text-lg font-black font-mono text-emerald-400">
                {masteryData?.overall_mastery || 75}% Average
              </span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly XP Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Weekly XP Momentum
              </h3>
              <span className="text-xs font-mono text-amber-300">+650 XP this week</span>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dummyWeeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Bar dataKey="xp" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mastery Curve Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Adaptive Mastery Growth Curve
              </h3>
              <span className="text-xs font-mono text-indigo-300">Theta IRT Curve</span>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dummyWeeklyData}>
                  <defs>
                    <linearGradient id="progMastery" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[50, 100]} stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mastery"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#progMastery)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Badges & Achievements Gallery */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Badges & Achievements ({badges.filter((b) => b.is_earned).length} / {badges.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Unlocked by maintaining streaks, clearing revision sets, and mastering topics.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  badge.is_earned
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
                }`}
              >
                <span className="text-3xl shrink-0">{badge.emoji}</span>
                <div>
                  <h4 className="font-bold text-sm text-white">{badge.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{badge.description}</p>
                  {badge.is_earned ? (
                    <span className="inline-block mt-2 text-[10px] font-mono text-emerald-400 font-bold">
                      ✓ Earned
                    </span>
                  ) : (
                    <span className="inline-block mt-2 text-[10px] font-mono text-slate-500">
                      Locked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
