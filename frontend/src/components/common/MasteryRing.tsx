import React from 'react';
import { motion } from 'framer-motion';

interface MasteryRingProps {
  mastery: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
  animate?: boolean;
}

export const MasteryRing: React.FC<MasteryRingProps> = ({
  mastery,
  size = 56,
  strokeWidth = 5,
  showText = true,
  animate = true,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(mastery)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  let strokeColor = '#ef4444'; // Red (< 45)
  let textColor = 'text-red-400';
  let label = 'Weak';

  if (clamped >= 85) {
    strokeColor = '#f59e0b'; // Gold / Mastered
    textColor = 'text-amber-400';
    label = 'Mastered';
  } else if (clamped >= 75) {
    strokeColor = '#10b981'; // Green / Strong
    textColor = 'text-emerald-400';
    label = 'Strong';
  } else if (clamped >= 45) {
    strokeColor = '#eab308'; // Yellow / Needs practice
    textColor = 'text-yellow-400';
    label = 'Practice';
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-800"
          fill="transparent"
        />
        {/* Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: animate ? 1 : 0, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xs font-bold font-mono ${textColor}`}>{clamped}%</span>
        </div>
      )}
    </div>
  );
};
