
import React from 'react';
import type { PriorityItem } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  isProTier: boolean;
  onUpgradeTier: () => void;
  onClose: () => void;
  priorities: PriorityItem[];
  onUpdatePriorities: (newPriorities: PriorityItem[]) => void;
}

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const BoltIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const ShieldExclamationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
  </svg>
);

const AdjustmentsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />
  </svg>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, isProTier, onUpgradeTier, onClose, priorities, onUpdatePriorities }) => {
  const handleFactoryReset = () => {
    if (confirm("Are you sure? This will delete all saved sessions and application data from this browser.")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const movePriority = (index: number, direction: 'up' | 'down') => {
    const newPriorities = [...priorities];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= priorities.length) return;
    
    [newPriorities[index], newPriorities[targetIndex]] = [newPriorities[targetIndex], newPriorities[index]];
    onUpdatePriorities(newPriorities);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
            <h2 className="text-xl font-bold text-gray-100 flex items-center">
                <ShieldExclamationIcon className="w-6 h-6 mr-2 text-cyan-400" />
                Control Center
            </h2>
             <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-grow bg-black/20">
            {/* Performance Tier */}
            <div>
                <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center">
                    <BoltIcon className="w-4 h-4 mr-2 text-indigo-400" />
                    Billing & Performance Tier
                </h3>
                <div className={`p-4 rounded-xl border ${isProTier ? 'bg-indigo-900/10 border-indigo-500/30' : 'bg-slate-800/40 border-slate-700'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="text-sm font-bold text-white">{isProTier ? 'Professional Tier Active' : 'Standard Tier (Free)'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {isProTier 
                                    ? 'Running with high-speed forest-wide concurrency.' 
                                    : 'Subject to 2 RPM and daily quota limits.'}
                            </p>
                        </div>
                        <button 
                            onClick={onUpgradeTier}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                isProTier 
                                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-600/40' 
                                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 hover:scale-105'
                            }`}
                        >
                            {isProTier ? 'Change Key' : 'Upgrade to Pro'}
                        </button>
                    </div>
                </div>
            </div>

            <hr className="border-gray-800" />

            {/* Analysis Priorities Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-300 flex items-center">
                        <AdjustmentsIcon className="w-4 h-4 mr-2 text-cyan-400" />
                        Intelligence Priorities
                    </h3>
                    <span className="text-[10px] text-gray-500 font-mono uppercase">Drag/Shift Rank</span>
                </div>
                <div className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-white/5">
                    {priorities.map((item, index) => (
                        <div key={item} className="flex items-center group">
                            <span className="w-6 text-[10px] font-mono text-gray-500">{index + 1}</span>
                            <div className={`flex-grow flex items-center justify-between p-3 rounded-lg border transition-all ${index === 0 ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/5 group-hover:bg-white/10'}`}>
                                <span className={`text-xs font-bold ${index === 0 ? 'text-cyan-300' : 'text-gray-300'}`}>{item}</span>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => movePriority(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1 hover:bg-white/10 rounded disabled:opacity-0 transition-all text-gray-400"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                    </button>
                                    <button 
                                        onClick={() => movePriority(index, 'down')}
                                        disabled={index === priorities.length - 1}
                                        className="p-1 hover:bg-white/10 rounded disabled:opacity-0 transition-all text-gray-400"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <p className="text-[10px] text-gray-600 mt-4 leading-relaxed">
                        The intelligence engine uses this sequence to weight findings. The top vector receives primary forensic focus.
                    </p>
                </div>
            </div>

            <hr className="border-gray-800" />

            {/* Danger Zone */}
            <div>
                <h3 className="text-sm font-bold text-red-400 mb-2">Danger Zone</h3>
                <div className="flex items-center justify-between bg-red-900/10 border border-red-900/30 p-4 rounded-xl">
                    <div>
                        <p className="text-sm text-gray-300 font-medium">Factory Reset</p>
                        <p className="text-xs text-gray-500">Clears all sessions and logs.</p>
                    </div>
                    <button onClick={handleFactoryReset} className="flex items-center px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 rounded-md transition-colors text-sm font-bold">
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Reset
                    </button>
                </div>
            </div>
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-950/80 text-right">
             <button onClick={onClose} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-cyan-900/20">
                Update Core Config
            </button>
        </div>
      </div>
    </div>
  );
};
