
import React, { useMemo, useState } from 'react';
import type { Analysis, GpoDetails, GpoFinding, GpoSecurityRecommendation } from '../types';
import { GpoDetailModal } from './GpoDetailModal';

interface AnalyzedGpoListProps {
    analysis: Analysis;
}

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

export const AnalyzedGpoList: React.FC<AnalyzedGpoListProps> = ({ analysis }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGpo, setSelectedGpo] = useState<string | null>(null);

    const sortedGpos = useMemo(() => {
        return [...analysis.gpoDetails].sort((a, b) => a.name.localeCompare(b.name));
    }, [analysis.gpoDetails]);
    
    const filteredGpos = useMemo(() => {
        if (!searchTerm) return sortedGpos;
        return sortedGpos.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [sortedGpos, searchTerm]);

    return (
        <div className="bg-black/20 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden flex flex-col max-h-[600px] shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-white/5 bg-gray-800/20">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Target Repository</h3>
                <div className="relative">
                    <SearchIcon className="w-4 h-4 text-gray-500 absolute top-1/2 left-3 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Filter Target..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-200 focus:ring-1 focus:ring-cyan-500 transition-all"
                    />
                </div>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-grow bg-black/10">
                {filteredGpos.length > 0 ? (
                    <div className="divide-y divide-white/5">
                        {filteredGpos.map((gpo) => {
                            const conflictCount = analysis.findings.filter(f => f.type === 'Conflict' && f.policies.some(p => p.name === gpo.name)).length;
                            const securityCount = analysis.securityRecommendations?.filter(r => r.gpoName === gpo.name).length || 0;

                            return (
                                <button 
                                    key={gpo.name}
                                    onClick={() => setSelectedGpo(gpo.name)}
                                    className="w-full text-left p-3 hover:bg-cyan-500/10 transition-colors flex items-center justify-between group"
                                >
                                    <div className="flex flex-col min-w-0 pr-4">
                                        <span className="text-xs font-mono text-gray-300 group-hover:text-cyan-300 truncate" title={gpo.name}>{gpo.name}</span>
                                        <span className="text-[9px] text-gray-500 uppercase tracking-tighter mt-0.5">{gpo.linkedOUs.length} Linked OUs</span>
                                    </div>
                                    <div className="flex space-x-1 shrink-0">
                                        {conflictCount > 0 && (
                                            <div className="w-4 h-4 rounded bg-red-900/40 border border-red-500/30 flex items-center justify-center text-[8px] font-black text-red-400" title="Conflicts">
                                                {conflictCount}
                                            </div>
                                        )}
                                        {securityCount > 0 && (
                                            <div className="w-4 h-4 rounded bg-orange-900/40 border border-orange-500/30 flex items-center justify-center text-[8px] font-black text-orange-400" title="Security Risks">
                                                {securityCount}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-8 text-center text-[10px] text-gray-600 uppercase tracking-widest">No Matches</div>
                )}
            </div>

            {selectedGpo && (
                <GpoDetailModal
                    isOpen={!!selectedGpo}
                    onClose={() => setSelectedGpo(null)}
                    gpoName={selectedGpo}
                    gpoDetails={analysis.gpoDetails.find(g => g.name === selectedGpo)}
                    findings={analysis.findings}
                    securityRecommendations={analysis.securityRecommendations || []}
                />
            )}
        </div>
    );
};
