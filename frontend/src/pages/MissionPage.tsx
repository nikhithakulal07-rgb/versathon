import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Compass,
  BookOpen,
  Layers,
  Zap,
  Crown,
  Star,
  Coins,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { api, GameMission, Topic } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';

export const MissionPage: React.FC = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const { user } = useAuth();
  const { playSound } = useSound();
  const navigate = useNavigate();

  const [mission, setMission] = useState<GameMission | null>(null);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!missionId) return;

    api.getMissions().then((mList) => {
      const found = mList.find((m) => m.id === missionId) || mList[0];
      if (found) {
        setMission(found);
        setCurrentStage(found.current_stage || 1);

        // Fetch first topic to link subtopics
        api.getTopics().then((tList) => {
          if (tList.length > 0) setTopic(tList[0]);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, [missionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading expedition...
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Mission not found.
      </div>
    );
  }

  const stageIcons = ['🧭', '💡', '📇', '⚡', '👑'];
  const stageColors = [
    'from-blue-600 to-indigo-700',
    'from-purple-600 to-pink-700',
    'from-amber-600 to-orange-700',
    'from-rose-600 to-red-700',
    'from-amber-500 via-yellow-400 to-amber-600',
  ];

  const getStageActionUrl = (stgNum: number) => {
    const topId = topic?.id || 'topic_electricity_10';
    const subId = topic?.subtopics?.[0]?.id || 'sub_current';

    switch (stgNum) {
      case 1:
        return `/diagnostic/${topId}?mode=game&mission_id=${mission.id}`;
      case 2:
        return `/lesson/${subId}?mode=game&mission_id=${mission.id}`;
      case 3:
        return `/flashcards/${subId}?mode=game&mission_id=${mission.id}`;
      case 4:
        return `/test/${topId}?type=adaptive&mode=game&mission_id=${mission.id}`;
      case 5:
        return `/test/${topId}?type=boss&mode=game&mission_id=${mission.id}`;
      default:
        return `/diagnostic/${topId}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Mission Briefing Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-mono text-xs font-bold rounded-full border border-amber-500/40">
                  {mission.region}
                </span>
                <span className="text-xs text-slate-400">Mission Code: {mission.code}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{mission.name}</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                {mission.description}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl shrink-0">
              <div className="text-center px-2">
                <span className="block text-xs text-slate-400 uppercase font-bold">Reward</span>
                <span className="text-base font-black font-mono text-amber-400">+120 XP • 50 🪙</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Stage Mission Path */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              Expedition Stages (1–5)
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Current Stage: {currentStage} / 5
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {mission.stages.map((stageItem) => {
              const isUnlocked = stageItem.stage <= currentStage;
              const isCurrent = stageItem.stage === currentStage;
              const isPassed = stageItem.stage < currentStage;

              return (
                <div
                  key={stageItem.stage}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl ${
                    isCurrent
                      ? 'bg-gradient-to-r from-slate-900 to-indigo-950/60 border-amber-500/80 shadow-amber-500/10 ring-2 ring-amber-400/20'
                      : isPassed
                      ? 'bg-slate-900/90 border-emerald-500/40 opacity-90'
                      : 'bg-slate-900/40 border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg ${
                        isUnlocked
                          ? `bg-gradient-to-tr ${stageColors[stageItem.stage - 1]} text-white`
                          : 'bg-slate-800 text-slate-600 border border-slate-700'
                      }`}
                    >
                      {isUnlocked ? stageIcons[stageItem.stage - 1] : <Lock className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded text-amber-400">
                          Stage {stageItem.stage}: {stageItem.type.toUpperCase()}
                        </span>
                        {isPassed && (
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-white mt-1">{stageItem.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{stageItem.desc}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isUnlocked ? (
                      <Link
                        to={getStageActionUrl(stageItem.stage)}
                        onClick={() => playSound('click')}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 ${
                          isCurrent
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <span>{isCurrent ? 'Engage Stage' : 'Replay Stage'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-600 font-mono flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
