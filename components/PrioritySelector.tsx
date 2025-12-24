
import React, { useState } from 'react';
import type { PriorityItem } from '../types';

interface PrioritySelectorProps {
  onConfirm: (priorities: PriorityItem[]) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const ITEMS: PriorityItem[] = ['Consolidation', 'Similar Like-Minded Settings', 'Conflicts', 'Overlap'];

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({ onConfirm, onCancel, isLoading }) => {
  const [ranked, setRanked] = useState<PriorityItem[]>(ITEMS);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...ranked];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setRanked(next);
  };

  const moveDown = (index: number) => {
    if (index === ranked.length - 1) return;
    const next = [...ranked];
    [next[index + 1], next[index]] = [next[index], next[index + 1]];
    setRanked(next);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fade-in">
      <div className="bg-gray-900 border border-cyan-500/40 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in">
        <div className="p-8 border-b border-white/5 bg-slate-950/40">
           <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
             <svg className="w-6 h-6 text-cyan-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
             Set Analysis Priorities
           </h2>
           <p className="text-gray-400 text-sm">Rank the following vectors to guide the intelligence engine. Enterprise security and performance are always weighted by default.</p>
        </div>
        
        <div className="p-8 space-y-3">
          {ranked.map((item, index) => (
            <div key={item} className="flex items-center group">
              <div className="w-8 text-xs font-mono text-cyan-500/60 font-black">{index + 1}.</div>
              <div className={`flex-grow p-4 rounded-xl border flex items-center justify-between transition-all ${index === 0 ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-900/10' : 'bg-white/5 border-white/5 group-hover:bg-white/10'}`}>
                <span className={`font-bold ${index === 0 ? 'text-cyan-300' : 'text-gray-300'}`}>{item}</span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => moveUp(index)} 
                    disabled={index === 0}
                    className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-0 transition-colors text-gray-400 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button 
                    onClick={() => moveDown(index)} 
                    disabled={index === ranked.length - 1}
                    className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-0 transition-colors text-gray-400 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 bg-gray-950/60 border-t border-white/5 flex space-x-4">
           <button 
             onClick={onCancel}
             className="flex-1 px-6 py-4 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl font-bold uppercase tracking-widest transition-all"
           >
             Cancel
           </button>
           <button 
             onClick={() => onConfirm(ranked)}
             disabled={isLoading}
             className="flex-2 px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-cyan-900/40 hover:scale-[1.02] transition-all"
           >
             {isLoading ? 'INITIATING...' : 'Begin Forensic Audit'}
           </button>
        </div>
      </div>
    </div>
  );
};
