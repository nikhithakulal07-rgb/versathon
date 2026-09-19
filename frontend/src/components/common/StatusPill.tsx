import React from 'react';

interface StatusPillProps {
  status?: string;
  mastery?: number;
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, mastery, size = 'md' }) => {
  let computedStatus = status;

  if (!computedStatus && mastery !== undefined) {
    if (mastery >= 85) computedStatus = 'mastered';
    else if (mastery >= 75) computedStatus = 'strong';
    else if (mastery >= 45) computedStatus = 'needs_practice';
    else if (mastery > 0) computedStatus = 'weak';
    else computedStatus = 'unassessed';
  }

  let label = 'Unassessed';
  let emoji = '⚪';
  let colorClass = 'bg-slate-800 text-slate-400 border-slate-700';

  switch (computedStatus) {
    case 'mastered':
      label = 'Mastered';
      emoji = '👑';
      colorClass = 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-bold';
      break;
    case 'strong':
      label = 'Strong';
      emoji = '🟢';
      colorClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      break;
    case 'needs_practice':
    case 'medium':
      label = 'Needs Practice';
      emoji = '🟡';
      colorClass = 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
      break;
    case 'weak':
      label = 'Weak';
      emoji = '🔴';
      colorClass = 'bg-red-500/15 text-red-300 border-red-500/30';
      break;
    default:
      label = 'Unassessed';
      emoji = '⚪';
      colorClass = 'bg-slate-800/80 text-slate-400 border-slate-700';
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${paddingClass} ${colorClass}`}>
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  );
};
