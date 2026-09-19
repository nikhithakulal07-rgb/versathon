import React from 'react';
import { motion } from 'framer-motion';

interface MasteryBarProps {
  mastery: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const MasteryBar: React.FC<MasteryBarProps> = ({
  mastery,
  label,
  showPercentage = true,
  size = 'md',
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(mastery)));

  let barColor = 'bg-red-500';
  let textColor = 'text-red-400';

  if (clamped >= 85) {
    barColor = 'bg-gradient-to-r from-amber-400 to-yellow-500 shadow-sm shadow-amber-500/50';
    textColor = 'text-amber-400 font-bold';
  } else if (clamped >= 75) {
    barColor = 'bg-emerald-500';
    textColor = 'text-emerald-400';
  } else if (clamped >= 45) {
    barColor = 'bg-yellow-500';
    textColor = 'text-yellow-400';
  }

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3.5' : 'h-2.5';

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-xs mb-1.5">
          {label && <span className="font-medium text-slate-300 truncate mr-2">{label}</span>}
          {showPercentage && <span className={`font-mono text-xs ${textColor}`}>{clamped}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${heightClass}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
    </div>
  );
};
