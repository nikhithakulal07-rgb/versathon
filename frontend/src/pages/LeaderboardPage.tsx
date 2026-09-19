import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  UserPlus,
  Users,
  Building2,
  GraduationCap,
  Globe,
  Award,
  Crown,
  Sparkles,
  Check,
} from 'lucide-react';
import { api, LeaderboardUser } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const { playSound } = useSound();

  const [scope, setScope] = useState<'global' | 'school' | 'class' | 'friends'>('global');
  const [period, setPeriod] = useState<'week' | 'all'>('week');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [friendUsername, setFriendUsername] = useState('');
  const [friendNotice, setFriendNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getLeaderboard(scope, period)
      .then((data) => setLeaderboard(data))
      .catch((e) => console.error('Failed to load leaderboard:', e))
      .finally(() => setLoading(false));
  }, [scope, period]);

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendUsername.trim()) return;

    try {
      const res = await api.sendFriendRequest(friendUsername.trim());
      setFriendNotice(res.message);
      setFriendUsername('');
      playSound('correct');
    } catch (err: any) {
      setFriendNotice(err.message || 'Could not send friend request');
      playSound('wrong');
    }
  };

  const scopeTabs = [
    { id: 'global' as const, label: 'Global', icon: Globe },
    { id: 'class' as const, label: 'My Class', icon: GraduationCap },
    { id: 'school' as const, label: 'My School', icon: Building2 },
    { id: 'friends' as const, label: 'Friends', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/30 font-bold text-slate-950">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-mono text-xs font-bold rounded-full border border-amber-500/40">
                  Hall of Scholars
                </span>
                <span className="text-xs text-slate-400">XP Rankings & Peer Motivation</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Leaderboards</h1>
              <p className="text-xs text-slate-300 mt-1">
                Privacy-first: only usernames and scholar avatars are shown.
              </p>
            </div>
          </div>

          {/* Timeframe Filter */}
          <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                period === 'week' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                period === 'all' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Scope Tabs & Add Friend Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {scopeTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = scope === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setScope(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Friend Request Form */}
          <form onSubmit={handleSendFriendRequest} className="flex items-center gap-2">
            <input
              type="text"
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              placeholder="Add friend by username..."
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add
            </button>
          </form>
        </div>

        {friendNotice && (
          <div className="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-xs text-indigo-300 flex items-center justify-between">
            <span>{friendNotice}</span>
            <button onClick={() => setFriendNotice(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Leaderboard Table Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading scholar rankings...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No entries found for this category yet. Complete tests and lessons to lead the rankings!
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {leaderboard.map((u, idx) => {
                const isTop3 = u.rank <= 3;
                const medalEmojis = ['🥇', '🥈', '🥉'];

                return (
                  <div
                    key={idx}
                    className={`py-4 px-4 rounded-2xl flex items-center justify-between gap-4 transition-colors ${
                      u.is_current_user
                        ? 'bg-indigo-950/50 border border-indigo-500/60 shadow-md'
                        : 'hover:bg-slate-850/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Indicator */}
                      <span className="w-8 text-center font-black font-mono text-sm">
                        {isTop3 ? (
                          <span className="text-xl">{medalEmojis[u.rank - 1]}</span>
                        ) : (
                          <span className="text-slate-400">#{u.rank}</span>
                        )}
                      </span>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-sm shadow">
                        {u.display_avatar || u.username[0]?.toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{u.username}</span>
                          {u.is_current_user && (
                            <span className="text-[10px] font-bold font-mono bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                              YOU
                            </span>
                          )}
                        </div>
                        {u.school_name && (
                          <span className="text-[11px] text-slate-400 block">{u.school_name}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="block font-black font-mono text-sm text-amber-300">
                        {u.total_xp} XP
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Level {u.level} Scholar
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
