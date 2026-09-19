import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl mx-auto border border-indigo-500/30">
          🧭
        </div>
        <h1 className="text-3xl font-black text-white">404</h1>
        <h2 className="text-lg font-bold text-slate-200">Knowledge Realm Not Found</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The requested page or topic track does not exist in the current curriculum.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg transition-colors mt-2"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
