import React, { useEffect, useRef } from 'react';
import type { ProgressState, LogEntry } from '../types';

interface AnalysisProgressProps {
  progress: ProgressState | null;
  title: string;
  logs: LogEntry[];
  compact?: boolean;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ progress, title, logs, compact = false }) => {
  const progressPercentage = progress && progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, progress]);

  const getLogStyle = (type: LogEntry['type']) => {
      switch (type) {
          case 'error': return 'text-red-500 font-bold';
          case 'warning': return 'text-amber-400';
          case 'success': return 'text-green-400 font-medium';
          case 'detail': return 'text-gray-500 pl-4';
          case 'info': 
          default: return 'text-cyan-300';
      }
  };

  if (compact) {
    return (
        <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-lg p-4 animate-fade-in mb-2">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-md text-cyan-300 flex items-center">
                    <span className="animate-pulse mr-2 text-cyan-400">●</span> {title}
                </h3>
                {progress && (
                    <span className="text-xs font-mono text-gray-400">
                        {Math.round(progressPercentage)}% ({progress.current}/{progress.total})
                    </span>
                )}
            </div>
             <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(6,182,212,0.7)]"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>
            <div className="font-mono text-xs text-gray-400 max-h-24 overflow-y-auto custom-scrollbar border-t border-gray-700/50 pt-2">
                 {logs.slice(-5).map((log, index) => (
                    <div key={index} className={`truncate animate-fade-in ${getLogStyle(log.type)}`}>
                        <span className="text-gray-600 mr-2">[{log.timestamp}]</span>
                        {log.message}
                    </div>
                 ))}
                 <div ref={logEndRef} />
            </div>
        </div>
    );
  }

  return (
    <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-6 animate-fade-in flex flex-col h-full min-h-[600px]">
      <div className="mb-6">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <h3 className="font-bold text-xl text-cyan-300">{title}</h3>
            {progress && (
              <span className="text-sm font-mono text-gray-400">
                Processing Batch: {progress.current} / {progress.total}
              </span>
            )}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
            <div
              className="bg-cyan-500 h-3 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(6,182,212,0.7)]"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
      </div>

      {/* Live Terminal Log Area */}
      <div className="flex-grow flex flex-col overflow-hidden rounded-lg border border-gray-700 bg-black/90 shadow-inner">
          <div className="flex items-center px-4 py-2 bg-gray-800/50 border-b border-gray-700">
             <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
             <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
             <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
             <span className="text-xs text-gray-400 uppercase font-mono tracking-wider flex-grow text-center">/bin/gpo-patrol --scan --live</span>
          </div>
          <div className="flex-grow p-4 font-mono text-xs sm:text-sm overflow-y-auto custom-scrollbar">
             <div className="space-y-1">
                <div className="text-gray-500 mb-2">$ initializing scan sequence...</div>
                {logs.map((log, index) => (
                    <div key={index} className={`animate-fade-in ${getLogStyle(log.type)}`}>
                        <span className="text-gray-600 mr-2 select-none">[{log.timestamp}]</span>
                        <span className="break-all whitespace-pre-wrap">{log.message}</span>
                    </div>
                ))}
                 {progress && progress.current < progress.total && (
                    <div className="text-cyan-600/50 animate-pulse mt-2">
                        _ processing next batch...
                    </div>
                )}
                {progress && progress.current === progress.total && (
                    <div className="text-green-400 font-bold mt-4 border-t border-gray-700 pt-2">
                        &gt; Analysis Complete. Generating Final Report...
                    </div>
                )}
                <div ref={logEndRef} />
             </div>
          </div>
      </div>
    </div>
  );
};