import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Sparkles,
  Gamepad2,
  Brain,
  Zap,
  Flame,
  Layers,
  Award,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Shield,
  Star,
  Users,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CircuitDiagram } from '../components/visuals/CircuitDiagram';
import { FunctionMachine } from '../components/visuals/FunctionMachine';
import { MasteryRing } from '../components/common/MasteryRing';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [activeSandboxTab, setActiveSandboxTab] = useState<'circuit' | 'function' | 'question' | 'flashcard'>('circuit');
  
  // Interactive Sandbox state for Question preview
  const [sandboxAnswerIndex, setSandboxAnswerIndex] = useState<number | null>(null);
  const [sandboxAnswered, setSandboxAnswered] = useState(false);
  
  // Interactive Sandbox state for Flashcard preview
  const [sandboxCardFlipped, setSandboxCardFlipped] = useState(false);
  const [sandboxCardSwiped, setSandboxCardSwiped] = useState<string | null>(null);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does LearnQuest adapt question difficulty to my skill level?',
      a: 'LearnQuest implements Item Response Theory (IRT) with an Elo-calibrated theta (ability) model. As you answer questions, the engine adjusts difficulty to keep you in the Zone of Proximal Development (~70% success rate). If you struggle with a concept, it inserts beginner-level remedial visual explanations rather than simply penalizing you.',
    },
    {
      q: 'Can I use LearnQuest in 100% Offline / Demo Mode?',
      a: 'Yes! LearnQuest has a complete Demo Mode out of the box with zero external configuration required. It includes 6 fully populated vertical slices (Class 10 Physics Electricity, Class 10 Math, Class 8 Science, Class 12 Physics, Class 11 Commerce), 6 Open Learning demo packs, and a scripted AI tutor.',
    },
    {
      q: 'How do the Leitner Flashcards and "Revision Required" queue work?',
      a: 'When practicing flashcards, swiping right ("I know this") advances the card to higher Leitner boxes. Swiping left ("I need revision") immediately routes that card to your personal Revision Required queue, where you receive targeted concept re-explanations and mini-practice checks until mastery is achieved.',
    },
    {
      q: 'What makes Game Mode ("Skyforge Academy") different?',
      a: 'Skyforge Academy is an original, non-violent sci-fantasy expedition realm. Any topic from School Mode or Open Learning can be tackled as a 5-stage mission (Scout → Training → Intel → Challenge → Boss Challenge). Completing stages awards gold coins to unlock avatar frames and titles in the Cosmetics Shop.',
    },
    {
      q: 'How are secrets and API keys protected?',
      a: 'LearnQuest enforces strict zero-secret frontend isolation. API keys exist only on the backend in environment variables. The frontend communicates solely through local `/api/...` proxy routes. Even in production, keys are never sent to the client browser.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Ambient Glows */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 -left-32 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="text-center max-w-4xl mx-auto relative z-10">
          {/* Top Pill */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-6 shadow-lg shadow-indigo-500/10 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Next-Gen Adaptive Learning Platform • 100% Deterministic Engine</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6"
          >
            Master any subject with{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Adaptive Intelligence
            </span>{' '}
            that evolves with you.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto font-normal"
          >
            LearnQuest calculates your exact topic mastery in real-time, pinpoints conceptual misconceptions, calibrates test difficulty, and turns spaced revision into an adventure.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-12"
          >
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-500/30 transition-all active:scale-95 text-base"
              >
                <span>Enter Your Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-500/30 transition-all active:scale-95 text-base"
                >
                  <span>Start Learning Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="px-7 py-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-2xl transition-colors text-base shadow-lg"
                >
                  Try Demo Accounts
                </Link>
              </>
            )}
          </motion.div>

          {/* Social Proof & Metrics Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pt-2 border-t border-slate-900"
          >
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>100% Offline Demo Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">⚡</span>
              <span>IRT Theta Calibration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400 font-bold">🛡️</span>
              <span>Zero Client Secrets</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-bold">🏫</span>
              <span>CBSE / ICSE / College Slices</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. INTERACTIVE LIVE SANDBOX / PLAYGROUND PREVIEW WIDGET */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold rounded-full border border-indigo-500/30 inline-flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Live Interactive Sandbox
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Experience LearnQuest Right Now
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg mx-auto">
            Test the live simulations, adaptive questions, and 3D flashcard mechanics directly below.
          </p>
        </div>

        {/* Sandbox Tabs */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 border-b border-slate-800 scrollbar-none">
            {[
              { id: 'circuit' as const, label: '⚡ Live Circuit Simulator', icon: Zap },
              { id: 'question' as const, label: '🎯 Adaptive Question Drill', icon: Brain },
              { id: 'flashcard' as const, label: '📇 3D Leitner Flashcard', icon: Layers },
              { id: 'function' as const, label: '⚙️ Function Machine', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSandboxTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSandboxTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sandbox Content Area */}
          <div className="py-6 min-h-[380px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeSandboxTab === 'circuit' && (
                <motion.div
                  key="circuit"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full"
                >
                  <CircuitDiagram
                    voltage={12}
                    resistance={4}
                    showElectrons={true}
                    showVoltmeter={true}
                    interactive={true}
                    caption="Adjust Voltage (V) and Resistance (R) sliders below to observe real-time Ohm's Law current changes!"
                  />
                </motion.div>
              )}

              {activeSandboxTab === 'function' && (
                <motion.div
                  key="function"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full"
                >
                  <FunctionMachine
                    params={{
                      functionName: 'f(x) = 2x + 3',
                      formula: '2 * x + 3',
                      defaultInput: 5,
                      description: 'Test how inputs pass through pure function machines and return deterministic outputs.',
                    }}
                  />
                </motion.div>
              )}

              {activeSandboxTab === 'question' && (
                <motion.div
                  key="question"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full max-w-2xl bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      ⚡ Adaptive Level 3 (Intermediate)
                    </span>
                    <span className="text-xs font-mono text-slate-400">Physics • Ohm's Law</span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-relaxed">
                    If the potential difference across a resistor is doubled while temperature remains constant, what happens to the electric current flowing through it?
                  </h3>

                  <div className="space-y-2">
                    {[
                      { text: 'Current doubles (I ∝ V according to Ohm\'s Law)', isCorrect: true },
                      { text: 'Current is halved', isCorrect: false },
                      { text: 'Current remains exactly the same', isCorrect: false },
                      { text: 'Current quadruples', isCorrect: false },
                    ].map((opt, idx) => {
                      const isChosen = sandboxAnswerIndex === idx;
                      let btnClass = 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-750';

                      if (sandboxAnswered) {
                        if (opt.isCorrect) {
                          btnClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/40';
                        } else if (isChosen) {
                          btnClass = 'bg-rose-950/80 border-rose-500 text-rose-100';
                        } else {
                          btnClass = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-40';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={sandboxAnswered}
                          onClick={() => {
                            setSandboxAnswerIndex(idx);
                            setSandboxAnswered(true);
                          }}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${btnClass}`}
                        >
                          <span>{opt.text}</span>
                          {sandboxAnswered && opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {sandboxAnswered && isChosen && !opt.isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
                        </button>
                      );
                    })}
                  </div>

                  {sandboxAnswered && (
                    <div className="p-3.5 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-xs text-indigo-200 flex items-center justify-between">
                      <span>
                        {sandboxAnswerIndex === 0
                          ? '🎉 Correct! Your estimated subtopic mastery just stepped up +6.2%.'
                          : '💡 Misconception note: Since V = I * R, if R is constant, I must scale linearly with V.'}
                      </span>
                      <button
                        onClick={() => {
                          setSandboxAnswerIndex(null);
                          setSandboxAnswered(false);
                        }}
                        className="text-xs underline text-indigo-300 hover:text-white"
                      >
                        Reset Drill
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {activeSandboxTab === 'flashcard' && (
                <motion.div
                  key="flashcard"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full max-w-md"
                >
                  <div
                    onClick={() => setSandboxCardFlipped(!sandboxCardFlipped)}
                    className="h-64 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border-2 border-indigo-500/50 rounded-3xl p-6 flex flex-col justify-between cursor-pointer shadow-2xl hover:border-indigo-400 transition-all text-center"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{sandboxCardFlipped ? '💡 ANSWER' : '❓ CONCEPT PROMPT'}</span>
                      <span className="text-amber-400">Click to Flip</span>
                    </div>

                    <div className="my-auto">
                      <h4 className="text-lg font-bold text-white">
                        {sandboxCardFlipped
                          ? 'V = I × R (Voltage = Current × Resistance in Ohms)'
                          : 'What is the mathematical equation for Ohm\'s Law?'}
                      </h4>
                    </div>

                    <div className="text-[10px] text-slate-400">
                      Leitner Box 1 • #electricity
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setSandboxCardSwiped('Queued for Revision Required (Box 1)')}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500 text-rose-300 text-xs font-bold rounded-xl transition-all"
                    >
                      ← Need Revision
                    </button>
                    <button
                      onClick={() => setSandboxCardSwiped('Advanced to Leitner Box 2 (+2 Mastery Nudge)')}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow transition-all"
                    >
                      I Know This →
                    </button>
                  </div>

                  {sandboxCardSwiped && (
                    <p className="text-center text-xs text-amber-300 mt-2 font-mono">
                      {sandboxCardSwiped}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 3. TRADITIONAL ROTE VS. LEARNQUEST ADAPTIVE COMPARISON */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            Why Adaptive Learning Beats Static Textbooks
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Compare traditional static rote memorization against LearnQuest's continuous calibration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traditional */}
          <div className="p-6 bg-slate-900/50 border border-rose-500/20 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base border-b border-slate-800 pb-3">
              <XCircle className="w-5 h-5" />
              <span>Traditional Learning Portal / Textbooks</span>
            </div>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✗</span>
                <span><strong>Fixed Linear Paths:</strong> Every student reads identical chapters regardless of existing strengths or gaps.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✗</span>
                <span><strong>Random Quizzes:</strong> Uncalibrated question sets oscillate between trivially easy and frustratingly hard.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✗</span>
                <span><strong>Forgotten Misconceptions:</strong> Wrong answers are forgotten after tests with no active remediation mechanism.</span>
              </li>
            </ul>
          </div>

          {/* LearnQuest */}
          <div className="p-6 bg-slate-900/90 border border-emerald-500/40 rounded-3xl space-y-4 shadow-xl glow-emerald">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base border-b border-slate-800 pb-3">
              <CheckCircle2 className="w-5 h-5" />
              <span>LearnQuest Adaptive Engine</span>
            </div>
            <ul className="space-y-3 text-xs text-slate-200">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Calibrated Theta Mastery:</strong> Real-time Item Response Theory maps your proficiency in every individual concept.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Zone of Proximal Development:</strong> Question difficulty adapts smoothly ($p \approx 0.70$) with hysteresis stepping.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Active Revision Required Queue:</strong> Weak flashcards and repeated mistakes trigger targeted re-explanations.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. THREE MODES SHOWCASE */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            Three Modes • Unified Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Switch interfaces at will. Your mastery, streaks, and XP stay synchronized across all modes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* School Mode */}
          <div className="bg-slate-900/80 border border-blue-500/30 rounded-3xl p-6 flex flex-col justify-between hover:border-blue-500/60 transition-all shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl mb-4 border border-blue-500/30">
                🏫
              </div>
              <h3 className="text-xl font-bold text-white mb-2">School Mode</h3>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Structured curriculum drill-down (Class 5–12, CBSE/ICSE/State, Streams, Subjects & Chapters) with mastery progress rings.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" /> Complete vertical slices (Electricity, Quadratics, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" /> Real-time chapter & topic mastery tracking
                </li>
              </ul>
            </div>
            <Link
              to="/school"
              className="mt-6 flex items-center justify-between text-xs font-bold text-blue-400 hover:text-blue-300 pt-4 border-t border-slate-800"
            >
              <span>Explore Curriculum</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Open Learning Mode */}
          <div className="bg-slate-900/80 border border-purple-500/30 rounded-3xl p-6 flex flex-col justify-between hover:border-purple-500/60 transition-all shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl mb-4 border border-purple-500/30">
                💬
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Open Learning</h3>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                AI-powered conversational tutor for any subject: Python, Data Structures, Machine Learning, Thermodynamics, and more.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" /> Interactive in-chat diagnostic & quiz cards
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" /> Contextual tutor (Analogy, Make Easier, Test Me)
                </li>
              </ul>
            </div>
            <Link
              to="/open"
              className="mt-6 flex items-center justify-between text-xs font-bold text-purple-400 hover:text-purple-300 pt-4 border-t border-slate-800"
            >
              <span>Start Learning Anything</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Game Mode */}
          <div className="bg-slate-900/80 border border-amber-500/30 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/60 transition-all shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mb-4 border border-amber-500/30">
                🎮
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Skyforge Academy</h3>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Non-violent sci-fantasy expedition with 5-stage missions (Scout → Training → Intel → Challenge → Boss).
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> World map, gold coins, quests & level-ups
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> Cosmetic shop (avatar frames, titles)
                </li>
              </ul>
            </div>
            <Link
              to="/game"
              className="mt-6 flex items-center justify-between text-xs font-bold text-amber-400 hover:text-amber-300 pt-4 border-t border-slate-800"
            >
              <span>Launch Mission Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE FAQ ACCORDION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Everything you need to know about LearnQuest, Demo Mode, and AI integration.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 text-sm font-bold text-white"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-indigo-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-pink-950 border border-indigo-500/40 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl glow-indigo">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Ready to accelerate your concept mastery?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Join thousands of students and engineering scholars conquering complex topics with adaptive AI.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Link
                to="/signup"
                className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-extrabold rounded-2xl shadow-xl transition-all active:scale-95 text-sm"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-2xl text-sm transition-colors"
              >
                Instant Demo Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
