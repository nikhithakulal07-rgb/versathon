import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Play, Pause, RefreshCw, BarChart2 } from 'lucide-react';

interface CircuitProps {
  voltage?: number;
  resistance?: number;
  showElectrons?: boolean;
  showVoltmeter?: boolean;
  showVIGraph?: boolean;
  interactive?: boolean;
  mode?: 'series' | 'parallel' | 'single' | 'mixed' | 'bridge';
  caption?: string;
}

export const CircuitDiagram: React.FC<CircuitProps> = ({
  voltage: initialV = 12,
  resistance: initialR = 4,
  showElectrons = true,
  showVoltmeter = true,
  showVIGraph = false,
  interactive = true,
  mode = 'single',
  caption,
}) => {
  const [V, setV] = useState(initialV);
  const [R, setR] = useState(initialR);
  const [isPlaying, setIsPlaying] = useState(true);

  // Ohm's Law calculation
  const I = R > 0 ? Number((V / R).toFixed(2)) : 0;
  const power = Number((V * I).toFixed(2));

  // Animation speed proportional to current
  const animationDuration = I > 0 ? Math.max(0.8, 6.0 / Math.max(0.5, I)) : 0;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 text-sm tracking-wide">Interactive Circuit Simulation</h4>
            <p className="text-xs text-slate-400">Ohm's Law: $V = I \times R$</p>
          </div>
        </div>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-colors"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          {isPlaying ? 'Pause' : 'Simulate'}
        </button>
      </div>

      {/* SVG Circuit Canvas */}
      <div className="relative w-full h-64 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 500 240" className="w-full h-full max-w-lg select-none">
          {/* Circuit Wire Loop */}
          <rect
            x="60"
            y="40"
            width="380"
            height="160"
            rx="16"
            fill="none"
            stroke="#334155"
            strokeWidth="6"
          />

          {/* Active Flow Line with Dynamic Animation */}
          {isPlaying && I > 0 && (
            <motion.rect
              x="60"
              y="40"
              width="380"
              height="160"
              rx="16"
              fill="none"
              stroke="#6366F1"
              strokeWidth="4"
              strokeDasharray="14 14"
              animate={{ strokeDashoffset: [0, -28] }}
              transition={{ repeat: Infinity, duration: animationDuration, ease: "linear" }}
            />
          )}

          {/* Battery (DC Source) on the Left */}
          <g transform="translate(60, 120)">
            {/* Long plate (+) */}
            <line x1="-16" y1="-18" x2="16" y2="-18" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
            {/* Short plate (-) */}
            <line x1="-8" y1="-6" x2="8" y2="-6" stroke="#38BDF8" strokeWidth="6" strokeLinecap="round" />
            <text x="-32" y="-12" fill="#EF4444" fontSize="14" fontWeight="bold">+</text>
            <text x="-32" y="0" fill="#38BDF8" fontSize="16" fontWeight="bold">-</text>
            <text x="26" y="-10" fill="#F8FAFC" fontSize="12" fontWeight="600">{V}V</text>
          </g>

          {/* Resistor on Top Wire */}
          <g transform="translate(250, 40)">
            <rect x="-40" y="-14" width="80" height="28" rx="6" fill="#1E293B" stroke="#F59E0B" strokeWidth="3" />
            {/* Zigzag pattern */}
            <path d="M-30 0 L-20 -8 L-10 8 L0 -8 L10 8 L20 -8 L30 0" fill="none" stroke="#F59E0B" strokeWidth="2.5" />
            <text x="0" y="30" fill="#F59E0B" fontSize="12" fontWeight="600" textAnchor="middle">{R} Ω</text>
          </g>

          {/* Ammeter on Bottom Wire */}
          <g transform="translate(250, 200)">
            <circle cx="0" cy="0" r="18" fill="#1E293B" stroke="#10B981" strokeWidth="3" />
            <text x="0" y="5" fill="#10B981" fontSize="14" fontWeight="bold" textAnchor="middle">A</text>
            <text x="0" y="34" fill="#10B981" fontSize="12" fontWeight="600" textAnchor="middle">{I} A</text>
          </g>

          {/* Voltmeter Connected in Parallel across Resistor */}
          {showVoltmeter && (
            <g transform="translate(250, 0)">
              {/* Connection leads */}
              <line x1="-50" y1="40" x2="-50" y2="15" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="50" y1="40" x2="50" y2="15" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="-50" y1="15" x2="-20" y2="15" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="20" y1="15" x2="50" y2="15" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 3" />
              <circle cx="0" cy="15" r="16" fill="#0F172A" stroke="#818CF8" strokeWidth="2.5" />
              <text x="0" y="20" fill="#818CF8" fontSize="12" fontWeight="bold" textAnchor="middle">V</text>
            </g>
          )}

          {/* Animated Electron particles */}
          {isPlaying && showElectrons && I > 0 && (
            <>
              <motion.circle
                cx="100" cy="40" r="4" fill="#38BDF8"
                animate={{ cx: [430, 440, 440, 60, 60, 100], cy: [40, 50, 190, 200, 50, 40] }}
                transition={{ repeat: Infinity, duration: animationDuration * 1.5, ease: "linear" }}
              />
              <motion.circle
                cx="350" cy="200" r="4" fill="#38BDF8"
                animate={{ cx: [350, 60, 60, 440, 440, 350], cy: [200, 200, 40, 40, 200, 200] }}
                transition={{ repeat: Infinity, duration: animationDuration * 1.5, ease: "linear" }}
              />
            </>
          )}
        </svg>

        {/* Live Readout Pill Overlay */}
        <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-lg text-xs space-y-1 backdrop-blur-sm">
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Current (I):</span>
            <span className="font-mono font-bold text-emerald-400">{I} A</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Power (P=VI):</span>
            <span className="font-mono font-bold text-amber-400">{power} W</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      {interactive && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800">
          {/* Voltage Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">Voltage ($V$):</span>
              <span className="font-mono text-indigo-400 font-bold">{V} Volts</span>
            </div>
            <input
              type="range"
              min="1"
              max="36"
              step="1"
              value={V}
              onChange={e => setV(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Resistance Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">Resistance ($R$):</span>
              <span className="font-mono text-amber-400 font-bold">{R} Ohms (Ω)</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={R}
              onChange={e => setR(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      )}

      {caption && (
        <p className="text-xs text-slate-400 mt-3 italic text-center border-t border-slate-800/60 pt-2">
          {caption}
        </p>
      )}
    </div>
  );
};
