import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  Cpu,
  Compass,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { api, Board, SchoolClass, Stream } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';

export const OnboardingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { playSound } = useSound();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [learnerType, setLearnerType] = useState<
    'school' | 'university' | 'engineering' | 'general'
  >('school');

  // School specifics
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Preload curriculum lists
    Promise.all([api.getClasses(), api.getBoards(), api.getStreams()])
      .then(([cList, bList, sList]) => {
        setClasses(cList);
        setBoards(bList);
        setStreams(sList);

        // Default to Class 10 and CBSE if available
        const class10 = cList.find((c) => c.grade === 10) || cList[0];
        const cbse = bList.find((b) => b.code === 'CBSE') || bList[0];
        if (class10) setSelectedClassId(class10.id);
        if (cbse) setSelectedBoardId(cbse.id);
        if (sList[0]) setSelectedStreamId(sList[0].id);
      })
      .catch((e) => console.error('Failed to load onboarding curriculum:', e));
  }, []);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const isHighSchool = selectedClass && (selectedClass.grade === 11 || selectedClass.grade === 12);

  const handleSelectType = (type: 'school' | 'university' | 'engineering' | 'general') => {
    setLearnerType(type);
    playSound('click');
    if (type === 'school') {
      setStep(2);
    } else {
      finishOnboarding(type, null, null, null, 'open');
    }
  };

  const handleFinishSchool = () => {
    finishOnboarding(
      'school',
      selectedClassId,
      selectedBoardId,
      isHighSchool ? selectedStreamId : null,
      'school'
    );
  };

  const finishOnboarding = async (
    type: string,
    classId: string | null,
    boardId: string | null,
    streamId: string | null,
    preferredMode: string
  ) => {
    setLoading(true);
    try {
      await api.onboarding({
        learner_type: type,
        class_id: classId,
        board_id: boardId,
        stream_id: streamId,
        preferred_mode: preferredMode,
      });
      playSound('levelUp');
      await refreshUser();
      navigate(preferredMode === 'school' ? '/school' : '/open');
    } catch (err) {
      console.error('Onboarding failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const learnerOptions = [
    {
      id: 'school' as const,
      title: 'School Student',
      subtitle: 'Grades 5–12 (CBSE, ICSE, State Boards)',
      desc: 'Master textbook chapters with curriculum-aligned vertical slices and board exam practice.',
      icon: GraduationCap,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'university' as const,
      title: 'University / College Student',
      subtitle: 'Higher Education & Foundation Courses',
      desc: 'Deep dive into computer science, natural sciences, data structures, and academic topics.',
      icon: BookOpen,
      color: 'from-purple-500 to-pink-600',
    },
    {
      id: 'engineering' as const,
      title: 'Engineering & Tech Student',
      subtitle: 'B.Tech, BE, Polytech & Coding',
      desc: 'Algorithm visualization, operating systems, electronics, and technical interview preparation.',
      icon: Cpu,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'general' as const,
      title: 'General / Lifelong Learner',
      subtitle: 'Curious minds of all ages',
      desc: 'Learn anything anytime with an AI tutor that creates personalized custom study tracks.',
      icon: Compass,
      color: 'from-amber-500 to-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      <div className="max-w-3xl mx-auto w-full relative z-10">
        <div className="text-center mb-8">
          <span className="px-3 py-1 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-full inline-flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Personalized Setup
          </span>
          <h1 className="text-3xl font-black text-white">
            {step === 1 ? 'What best describes your learning goal?' : 'Configure your School Curriculum'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {step === 1
              ? 'We customize the adaptive engine, question difficulty, and recommendations for you.'
              : 'Pick your Class and Board to instantly unlock vertical slice topics.'}
          </p>
        </div>

        {step === 1 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {learnerOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectType(opt.id)}
                  className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/80 rounded-3xl p-6 text-left flex flex-col justify-between transition-all shadow-xl hover:shadow-indigo-500/10 group"
                >
                  <div>
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${opt.color} flex items-center justify-center text-white mb-4 shadow-lg`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">
                      {opt.title}
                    </h3>
                    <p className="text-xs text-indigo-400/90 font-medium mt-0.5">{opt.subtitle}</p>
                    <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{opt.desc}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-slate-300 group-hover:text-indigo-300 pt-3 border-t border-slate-800/80">
                    <span>Select & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
          >
            {/* Class Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                1. Choose Class / Grade:
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {classes.map((cls) => {
                  const isSelected = selectedClassId === cls.id;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        playSound('click');
                      }}
                      className={`py-3 rounded-2xl font-bold font-mono text-sm border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      {cls.grade}th
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Board Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                2. Choose Board:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {boards.map((b) => {
                  const isSelected = selectedBoardId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBoardId(b.id);
                        playSound('click');
                      }}
                      className={`py-3 px-3 rounded-2xl font-bold text-xs border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/40'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      {b.code} ({b.name})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stream Selection (only for 11 and 12) */}
            {isHighSchool && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  3. Choose Stream (Classes 11–12):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {streams.map((s) => {
                    const isSelected = selectedStreamId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStreamId(s.id);
                          playSound('click');
                        }}
                        className={`py-3 px-3 rounded-2xl font-bold text-xs border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/40'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Back
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleFinishSchool}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
              >
                <span>{loading ? 'Setting up...' : 'Enter School Curriculum'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
