import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface Step {
  title: string;
  subtitle?: string;
  content: string;
  icon?: string;
  color?: string;
}

interface StepThroughDiagramProps {
  params?: {
    steps?: Step[];
    title?: string;
    description?: string;
  };
}

export const StepThroughDiagram: React.FC<StepThroughDiagramProps> = ({ params }) => {
  const defaultSteps: Step[] = [
    {
      title: '1. Potential Difference (Voltage)',
      subtitle: 'Energy Per Unit Charge (V)',
      content: 'The battery establishes an electric pressure difference, pushing free electrons along the wire.',
      icon: '🔋',
      color: 'from-amber-500 to-yellow-600',
    },
    {
      title: '2. Current Flow (Amperes)',
      subtitle: 'Charge Passing Per Second (I = Q/t)',
      content: 'Electrons drift continuously through the conductive circuit creating an electric current.',
      icon: '⚡',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: '3. Electrical Resistance (Ohms)',
      subtitle: 'Opposition to Current (R)',
      content: 'Collisions between moving electrons and conductor ions resist current and generate heat energy.',
      icon: '🧱',
      color: 'from-rose-500 to-red-600',
    },
    {
      title: "4. Ohm's Law Synthesis",
      subtitle: 'V = I × R Relationship',
      content: 'Current is directly proportional to voltage and inversely proportional to resistance at constant temperature.',
      icon: '📐',
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  const steps = params?.steps || defaultSteps;
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  const step = steps[currentStep];

  return (
    <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-6 text-white shadow-xl max-w-2xl mx-auto backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
            🧭 {params?.title || 'Interactive Step-by-Step Concept Breakdown'}
          </h3>
          <p className="text-xs text-slate-400">
            {params?.description || 'Follow structured conceptual progression'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentStep(i); setIsPlaying(false); }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentStep ? 'bg-indigo-400 w-6' : 'bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Step Card */}
      <div className="my-6 min-h-[190px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-2xl shadow-lg shrink-0`}>
                {step.icon || '💡'}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">{step.title}</h4>
                  <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                </div>
                {step.subtitle && (
                  <p className="text-xs text-indigo-300 font-medium mt-0.5">{step.subtitle}</p>
                )}
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">{step.content}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isPlaying ? 'Pause' : 'Auto Play'}
          </button>
          <button
            onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }}
            disabled={currentStep === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <button
            onClick={() => { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }}
            disabled={currentStep === steps.length - 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg disabled:opacity-40 transition-colors shadow"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
