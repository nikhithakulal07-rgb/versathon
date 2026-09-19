import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame,
  Award,
  Zap,
  GraduationCap,
  Sparkles,
  Gamepad2,
  ArrowRight,
  CheckCircle2,
  Clock,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import {
  api,
  XPStatus,
  Recommendation,
  Topic,
} from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { MasteryRing } from '../components/common/MasteryRing';
import { StatusPill } from '../components/common/StatusPill';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [xpStatus, setXpStatus] = useState<XPStatus | null>(null);
  const [streakData, setStreakData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<any>(null);
  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getXPStatus().catch(() => null),
      api.getStreak().catch(() => null),
      api.getRecommendations().catch(() => []),
      api.getDailyChallenge().catch(() => null),
      api.getTopics().catch(() => []),
    ]).then(([xp, strk, recs, daily, topics]) => {
      if (xp) setXpStatus(xp);
      if (strk) setStreakData(strk);
      setRecommendations(recs || []);
      setDailyChallenge(daily);
      setRecentTopics((topics || []).slice(0, 4));
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Welcome & Scholar Hero Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/30 font-bold">
                {user?.display_avatar || user?.username[0]?.toUpperCase() || '⚡'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">
                    Welcome back, {user?.username}!
                  </h1>
                  <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono rounded-full">
                    Lvl {xpStatus?.level || user?.level || 1}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-indigo-300/90 font-medium mt-0.5">
                  Scholar Title: <strong className="text-white">{xpStatus?.level_title || 'Apprentice Scholar'}</strong>
                </p>
              </div>
            </div>

            {/* Quick Metrics (Streak & XP) */}
            <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
              <div className="flex items-center gap-2.5 px-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Flame className="w-6 h-6 fill-orange-400 text-orange-400 animate-pulse" />
                </div>
                <div>
                  <span className="block text-lg font-black font-mono text-white leading-tight">
                    {streakData?.current_streak ?? user?.current_streak ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Day Streak
                  </span>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-800" />

              <div className="flex items-center gap-2.5 px-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Award className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <span className="block text-lg font-black font-mono text-white leading-tight">
                    {xpStatus?.total_xp ?? user?.total_xp ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Total XP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Level Progress Bar */}
          {xpStatus && (
            <div className="mt-6 pt-6 border-t border-slate-800/80">
              <div className="flex justify-between items-center text-xs font-mono text-slate-300 mb-1.5">
                <span>Progress to Level {xpStatus.level + 1}</span>
                <span className="text-indigo-300 font-bold">{Math.round(xpStatus.progress_pct)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, xpStatus.progress_pct))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Learning Mode Quick Launch Cards */}
        <div>
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            🚀 Choose Your Learning Mode
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* School Mode Card */}
            <Link
              to="/school"
              className="group bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/60 rounded-3xl p-6 transition-all shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                  🏫
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                  School Curriculum
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Navigate Class 5–12 syllabus, chapters, and CBSE/ICSE benchmark topics with mastery ring tracking.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-blue-400">
                <span>Open Syllabus Drill-down</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Open Learning Mode Card */}
            <Link
              to="/open"
              className="group bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/60 rounded-3xl p-6 transition-all shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                  💬
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                  Open Learning Chat
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Ask anything: Python, Data Structures, Machine Learning, Thermodynamics. Features an adaptive conversational tutor.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-purple-400">
                <span>Chat with AI Tutor</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Game Mode Card */}
            <Link
              to="/game"
              className="group bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/60 rounded-3xl p-6 transition-all shadow-xl hover:shadow-amber-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                  🎮
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Skyforge Academy
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Embark on 5-stage missions across the knowledge realm. Earn gold coins, level up, and unlock cosmetic frames.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-amber-400">
                <span>Launch Expeditions</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>

        {/* Personalized Recommendations & Daily Challenge Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recommendations (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Adaptive Next Steps
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Formula-driven recommendations
              </span>
            </div>

            {recommendations.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
                Start a diagnostic or test in any topic to get real-time explainable recommendations!
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold rounded uppercase">
                          {rec.action.replace('_', ' ')}
                        </span>
                        {rec.subtopic_title && (
                          <span className="font-bold text-sm text-white">{rec.subtopic_title}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{rec.reason_text}</p>
                    </div>

                    <Link
                      to={`/topic/${rec.topic_id}`}
                      className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition-colors text-center"
                    >
                      Start Step →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Challenge Widget (4 cols) */}
          <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-full flex items-center gap-1">
                  🎯 Daily Challenge
                </span>
                <span className="text-xs font-mono text-amber-400 font-bold">+60 XP</span>
              </div>
              <h3 className="font-bold text-white text-base mb-1">5-Minute Mastery Sprint</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Target your weak and needs-practice concepts to preserve your streak and maximize retention.
              </p>
            </div>

            <Link
              to={recentTopics[0] ? `/test/${recentTopics[0].id}?type=daily` : '/school'}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-lg shadow-amber-500/20"
            >
              <span>Begin Daily Challenge</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Recent Topics Quick Hub */}
        {recentTopics.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Featured & Seeded Vertical Slices
              </h2>
              <Link to="/school" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentTopics.map((top) => (
                <Link
                  key={top.id}
                  to={`/topic/${top.id}`}
                  className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/60 rounded-2xl p-5 transition-all flex items-center gap-4 group"
                >
                  <MasteryRing mastery={top.overall_mastery || 0} size={50} />
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 truncate">
                      {top.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {top.source === 'seed' ? 'Curriculum Slice' : 'Open Topic'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
