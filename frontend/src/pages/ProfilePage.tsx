import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, GraduationCap, Sparkles, Check, Save, Shield, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [avatar, setAvatar] = useState(user?.display_avatar || '⚡');
  const [preferredMode, setPreferredMode] = useState(user?.preferred_mode || 'school');
  const [schoolName, setSchoolName] = useState(user?.school_name || '');
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(user?.leaderboard_opt_in ?? true);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const avatarsList = ['⚡', '🧠', '🚀', '👑', '🧙‍♂️', '🦉', '🐱', '🛡️', '🧪', '👾'];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      await api.updateProfile({
        display_avatar: avatar,
        preferred_mode: preferredMode as any,
        school_name: schoolName.trim() || null,
        leaderboard_opt_in: leaderboardOptIn,
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-4 border-b border-slate-800 pb-6 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl shadow-lg">
              {avatar}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{user?.username}</h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
              <span className="inline-block mt-2 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                Level {user?.level || 1} Scholar
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Scholar Avatar Icon:
              </label>
              <div className="flex flex-wrap gap-2">
                {avatarsList.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center border transition-all ${
                      avatar === av
                        ? 'bg-indigo-600 border-indigo-400 scale-110 shadow-lg shadow-indigo-500/30'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Default Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Default Preferred Learning Mode:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'school', label: 'School Mode', icon: '🏫' },
                  { id: 'open', label: 'Open Learning', icon: '💬' },
                  { id: 'game', label: 'Game Mode', icon: '🎮' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPreferredMode(m.id as any)}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      preferredMode === m.id
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <span className="text-xl">{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* School / Institution Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                School / Institution Name (Optional for leaderboard filters):
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g., Delhi Public School, IIT Bombay, Stanford"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Leaderboard Opt-in Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-white block">Leaderboard Participation</span>
                <span className="text-[11px] text-slate-400">
                  Show your scholar username and XP rank on the global and school leaderboards.
                </span>
              </div>
              <input
                type="checkbox"
                checked={leaderboardOptIn}
                onChange={(e) => setLeaderboardOptIn(e.target.checked)}
                className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {saved ? (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Profile settings saved!
                </span>
              ) : (
                <span />
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
