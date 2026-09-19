import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, RotateCcw, Layers } from 'lucide-react';

interface Frame {
  id: string;
  name: string;
  args: string;
  line: number;
  color: string;
}

interface CallStackProps {
  params?: {
    initialFrames?: Array<{ name: string; args: string; line: number }>;
    description?: string;
  };
}

const FRAME_COLORS = [
  'from-blue-600 to-indigo-700 border-blue-400',
  'from-purple-600 to-pink-700 border-purple-400',
  'from-emerald-600 to-teal-700 border-emerald-400',
  'from-amber-600 to-orange-700 border-amber-400',
  'from-rose-600 to-red-700 border-rose-400',
];

export const CallStack: React.FC<CallStackProps> = ({ params }) => {
  const [frames, setFrames] = useState<Frame[]>([
    { id: '1', name: 'main()', args: '', line: 1, color: FRAME_COLORS[0] },
    { id: '2', name: 'calculate_total()', args: 'items=[10, 20]', line: 8, color: FRAME_COLORS[1] },
  ]);

  const [newFuncName, setNewFuncName] = useState('apply_discount');
  const [newFuncArgs, setNewFuncArgs] = useState('price=30, rate=0.1');

  const pushFrame = () => {
    if (frames.length >= 6) return;
    const newFrame: Frame = {
      id: Date.now().toString(),
      name: `${newFuncName}()`,
      args: newFuncArgs,
      line: Math.floor(Math.random() * 20) + 1,
      color: FRAME_COLORS[frames.length % FRAME_COLORS.length],
    };
    setFrames([newFrame, ...frames]);
  };

  const popFrame = () => {
    if (frames.length <= 1) return;
    setFrames(frames.slice(1));
  };

  const resetStack = () => {
    setFrames([
      { id: '1', name: 'main()', args: '', line: 1, color: FRAME_COLORS[0] },
      { id: '2', name: 'calculate_total()', args: 'items=[10, 20]', line: 8, color: FRAME_COLORS[1] },
    ]);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-6 text-white shadow-xl max-w-2xl mx-auto backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Execution Call Stack (LIFO: Last-In, First-Out)
          </h3>
          <p className="text-xs text-slate-400">
            {params?.description || 'Active stack frames in memory during recursive or nested function calls'}
          </p>
        </div>
        <span className="px-2.5 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
          Depth: {frames.length} / 6
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-4">
        {/* Visual Stack Chamber */}
        <div className="md:col-span-7 bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-end min-h-[260px] relative overflow-hidden">
          <div className="absolute top-3 right-3 text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <span>TOP (Current Scope)</span>
            <span className="animate-pulse text-indigo-400">▼</span>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <AnimatePresence initial={false}>
              {frames.map((frame, index) => (
                <motion.div
                  key={frame.id}
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className={`p-3 rounded-xl border bg-gradient-to-r ${frame.color} shadow-lg relative flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-black/40 text-[10px] font-mono flex items-center justify-center font-bold">
                      {frames.length - index}
                    </span>
                    <div>
                      <span className="font-mono font-bold text-sm text-white">{frame.name}</span>
                      {frame.args && (
                        <p className="text-[11px] font-mono text-slate-200/90">{frame.args}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono bg-black/30 px-2 py-0.5 rounded text-yellow-300">
                      Line {frame.line}
                    </span>
                    {index === 0 && (
                      <span className="block text-[9px] uppercase tracking-wider text-emerald-300 font-bold mt-0.5">
                        ▶ ACTIVE
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="border-t border-slate-800 mt-2 pt-2 text-center text-[10px] text-slate-500 uppercase tracking-widest font-mono">
            Stack Base (Memory Start)
          </div>
        </div>

        {/* Controls Column */}
        <div className="md:col-span-5 flex flex-col justify-between gap-4">
          <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Push New Frame:</h4>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Function Name:</label>
              <input
                type="text"
                value={newFuncName}
                onChange={(e) => setNewFuncName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Arguments / Locals:</label>
              <input
                type="text"
                value={newFuncArgs}
                onChange={(e) => setNewFuncArgs(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={pushFrame}
                disabled={frames.length >= 6}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-lg disabled:opacity-40 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Push Frame
              </button>
              <button
                onClick={popFrame}
                disabled={frames.length <= 1}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600/80 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-lg disabled:opacity-40 transition-all active:scale-95"
              >
                <Minus className="w-4 h-4" /> Pop Frame
              </button>
            </div>
            <button
              onClick={resetStack}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Default Stack
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
