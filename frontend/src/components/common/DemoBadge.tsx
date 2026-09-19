import React, { useState, useEffect } from 'react';
import { Sparkles, Info } from 'lucide-react';
import { api, MetaInfo } from '../../lib/api';

export const DemoBadge: React.FC = () => {
  const [meta, setMeta] = useState<MetaInfo | null>(null);

  useEffect(() => {
    api.getMeta().then(setMeta).catch(() => {});
  }, []);

  if (!meta || !meta.showDemoBadge || !meta.demoMode) {
    return null;
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold tracking-wide shadow-sm"
      title="Running in Demo Mode with rich offline curriculum and scripted tutor. Set AI_API_KEY for custom AI generation."
    >
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <span>Demo Mode</span>
      <Info className="w-3 h-3 text-amber-400/80" />
    </div>
  );
};
