
import React, { useState, useEffect } from 'react';
import type { AnalysisResponse } from '../types';

interface VaultEntry {
    id: string;
    timestamp: number;
    gpoCount: number;
    title: string;
    data: AnalysisResponse;
}

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

export const ForensicVault: React.FC<ForensicVaultProps> = ({ onRestore }) => {
    const [history, setHistory] = useState<VaultEntry[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('gpo_sentry_vault');
        if (stored) {
            try {
                setHistory(JSON.parse(stored).slice(0, 10));
            } catch (e) {
                console.error("Vault corruption detected.");
            }
        }
    }, []);

    const clearVault = () => {
        if (confirm("Purge all forensic history?")) {
            localStorage.removeItem('gpo_sentry_vault');
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
        <div className="mt-12 max-w-4xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center">
                    <ClockIcon className="w-3.5 h-3.5 mr-2" /> Forensic Session Vault
                </h3>
                <button onClick={clearVault} className="text-[9px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest">
                    Purge All
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {history.map((entry) => (
                    <div 
                        key={entry.id}
                        onClick={() => onRestore(entry.data)}
                        className="group relative bg-slate-900/40 border border-white/5 hover:border-cyan-500/40 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-800/60"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-200 group-hover:text-cyan-300 transition-colors truncate max-w-[200px]">{entry.title}</p>
                                <p className="text-[10px] text-gray-500 mt-1 font-mono uppercase">
                                    {new Date(entry.timestamp).toLocaleDateString()} &bull; {entry.gpoCount} GPOs
                                </p>
                            </div>
                            <button 
                                onClick={(e) => deleteEntry(e, entry.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-md text-gray-500 hover:text-red-400 transition-all"
                            >
                                <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
