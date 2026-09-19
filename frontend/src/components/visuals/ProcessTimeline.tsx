import React from 'react';
import { Clock } from 'lucide-react';

interface TimelineEvent {
  title: string;
  desc: string;
  tag?: string;
}

interface ProcessTimelineProps {
  params?: {
    events?: TimelineEvent[];
    title?: string;
    description?: string;
  };
}

export const ProcessTimeline: React.FC<ProcessTimelineProps> = ({ params }) => {
  const defaultEvents: TimelineEvent[] = [
    { title: '1. Discovery of Electric Charge', desc: 'Ancient Greeks & Gilbert observe static charge behavior.', tag: '1600s' },
    { title: '2. Continuous Current (Volta)', desc: 'Alessandro Volta invents the first chemical battery (Voltaic pile).', tag: '1800' },
    { title: "3. Ohm's Law Published", desc: 'Georg Simon Ohm mathematically defines V = I × R relationship.', tag: '1827' },
    { title: '4. Modern Electronics', desc: 'Semiconductors and integrated circuits harness controlled resistance.', tag: 'Present' },
  ];

  const events = params?.events || defaultEvents;

  return (
    <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-6 text-white shadow-xl max-w-2xl mx-auto backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            {params?.title || 'Concept Evolution & Process Timeline'}
          </h3>
          <p className="text-xs text-slate-400">
            {params?.description || 'Milestones and procedural sequence'}
          </p>
        </div>
      </div>

      <div className="relative border-l-2 border-indigo-500/40 ml-4 my-6 space-y-6">
        {events.map((ev, i) => (
          <div key={i} className="relative pl-6">
            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-2 border-slate-900 shadow-md" />
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-200">{ev.title}</h4>
                {ev.tag && (
                  <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                    {ev.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ev.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
