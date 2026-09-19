import React, { useState } from 'react';
import { Columns2 } from 'lucide-react';

interface BeforeAfterCompareProps {
  params?: {
    beforeTitle?: string;
    beforeDesc?: string;
    beforePoints?: string[];
    afterTitle?: string;
    afterDesc?: string;
    afterPoints?: string[];
    title?: string;
    description?: string;
  };
}

export const BeforeAfterCompare: React.FC<BeforeAfterCompareProps> = ({ params }) => {
  const [activeTab, setActiveTab] = useState<'both' | 'before' | 'after'>('both');

  const beforeTitle = params?.beforeTitle || 'Series Circuit';
  const beforeDesc = params?.beforeDesc || 'Single path for electrons. If one component breaks, the whole circuit stops.';
  const beforePoints = params?.beforePoints || [
    'Current (I) is identical everywhere',
    'Total R = R1 + R2 + R3',
    'Voltages add up: V_total = V1 + V2',
  ];

  const afterTitle = params?.afterTitle || 'Parallel Circuit';
  const afterDesc = params?.afterDesc || 'Multiple independent branches. If one branch fails, other branches continue working.';
  const afterPoints = params?.afterPoints || [
    'Voltage (V) is identical across branches',
    'Total 1/R = 1/R1 + 1/R2',
    'Currents add up: I_total = I1 + I2',
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-6 text-white shadow-xl max-w-2xl mx-auto backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
            <Columns2 className="w-5 h-5 text-indigo-400" />
            {params?.title || 'Side-by-Side Conceptual Comparison'}
          </h3>
          <p className="text-xs text-slate-400">
            {params?.description || 'Compare key structural and behavioral differences'}
          </p>
        </div>
        <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(['both', 'before', 'after'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-0.5 rounded text-xs font-semibold capitalize transition-colors ${
                activeTab === tab ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        {/* Before / Left Card */}
        {(activeTab === 'both' || activeTab === 'before') && (
          <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <h4 className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                  ⚡ {beforeTitle}
                </h4>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                  Configuration A
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-3">{beforeDesc}</p>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {beforePoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* After / Right Card */}
        {(activeTab === 'both' || activeTab === 'after') && (
          <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                  🔄 {afterTitle}
                </h4>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Configuration B
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-3">{afterDesc}</p>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {afterPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
