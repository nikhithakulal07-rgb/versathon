import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Play, RotateCcw } from 'lucide-react';

interface ArrayVisualizerProps {
  params?: {
    initialArray?: number[];
    algorithm?: 'linear_search' | 'binary_search' | 'highlight';
    targetValue?: number;
    description?: string;
  };
}

export const ArrayVisualizer: React.FC<ArrayVisualizerProps> = ({ params }) => {
  const initialData = params?.initialArray || [4, 12, 19, 25, 33, 48, 62, 75, 89];
  const [array, setArray] = useState<number[]>(initialData);
  const [target, setTarget] = useState<number>(params?.targetValue || 33);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [foundIndex, setFoundIndex] = useState<number | null>(null);
  const [leftPointer, setLeftPointer] = useState<number | null>(null);
  const [rightPointer, setRightPointer] = useState<number | null>(null);
  const [midPointer, setMidPointer] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to search');

  const runLinearSearch = async () => {
    if (isSearching) return;
    setIsSearching(true);
    setFoundIndex(null);
    setLeftPointer(null);
    setRightPointer(null);
    setMidPointer(null);

    for (let i = 0; i < array.length; i++) {
      setCurrentIndex(i);
      setStatusMessage(`Checking Index [${i}] with value ${array[i]}...`);
      await new Promise((r) => setTimeout(r, 600));

      if (array[i] === target) {
        setFoundIndex(i);
        setStatusMessage(`🎉 Found ${target} at Index [${i}] in ${i + 1} comparisons!`);
        setIsSearching(false);
        return;
      }
    }

    setCurrentIndex(null);
    setStatusMessage(`❌ Value ${target} not found in array.`);
    setIsSearching(false);
  };

  const runBinarySearch = async () => {
    if (isSearching) return;
    setIsSearching(true);
    setFoundIndex(null);
    setCurrentIndex(null);

    let l = 0;
    let r = array.length - 1;
    let step = 1;

    while (l <= r) {
      const mid = Math.floor((l + r) / 2);
      setLeftPointer(l);
      setRightPointer(r);
      setMidPointer(mid);
      setStatusMessage(`Step ${step}: Left=[${l}], Right=[${r}], Mid=[${mid}] (Value=${array[mid]})`);
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (array[mid] === target) {
        setFoundIndex(mid);
        setStatusMessage(`🎯 Found ${target} at Index [${mid}] in ${step} steps!`);
        setIsSearching(false);
        return;
      } else if (array[mid] < target) {
        setStatusMessage(`${array[mid]} < ${target}: Target is in right half (L = mid + 1)`);
        l = mid + 1;
      } else {
        setStatusMessage(`${array[mid]} > ${target}: Target is in left half (R = mid - 1)`);
        r = mid - 1;
      }
      step++;
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    setStatusMessage(`❌ Target ${target} not found in array.`);
    setIsSearching(false);
  };

  const reset = () => {
    setCurrentIndex(null);
    setFoundIndex(null);
    setLeftPointer(null);
    setRightPointer(null);
    setMidPointer(null);
    setIsSearching(false);
    setStatusMessage('Ready');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-6 text-white shadow-xl max-w-3xl mx-auto backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
            📊 Interactive Array & Algorithm Visualizer
          </h3>
          <p className="text-xs text-slate-400">
            {params?.description || 'Visualize contiguous memory indexing and pointer movements'}
          </p>
        </div>
        <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
          Length: {array.length}
        </span>
      </div>

      {/* Array Blocks */}
      <div className="my-6 overflow-x-auto pb-4">
        <div className="flex items-center justify-center gap-2 min-w-max px-2">
          {array.map((val, idx) => {
            const isCurrent = currentIndex === idx;
            const isFound = foundIndex === idx;
            const isMid = midPointer === idx;
            const isLeft = leftPointer === idx;
            const isRight = rightPointer === idx;

            let bgColor = 'bg-slate-800 border-slate-700 text-slate-200';
            if (isFound) {
              bgColor = 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/50 scale-105';
            } else if (isCurrent || isMid) {
              bgColor = 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-500/50 scale-105';
            } else if (leftPointer !== null && rightPointer !== null) {
              if (idx < leftPointer || idx > rightPointer) {
                bgColor = 'bg-slate-900/40 border-slate-800 text-slate-600 opacity-40';
              }
            }

            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                {/* Pointer Tag Above */}
                <div className="h-5 text-[10px] font-mono font-bold flex items-center justify-center">
                  {isLeft && <span className="text-blue-400">L</span>}
                  {isMid && <span className="text-purple-400 mx-0.5">MID</span>}
                  {isRight && <span className="text-pink-400">R</span>}
                  {isCurrent && <span className="text-yellow-400">i</span>}
                </div>

                {/* Box */}
                <motion.div
                  animate={{
                    scale: isCurrent || isMid || isFound ? 1.08 : 1,
                    y: isCurrent || isMid ? -4 : 0,
                  }}
                  className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-lg font-bold font-mono shadow-md transition-colors ${bgColor}`}
                >
                  {val}
                </motion.div>

                {/* Index Tag Below */}
                <span className="text-[11px] font-mono text-slate-500">[{idx}]</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status banner */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center mb-4">
        <span className="text-xs font-mono text-slate-300">{statusMessage}</span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-300 font-medium">Target Value:</label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-20 px-2 py-1 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runLinearSearch}
            disabled={isSearching}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow disabled:opacity-40 transition-all"
          >
            <Play className="w-3.5 h-3.5" /> Linear Search O(N)
          </button>
          <button
            onClick={runBinarySearch}
            disabled={isSearching}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow disabled:opacity-40 transition-all"
          >
            <Search className="w-3.5 h-3.5" /> Binary Search O(log N)
          </button>
          <button
            onClick={reset}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
