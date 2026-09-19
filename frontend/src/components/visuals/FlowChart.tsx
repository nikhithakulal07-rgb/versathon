import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GitCommit, ArrowDown, CheckCircle2 } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  desc?: string;
  type?: 'start' | 'decision' | 'action' | 'end';
}

interface FlowChartProps {
  params?: {
    nodes?: Node[];
    title?: string;
    description?: string;
  };
}

export const FlowChart: React.FC<FlowChartProps> = ({ params }) => {
  const defaultNodes: Node[] = [
    { id: '1', label: '1. Read Problem', desc: 'Identify given variables & what to find', type: 'start' },
    { id: '2', label: '2. Select Formula', desc: 'e.g. V = I × R or Quadratic Formula', type: 'decision' },
    { id: '3', label: '3. Substitute Values', desc: 'Ensure standard SI units', type: 'action' },
    { id: '4', label: '4. Compute & Validate', desc: 'Verify physical reasonableness & sign', type: 'end' },
  ];

  const nodes = params?.nodes || defaultNodes;
  const [activeStep, setActiveStep] = useState<number>(0);

  return (
    <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-6 text-white shadow-xl max-w-2xl mx-auto backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-indigo-400" />
            {params?.title || 'Interactive Logic Flowchart'}
          </h3>
          <p className="text-xs text-slate-400">
            {params?.description || 'Follow step-by-step decision pathway'}
          </p>
        </div>
        <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/30">
          Step {activeStep + 1} of {nodes.length}
        </span>
      </div>

      <div className="flex flex-col items-center gap-3 my-6">
        {nodes.map((node, index) => {
          const isActive = activeStep === index;
          const isPassed = activeStep > index;

          let badgeColor = 'bg-slate-800 border-slate-700 text-slate-400';
          if (isActive) {
            badgeColor = 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/40 scale-105 ring-2 ring-indigo-300';
          } else if (isPassed) {
            badgeColor = 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300';
          }

          return (
            <React.Fragment key={node.id}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveStep(index)}
                className={`w-full max-w-md p-4 rounded-xl border-2 cursor-pointer transition-all ${badgeColor}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm tracking-wide flex items-center gap-2">
                    {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {node.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-mono opacity-80">
                    {node.type || 'step'}
                  </span>
                </div>
                {node.desc && (
                  <p className="text-xs mt-1.5 opacity-90 leading-relaxed font-sans">{node.desc}</p>
                )}
              </motion.div>

              {index < nodes.length - 1 && (
                <ArrowDown className={`w-5 h-5 ${isPassed ? 'text-emerald-400' : 'text-slate-600'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-slate-800">
        <button
          onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
          disabled={activeStep === 0}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg disabled:opacity-40 transition-colors"
        >
          Previous Step
        </button>
        <button
          onClick={() => setActiveStep((prev) => Math.min(nodes.length - 1, prev + 1))}
          disabled={activeStep === nodes.length - 1}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg disabled:opacity-40 transition-colors shadow"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
};
