import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  Coins,
  Star,
  Sparkles,
  ShoppingBag,
  Shield,
  Award,
  ArrowRight,
  CheckCircle2,
  Lock,
  Compass,
} from 'lucide-react';
import { api, GameMission, QuestItem } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';

export const GameHomePage: React.FC = () => {
  const { user } = useAuth();
  const { playSound } = useSound();
  const navigate = useNavigate();

  const [gameProfile, setGameProfile] = useState<any>(null);
  const [missions, setMissions] = useState<GameMission[]>([]);
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getGameProfile().catch(() => null),
      api.getMissions().catch(() => []),
      api.getQuests().catch(() => []),
    ]).then(([prof, missList, qList]) => {
      if (prof) setGameProfile(prof);
      setMissions(missList);
      setQuests(qList);
      setLoading(false);
    });
  }, []);

  const regions = [
    {
      id: 'r1',
      name: 'Floating Isles of Ohm',
      topic: 'Electricity & Circuits',
      missionCode: 'mission_ohm_10',
      x: '20%',
      y: '30%',
      color: '#3b82f6',
      icon: '⚡',
    },
    {
      id: 'r2',
      name: 'Matrix Highlands',
      topic: 'Quadratic Equations',
      missionCode: 'mission_quad_10',
      x: '65%',
      y: '25%',
      color: '#a855f7',
      icon: '📐',
    },
    {
      id: 'r3',
      name: 'Bio-Nexus Spires',
      topic: 'Cell Biology & Organelles',
      missionCode: 'mission_cell_8',
      x: '35%',
      y: '65%',
      color: '#10b981',
      icon: '🧬',
    },
    {
      id: 'r4',
      name: 'Python Citadel',
      topic: 'Functions & Scope',
      missionCode: 'mission_py_func',
      x: '75%',
      y: '70%',
      color: '#f59e0b',
      icon: '🐍',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Game Mode Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -top-12 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/30 font-bold border-2 border-amber-300">
              🎮
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-xs font-bold rounded-full border border-amber-500/40">
                  Skyforge Academy
                </span>
                <span className="text-xs text-slate-400">Knowledge Expedition Realm</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Guardian Expedition Map
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-lg">
                Complete 5-stage learning missions, defeat Knowledge Guardians, earn gold coins, and unlock cosmetic frames.
              </p>
            </div>
          </div>

          {/* Player Game Currency & Shop Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/80 border border-amber-500/30 rounded-2xl shadow">
              <Coins className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
              <div>
                <span className="block font-black font-mono text-base text-amber-300 leading-tight">
                  {gameProfile?.coins ?? 150}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  Gold Coins
                </span>
              </div>
            </div>

            <Link
              to="/game/shop"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cosmetics Shop</span>
            </Link>
          </div>
        </div>

        {/* Interactive SVG Realm Map */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                Skyforge Realm Map
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any floating knowledge region to launch its 5-stage mission
              </p>
            </div>
            <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              4 Active Regions
            </span>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full h-[380px] sm:h-[440px] bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden my-4">
            <svg className="w-full h-full absolute inset-0">
              {/* Starry Grid Background */}
              <defs>
                <radialGradient id="skyGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0.8" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#skyGlow)" />

              {/* Connecting Knowledge Leylines */}
              <path
                d="M 180 130 Q 380 90 580 120 T 700 290 Q 400 320 280 270 Z"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="6,6"
                className="opacity-40 animate-pulse"
              />
            </svg>

            {/* Region Interactive Pins */}
            {regions.map((reg) => {
              const matchingMission = missions.find(
                (m) => m.code === reg.missionCode || m.name.toLowerCase().includes(reg.topic.toLowerCase().split(' ')[0])
              );
              const missionId = matchingMission?.id || missions[0]?.id || '1';

              return (
                <div
                  key={reg.id}
                  style={{ top: reg.y, left: reg.x }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                  onClick={() => {
                    playSound('click');
                    navigate(`/game/mission/${missionId}`);
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className="relative flex flex-col items-center"
                  >
                    {/* Pulsing Aura */}
                    <div
                      className="absolute -inset-2 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: reg.color }}
                    />

                    {/* Pin Sphere */}
                    <div
                      className="w-14 h-14 rounded-2xl border-2 border-white/80 flex items-center justify-center text-2xl shadow-2xl relative z-10"
                      style={{ backgroundColor: '#0f172a' }}
                    >
                      {reg.icon}
                    </div>

                    {/* Region Label Tag */}
                    <div className="mt-2 bg-slate-900/90 border border-slate-700 px-3 py-1 rounded-xl text-center shadow-xl">
                      <span className="block font-bold text-xs text-white group-hover:text-amber-300 transition-colors whitespace-nowrap">
                        {reg.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {reg.topic}
                      </span>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Missions & Quests Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Missions (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Available Missions ({missions.length})
            </h2>

            <div className="space-y-3">
              {missions.map((mission) => (
                <div
                  key={mission.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold rounded">
                        {mission.region}
                      </span>
                      {mission.stars > 0 && (
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: mission.stars }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-white">{mission.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {mission.description}
                    </p>
                  </div>

                  <Link
                    to={`/game/mission/${mission.id}`}
                    className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 text-center"
                  >
                    Enter Expedition →
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Quests Drawer (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Academy Quests
              </h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                Daily / Weekly
              </span>
            </div>

            <div className="space-y-3">
              {quests.map((q) => (
                <div
                  key={q.id}
                  className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-slate-200">{q.title}</span>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      +{q.xp_reward} XP • +{q.coin_reward} 🪙
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (q.current_count / q.target_count) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>
                      {q.current_count} / {q.target_count} Completed
                    </span>
                    {q.is_completed && <span className="text-emerald-400 font-bold">Claimed ✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
