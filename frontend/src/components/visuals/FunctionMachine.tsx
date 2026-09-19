import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ArrowRight } from 'lucide-react';

interface FunctionMachineProps {
  params?: {
    functionName?: string;
    formula?: string;
    defaultInput?: number | string;
    sampleInputs?: Array<number | string>;
    description?: string;
  };
}

export const FunctionMachine: React.FC<FunctionMachineProps> = ({ params }) => {
  const functionName = params?.functionName || 'f(x)';
  const formula = params?.formula || '2 * x + 3';
  const sampleInputs = params?.sampleInputs || [2, 5, -1, 10, 0];
  
  const [inputValue, setInputValue] = useState<number | string>(params?.defaultInput ?? 2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputValue, setOutputValue] = useState<number | string | null>(null);
  const [history, setHistory] = useState<Array<{ in: any; out: any }>>([]);

  const computeOutput = (val: any) => {
    try {
      const num = Number(val);
      if (!isNaN(num)) {
        if (formula.includes('2 * x + 3') || formula.includes('2x + 3')) return 2 * num + 3;
        if (formula.includes('x^2') || formula.includes('x * x')) return num * num;
        if (formula.includes('x + 1')) return num + 1;
        if (formula.includes('3 * x')) return 3 * num;
        return 2 * num + 3;
      }
      return `Processed(${val})`;
    } catch {
      return 0;
    }
  };

  const runMachine = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setOutputValue(null);

    setTimeout(() => {
      const out = computeOutput(inputValue);
      setOutputValue(out);
      setIsProcessing(false);
      setHistory(prev => [{ in: inputValue, out }, ...prev.slice(0, 4)]);
    }, 800);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-6 text-white shadow-xl max-w-2xl mx-auto backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
            ⚙️ Function Machine: <span className="font-mono text-emerald-400">{functionName}</span>
          </h3>
          <p className="text-xs text-slate-400">Rule: <span className="font-mono text-yellow-300 font-semibold">{formula}</span></p>
        </div>
        <span className="px-2.5 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          Interactive Tool
        </span>
      </div>

      <div className="relative h-52 flex items-center justify-between px-4 my-4 bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
        {/* Input Chamber */}
        <div className="flex flex-col items-center gap-2 z-10">
          <span className="text-xs font-semibold text-slate-400 tracking-wider">INPUT (x)</span>
          <div className="w-16 h-16 rounded-xl bg-slate-800 border-2 border-indigo-500/50 flex items-center justify-center text-xl font-bold text-white shadow-lg">
            {inputValue}
          </div>
          <div className="flex gap-1">
            {sampleInputs.slice(0, 3).map((v, i) => (
              <button
                key={i}
                onClick={() => setInputValue(v)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 hover:bg-indigo-600 text-slate-200 transition-colors"
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Conveyor Arrow Left */}
        <div className="flex-1 flex justify-center items-center">
          <ArrowRight className="w-6 h-6 text-indigo-400 animate-pulse" />
        </div>

        {/* Central Machine Unit */}
        <motion.div
          animate={isProcessing ? { scale: [1, 1.05, 0.98, 1], rotate: [0, 2, -2, 0] } : {}}
          transition={{ duration: 0.8, repeat: isProcessing ? Infinity : 0 }}
          className={`relative w-44 h-36 rounded-2xl flex flex-col items-center justify-center p-3 shadow-2xl transition-all ${
            isProcessing
              ? 'bg-gradient-to-br from-indigo-600 to-purple-700 border-2 border-indigo-300 shadow-indigo-500/50'
              : 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600'
          }`}
        >
          <motion.div
            animate={{ rotate: isProcessing ? 360 : 0 }}
            transition={{ duration: 1, repeat: isProcessing ? Infinity : 0, ease: 'linear' }}
            className="text-3xl mb-1"
          >
            ⚙️
          </motion.div>
          <span className="text-xs font-mono font-bold text-slate-200">{functionName}</span>
          <span className="text-[11px] font-mono text-emerald-300 font-semibold mt-0.5">{formula}</span>

          {isProcessing && (
            <span className="absolute bottom-2 text-[10px] font-semibold text-yellow-300 animate-bounce">
              Transforming...
            </span>
          )}
        </motion.div>

        {/* Conveyor Arrow Right */}
        <div className="flex-1 flex justify-center items-center">
          <ArrowRight className="w-6 h-6 text-purple-400 animate-pulse" />
        </div>

        {/* Output Chamber */}
        <div className="flex flex-col items-center gap-2 z-10">
          <span className="text-xs font-semibold text-slate-400 tracking-wider">OUTPUT f(x)</span>
          <div className="w-16 h-16 rounded-xl bg-slate-800 border-2 border-purple-500/50 flex items-center justify-center text-xl font-bold text-emerald-400 shadow-lg">
            <AnimatePresence mode="wait">
              {outputValue !== null ? (
                <motion.span
                  key={String(outputValue)}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="font-bold text-emerald-400"
                >
                  {outputValue}
                </motion.span>
              ) : (
                <span className="text-slate-600">?</span>
              )}
            </AnimatePresence>
          </div>
          <span className="text-[10px] text-slate-400">Result</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-300 font-medium">Input Value:</label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-20 px-2 py-1 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runMachine}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-lg shadow-lg disabled:opacity-50 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Run Function
          </button>
          <button
            onClick={() => { setInputValue(2); setOutputValue(null); setHistory([]); }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Evaluation Log:</span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {history.map((h, i) => (
              <span key={i} className="px-2 py-0.5 bg-slate-800/80 border border-slate-700/60 rounded text-[11px] font-mono text-slate-300">
                f({h.in}) = <strong className="text-emerald-400">{h.out}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
