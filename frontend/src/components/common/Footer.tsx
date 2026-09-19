import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Sparkles, Gamepad2, Shield, Heart, Terminal, Zap, BookOpen, Trophy } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 text-white font-extrabold text-lg tracking-tight group">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                ⚡
              </div>
              <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent text-xl font-black">
                LearnQuest
              </span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Next-generation adaptive learning platform powered by Item Response Theory (IRT) and Gemini AI. Dynamically calculating concept mastery, adapting question difficulty, and turning revision into an adventure.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Systems Operational • Engine Calibrated</span>
              </div>
            </div>
          </div>

          {/* Col 1: Learning Modes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Learning Modes</h4>
            <ul className="space-y-2.5 text-slate-400">
              <li>
                <Link to="/school" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                  <span>School Curriculum</span>
                </Link>
              </li>
              <li>
                <Link to="/open" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Open Learning Chat</span>
                </Link>
              </li>
              <li>
                <Link to="/game" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Skyforge Academy</span>
                </Link>
              </li>
              <li>
                <Link to="/game/shop" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <span>Cosmetics Shop</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Featured Curriculum */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Curriculum Slices</h4>
            <ul className="space-y-2.5 text-slate-400">
              <li>
                <Link to="/topic/topic_electricity_10" className="hover:text-indigo-400 transition-colors">
                  Class 10: Electricity & Circuits
                </Link>
              </li>
              <li>
                <Link to="/topic/topic_quad_10" className="hover:text-indigo-400 transition-colors">
                  Class 10: Quadratic Equations
                </Link>
              </li>
              <li>
                <Link to="/topic/topic_cell_8" className="hover:text-indigo-400 transition-colors">
                  Class 8: Cell Biology
                </Link>
              </li>
              <li>
                <Link to="/topic/topic_electrostatics_12" className="hover:text-indigo-400 transition-colors">
                  Class 12: Electrostatics
                </Link>
              </li>
              <li>
                <Link to="/open" className="hover:text-indigo-400 transition-colors">
                  Python Functions & Algorithms
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Adaptive Tech */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Adaptive Core</h4>
            <ul className="space-y-2.5 text-slate-400">
              <li className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>IRT Theta Calibration</span>
              </li>
              <li className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Leitner Spaced Repetition</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-indigo-400" />
                <span>Streak & XP Engine</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Zero Client-Side Secrets</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 LearnQuest. Built for the E1 Hackathon. Open source MIT.</p>
          <div className="flex items-center gap-6">
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">
              Backend API Docs (/docs)
            </a>
            <Link to="/privacy" className="hover:text-indigo-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-indigo-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
