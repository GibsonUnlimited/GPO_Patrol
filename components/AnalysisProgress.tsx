import React from 'react';
import type { ProgressState } from '../types';

interface AnalysisProgressProps {
  progress: ProgressState | null;
  title: string;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ progress, title }) => {
  const progressPercentage = progress && progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  
  return (
    <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h3 className="font-bold text-lg text-cyan-300">{title}</h3>
        {progress && (
          <span className="text-sm font-mono text-gray-400">
            {progress.stage}: {progress.current} / {progress.total}
          </span>
        )}
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Please wait while the process completes. Results will appear below once finished.
      </p>
    </div>
  );
};
