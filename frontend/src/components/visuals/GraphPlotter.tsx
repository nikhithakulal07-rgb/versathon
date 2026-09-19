import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface GraphPlotterProps {
  params?: {
    a?: number;
    b?: number;
    c?: number;
    title?: string;
    description?: string;
  };
}

export const GraphPlotter: React.FC<GraphPlotterProps> = ({ params }) => {
  const [a, setA] = useState<number>(params?.a ?? 1);
  const [b, setB] = useState<number>(params?.b ?? -4);
  const [c, setC] = useState<number>(params?.c ?? 3);

  // Quadratic calculation
  // Vertex: (-b / (2a), f(-b / 2a))
  const vertexX = a !== 0 ? -b / (2 * a) : 0;
  const vertexY = a * vertexX * vertexX + b * vertexX + c;

  // Discriminant D = b^2 - 4ac
  const D = b * b - 4 * a * c;
  let roots: number[] = [];
  if (a !== 0) {
    if (D > 0) {
      roots = [(-b + Math.sqrt(D)) / (2 * a), (-b - Math.sqrt(D)) / (2 * a)];
    } else if (D === 0) {
      roots = [-b / (2 * a)];
    }
  }

  // SVG Coordinates mapping (-10 to 10 in x and y)
  const width = 460;
  const height = 300;
  const scaleX = width / 20; // 20 units (-10 to 10)
  const scaleY = height / 20;

  const toSvgX = (x: number) => (x + 10) * scaleX;
  const toSvgY = (y: number) => height - (y + 10) * scaleY;

  // Generate curve path
  const points: string[] = [];
  for (let x = -10; x <= 10; x += 0.25) {
    const y = a * x * x + b * x + c;
    if (y >= -15 && y <= 15) {
      points.push(`${toSvgX(x)},${toSvgY(y)}`);
    }
  }
  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';

  return (
    <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-6 text-white shadow-xl max-w-2xl mx-auto backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
            📈 Quadratic Parabola Plotter
          </h3>
          <p className="text-xs text-slate-400">
            {params?.description || 'Interactive parabola visualization showing roots and vertex'}
          </p>
        </div>
        <div className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 font-mono text-xs">
          y = {a !== 1 ? a : ''}x² {b >= 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`} {c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`}
        </div>
      </div>

      {/* Coordinate Canvas */}
      <div className="flex justify-center my-4 bg-slate-950/80 rounded-xl border border-slate-800 p-2 overflow-hidden">
        <svg width={width} height={height} className="overflow-visible">
          {/* Grid lines */}
          {[-8, -6, -4, -2, 2, 4, 6, 8].map((n) => (
            <g key={n} opacity="0.15">
              <line x1={toSvgX(n)} y1={0} x2={toSvgX(n)} y2={height} stroke="#cbd5e1" strokeDasharray="3,3" />
              <line x1={0} y1={toSvgY(n)} x2={width} y2={toSvgY(n)} stroke="#cbd5e1" strokeDasharray="3,3" />
            </g>
          ))}

          {/* X & Y Axes */}
          <line x1={0} y1={toSvgY(0)} x2={width} y2={toSvgY(0)} stroke="#64748b" strokeWidth="2" />
          <line x1={toSvgX(0)} y1={0} x2={toSvgX(0)} y2={height} stroke="#64748b" strokeWidth="2" />

          {/* Parabola Curve */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="3"
              strokeLinecap="round"
              className="transition-all duration-200"
            />
          )}

          {/* Roots points */}
          {roots.map((r, i) => (
            <g key={i}>
              <circle cx={toSvgX(r)} cy={toSvgY(0)} r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              <text x={toSvgX(r) + 8} y={toSvgY(0) - 8} fill="#34d399" fontSize="11" fontWeight="bold">
                Root: x={r.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Vertex point */}
          {a !== 0 && (
            <g>
              <circle cx={toSvgX(vertexX)} cy={toSvgY(vertexY)} r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
              <text x={toSvgX(vertexX) + 8} y={toSvgY(vertexY) + 14} fill="#fbbf24" fontSize="11" fontWeight="bold">
                Vertex ({vertexX.toFixed(1)}, {vertexY.toFixed(1)})
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Interactive Sliders */}
      <div className="grid grid-cols-3 gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
        <div>
          <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
            <span>a (curvature):</span>
            <strong className="text-blue-400">{a}</strong>
          </div>
          <input
            type="range"
            min="-3"
            max="3"
            step="0.5"
            value={a}
            onChange={(e) => setA(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
            <span>b (shift):</span>
            <strong className="text-purple-400">{b}</strong>
          </div>
          <input
            type="range"
            min="-8"
            max="8"
            step="1"
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
            <span>c (y-intercept):</span>
            <strong className="text-emerald-400">{c}</strong>
          </div>
          <input
            type="range"
            min="-8"
            max="8"
            step="1"
            value={c}
            onChange={(e) => setC(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Insights */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <div>
          Discriminant <strong className="text-yellow-400 font-mono">D = {D}</strong>
          {D > 0 ? ' (2 Real Roots)' : D === 0 ? ' (1 Repeated Root)' : ' (No Real Roots)'}
        </div>
        <button
          onClick={() => { setA(1); setB(-4); setC(3); }}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>
    </div>
  );
};
