
import React, { useEffect, useRef, useState } from 'react';
import type { ProgressState, LogEntry, PerformanceConfig } from '../types';

interface AnalysisProgressProps {
  progress: ProgressState | null;
  title: string;
  logs: LogEntry[];
  compact?: boolean;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ progress, title, logs, compact = false }) => {
  const progressPercentage = progress && progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const logEndRef = useRef<HTMLDivElement>(null);
  const [perfConfig, setPerfConfig] = useState<PerformanceConfig>({ highMemoryMode: false });

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    const configStr = localStorage.getItem('gpo_perf_config');
    if (configStr) {
        setPerfConfig(JSON.parse(configStr));
    }
  }, []);

  const getLogStyle = (type: LogEntry['type']) => {
      switch (type) {
          case 'error': return 'text-red-400 font-bold';
          case 'warning': return 'text-yellow-400';
          case 'success': return 'text-green-400 font-bold';
          case 'detail': return 'text-gray-500 pl-4';
          case 'info': 
          default: return 'text-cyan-400';
      }
  };

  const isTurbo = perfConfig.highMemoryMode;

  if (compact) {
    return (
        <div className={`bg-slate-950 border rounded-xl shadow-2xl p-4 animate-fade-in mb-6 overflow-hidden transition-all duration-1000 ${isTurbo ? 'border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'border-cyan-500/30'}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-cyan-300 flex items-center">
                    <span className="animate-pulse mr-2 text-red-500">●</span> {title}
                    {isTurbo && <span className="ml-3 text-[8px] bg-cyan-500 text-black px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">High Cap Active</span>}
                </h3>
                {progress && (
                    <span className="text-[10px] font-mono text-gray-500">
                        {Math.round(progressPercentage)}% ({progress.current}/{progress.total})
                    </span>
                )}
            </div>
             <div className="w-full bg-gray-800 rounded-full h-1.5 mb-4">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(6,182,212,0.5)] ${isTurbo ? 'bg-cyan-300' : 'bg-cyan-500'}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>
            <div className="font-mono text-[10px] text-gray-400 max-h-32 overflow-y-auto custom-scrollbar bg-black/40 p-3 rounded border border-white/5">
                 {logs.map((log, index) => (
                    <div key={index} className={`truncate mb-1 leading-tight ${getLogStyle(log.type)}`}>
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
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-10 animate-fade-in">
      <div className={`w-full max-w-4xl h-full max-h-[800px] flex flex-col bg-black border rounded-xl transition-all duration-1000 overflow-hidden ${isTurbo ? 'border-cyan-400 shadow-[0_0_60px_rgba(6,182,212,0.3)] scale-[1.01]' : 'border-white/10 shadow-[0_0_50px_rgba(6,182,212,0.1)]'}`}>
        
        {/* Terminal Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b transition-colors duration-1000 ${isTurbo ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-gray-900 border-white/10'}`}>
          <div className="flex space-x-2">
            <div className={`w-3 h-3 rounded-full transition-colors ${isTurbo ? 'bg-red-400' : 'bg-red-500/50'}`}></div>
            <div className={`w-3 h-3 rounded-full transition-colors ${isTurbo ? 'bg-yellow-400' : 'bg-yellow-500/50'}`}></div>
            <div className={`w-3 h-3 rounded-full transition-colors ${isTurbo ? 'bg-cyan-400' : 'bg-green-500/50'}`}></div>
          </div>
          <div className={`text-[10px] font-mono uppercase tracking-widest flex items-center transition-colors ${isTurbo ? 'text-cyan-400 font-bold' : 'text-gray-500'}`}>
             <span className={`animate-pulse mr-2 ${isTurbo ? 'text-cyan-400' : 'text-red-500'}`}>●</span> 
             {isTurbo ? 'System Overclock Active : Maximum Parallel Throughput' : 'Forest Data Stream : Active Forensic Mode'}
          </div>
          <div className="w-12"></div>
        </div>

        {/* Status Bar */}
        <div className={`px-6 py-4 border-b transition-colors duration-1000 ${isTurbo ? 'bg-cyan-900/10 border-cyan-500/20' : 'bg-gray-900/50 border-white/5'}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Current Operation</span>
                    <span className={`font-mono text-sm font-bold uppercase transition-colors ${isTurbo ? 'text-cyan-300' : 'text-cyan-400'}`}>{title}</span>
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Scan Progress</span>
                    <div className={`font-mono text-sm font-bold transition-colors ${isTurbo ? 'text-cyan-300' : 'text-white'}`}>
                        {progress ? `${progress.current} / ${progress.total}` : 'INITIALIZING'}
                    </div>
                </div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-in-out ${isTurbo ? 'bg-gradient-to-r from-cyan-400 to-blue-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-gradient-to-r from-cyan-600 to-blue-500'}`}
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>
        </div>

        {/* CLI Verbose Output */}
        <div className="flex-grow p-6 font-mono text-xs sm:text-sm overflow-y-auto custom-scrollbar bg-black selection:bg-cyan-500/30">
            <div className="space-y-1">
                <div className="text-gray-500 mb-4">$ carlisle-audit --verbose --forest-scan --mode=forensic {isTurbo ? '--turbo --parallel=3' : ''}</div>
                <div className="text-cyan-500/60 mb-2">[SYSTEM] Establishing secure RPC channel to domain controllers...</div>
                <div className={`text-cyan-500/60 mb-4 transition-all ${isTurbo ? 'text-cyan-300 font-bold' : ''}`}>
                    [SYSTEM] Key verified. Initializing {isTurbo ? '32-Core Parallel' : 'Standard'} AI Reasoning Core...
                </div>
                
                {logs.map((log, index) => (
                    <div key={index} className={`animate-fade-in group ${getLogStyle(log.type)}`}>
                        <span className="text-gray-700 mr-3 select-none">[{log.timestamp}]</span>
                        <span className="break-words whitespace-pre-wrap">{log.message}</span>
                    </div>
                ))}
                
                {/* Active Cursor/Pulse */}
                <div className="flex items-center mt-2">
                    <span className="text-gray-600 mr-3 select-none">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                    <span className={`${isTurbo ? 'text-cyan-300' : 'text-cyan-500'} animate-pulse font-bold`}>_</span>
                    <span className={`ml-2 text-[10px] uppercase tracking-widest font-black transition-colors ${isTurbo ? 'text-cyan-600' : 'text-gray-700'}`}>
                        {isTurbo ? 'Awaiting Final Synthesis Payload...' : 'Awaiting Forensic Node Response...'}
                    </span>
                </div>
                
                <div ref={logEndRef} />
            </div>
        </div>

        {/* Footer Info */}
        <div className={`px-6 py-3 border-t transition-colors duration-1000 ${isTurbo ? 'bg-cyan-950/40 border-cyan-500/30' : 'bg-gray-900 border-white/10'} flex justify-between items-center`}>
            <div className={`text-[10px] font-mono transition-colors ${isTurbo ? 'text-cyan-400' : 'text-gray-500'}`}>
                {isTurbo 
                    ? `CPU_ARCH: 32-CORE_ULTRA // TEMP: 78°C // MEM: 64GB_MAX_PERF` 
                    : `CPU_ARCH: DUAL_CORE // TEMP: 43°C // MEM: 8GB_STANDARD`
                }
            </div>
            <div className={`text-[10px] font-black uppercase tracking-widest animate-pulse transition-colors ${isTurbo ? 'text-cyan-300' : 'text-cyan-700'}`}>
                {isTurbo ? 'WARNING: High Capacity Scan Active :: DO NOT CLOSE' : 'Do not refresh page :: Forensic data capture in progress'}
            </div>
        </div>
      </div>
    </div>
  );
};
