
import React, { useState, useEffect, useMemo } from 'react';
import type { AnalysisResponse, VaultEntry } from '../types';

interface ForensicVaultProps {
    onRestore: (entry: AnalysisResponse) => void;
}

const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const RestoreIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
);

export const ForensicVault: React.FC<ForensicVaultProps> = ({ onRestore }) => {
    const [history, setHistory] = useState<VaultEntry[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('gpo_sentry_vault');
        if (stored) {
            try {
                setHistory(JSON.parse(stored).slice(0, 15));
            } catch (e) {
                console.error("Vault corruption detected.");
            }
        }
    }, []);

    const groupedHistory = useMemo(() => {
        const groups: Record<string, VaultEntry[]> = {};
        history.forEach(entry => {
            const dateStr = new Date(entry.timestamp).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(entry);
        });
        return Object.entries(groups).sort((a, b) => {
            return new Date(b[1][0].timestamp).getTime() - new Date(a[1][0].timestamp).getTime();
        });
    }, [history]);

    const clearVault = () => {
        if (confirm("CRITICAL: Purge all historical restore points? This action cannot be undone.")) {
            localStorage.removeItem('gpo_sentry_vault');
            localStorage.removeItem('gpo_sentry_vault_index');
            setHistory([]);
        }
    };

    const deleteEntry = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newHistory = history.filter(h => h.id !== id);
        setHistory(newHistory);
        localStorage.setItem('gpo_sentry_vault', JSON.stringify(newHistory));
    };

    if (history.length === 0) return null;

    return (
        <div className="mt-20 max-w-5xl mx-auto animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-10 px-4">
                <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-cyan-500 flex items-center mb-1">
                        <ClockIcon className="w-4 h-4 mr-3 animate-pulse" /> Forensic Timeline
                    </h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Chronological Analysis Vault</p>
                </div>
                <button 
                    onClick={clearVault} 
                    className="group flex items-center px-4 py-2 border border-red-500/20 rounded-xl text-[10px] font-black text-red-500 hover:bg-red-500 hover:text-white uppercase tracking-widest transition-all"
                >
                    <TrashIcon className="w-3.5 h-3.5 mr-2" /> Purge History
                </button>
            </div>

            <div className="space-y-12">
                {groupedHistory.map(([date, entries]) => (
                    <div key={date} className="relative">
                        <div className="flex items-center mb-6">
                            <div className="bg-slate-900 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] shadow-xl relative z-10">
                                {date}
                            </div>
                            <div className="flex-grow h-px bg-gradient-to-r from-white/10 to-transparent ml-4"></div>
                        </div>

                        <div className="absolute left-6 top-8 bottom-0 w-px bg-gradient-to-b from-cyan-500/20 via-cyan-500/5 to-transparent -z-10"></div>

                        <div className="grid grid-cols-1 gap-4 ml-6">
                            {entries.map((entry) => (
                                <div 
                                    key={entry.id}
                                    onClick={() => onRestore(entry.data)}
                                    className="group relative bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-cyan-500/50 rounded-2xl p-6 cursor-pointer transition-all hover:bg-slate-800/80 shadow-lg hover:shadow-cyan-900/20"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-6">
                                            <div className="w-12 h-12 rounded-xl bg-cyan-500/5 flex items-center justify-center border border-cyan-500/10 group-hover:bg-cyan-500/20 transition-all">
                                                <RestoreIcon className="w-5 h-5 text-cyan-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-3 mb-1">
                                                    <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{entry.title}</p>
                                                    <span className="text-[9px] font-mono bg-black/40 px-2 py-0.5 rounded border border-white/5 text-gray-500">ID: {entry.fingerprint}</span>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <p className="text-[10px] text-gray-500 font-mono uppercase">
                                                        <span className="text-cyan-500 font-black">{entry.gpoCount}</span> GPOs Analyzed
                                                    </p>
                                                    <span className="text-gray-700">•</span>
                                                    <p className="text-[10px] text-gray-500 font-mono uppercase">
                                                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <button 
                                                onClick={(e) => deleteEntry(e, entry.id)}
                                                className="p-2.5 bg-slate-950/50 hover:bg-red-500/20 border border-white/5 rounded-xl text-gray-500 hover:text-red-400 transition-all"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
