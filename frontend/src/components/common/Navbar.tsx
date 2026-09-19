import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  Gamepad2,
  Flame,
  Award,
  User,
  LogOut,
  Menu,
  X,
  Volume2,
  VolumeX,
  Trophy,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import { DemoBadge } from './DemoBadge';
import { ThemeToggle } from './ThemeToggle';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { soundEnabled, toggleSound, playSound } = useSound();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    playSound('click');
    await logout();
    navigate('/login');
  };

  const currentPath = location.pathname;

  const modes = [
    { name: 'School', path: '/school', icon: GraduationCap, color: 'text-blue-400' },
    { name: 'Open Learning', path: '/open', icon: Sparkles, color: 'text-purple-400' },
    { name: 'Game Mode', path: '/game', icon: Gamepad2, color: 'text-amber-400' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 text-white font-extrabold text-lg tracking-tight group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                ⚡
              </div>
              <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                LearnQuest
              </span>
            </Link>

            {/* Desktop Mode Switcher */}
            {user && (
              <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = currentPath.startsWith(mode.path);

                  return (
                    <Link
                      key={mode.path}
                      to={mode.path}
                      onClick={() => playSound('click')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : mode.color}`} />
                      <span>{mode.name}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Header actions */}
          <div className="flex items-center gap-3">
            <DemoBadge />

            {user ? (
              <>
                {/* Streak Pill */}
                <div
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold font-mono rounded-full"
                  title={`${user.current_streak} Day Learning Streak`}
                >
                  <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400 animate-pulse" />
                  <span>{user.current_streak}d</span>
                </div>

                {/* XP Pill */}
                <Link
                  to="/progress"
                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold font-mono rounded-full hover:bg-indigo-500/20 transition-colors"
                  title="Total Experience Points"
                >
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{user.total_xp} XP</span>
                </Link>

                {/* Sound Toggle */}
                <button
                  onClick={toggleSound}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors hidden sm:block"
                  title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <ThemeToggle />

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 transition-colors text-white text-xs font-semibold"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs shadow">
                      {user.display_avatar || user.username[0]?.toUpperCase()}
                    </div>
                    <span className="hidden lg:inline-block max-w-[100px] truncate">
                      {user.username}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div
                      onClick={() => setUserDropdownOpen(false)}
                      className="fixed inset-0 z-40"
                    />
                  )}

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs text-slate-200">
                      <div className="px-3 py-2 border-b border-slate-800 mb-1">
                        <p className="font-bold text-white truncate">{user.username}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Level {user.level} Scholar</p>
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" /> Profile & Settings
                      </Link>

                      <Link
                        to="/leaderboard"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                      >
                        <Trophy className="w-4 h-4 text-amber-400" /> Leaderboard
                      </Link>

                      <Link
                        to="/progress"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-indigo-400" /> Progress & Mastery
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-950/60 text-rose-300 transition-colors mt-1 border-t border-slate-800 pt-2"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu hamburger */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-2">
          <div className="text-xs font-semibold text-slate-400 px-2 uppercase tracking-wider mb-1">
            Learning Modes
          </div>
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = currentPath.startsWith(mode.path);
            return (
              <Link
                key={mode.path}
                to={mode.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : mode.color}`} />
                <span>{mode.name}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center px-2">
            <span className="text-xs text-orange-400 font-bold font-mono">
              🔥 Streak: {user.current_streak} days
            </span>
            <span className="text-xs text-indigo-400 font-bold font-mono">
              ⚡ {user.total_xp} XP
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
