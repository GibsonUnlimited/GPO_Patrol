
import React, { useMemo, useState, useRef } from 'react';
import type { Analysis, GpoDetails, GpoFinding, GpoSecurityRecommendation } from '../types';
import { GpoDetailModal } from './GpoDetailModal';

interface AnalyzedGpoListProps {
    analysis: Analysis;
}

interface SettingRelation {
    setting: string;
    withGpos: string[];
}

interface GpoRelations {
    conflicts: SettingRelation[];
    overlaps: SettingRelation[];
}

const ListIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75V17.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

interface GpoHoverCardProps {
    gpoName: string;
    details: GpoDetails | undefined;
    relations: GpoRelations;
    securityRecs: GpoSecurityRecommendation[];
    position: { top: number; left: number };
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

const GpoHoverCard: React.FC<GpoHoverCardProps> = ({ gpoName, details, relations, securityRecs, position, onMouseEnter, onMouseLeave }) => {
    const [activeTab, setActiveTab] = useState<'settings' | 'scope' | 'delegation'>('settings');

    const hasConflicts = relations?.conflicts?.length > 0;
    const hasOverlaps = relations?.overlaps?.length > 0;
    const hasSecurityIssues = securityRecs.length > 0;
    const configuredSettings = details?.configuredSettings || [];

    return (
        <div 
            className="fixed z-[60] animate-fade-in"
            style={{ top: position.top, left: position.left }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="bg-gray-900 border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] w-96 max-h-[550px] flex flex-col overflow-hidden backdrop-blur-xl">
                <div className="px-4 py-3 bg-cyan-950/40 border-b border-white/10">
                    <p className="font-bold text-white font-mono break-words text-sm">{gpoName}</p>
                    <p className="text-[10px] text-cyan-400 mt-0.5 font-black uppercase tracking-widest">Policy Inspection Portal</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-950 border-b border-white/5">
                     <button 
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tighter transition-all border-b-2 ${activeTab === 'settings' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/20' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Logic & Issues
                    </button>
                    <button 
                        onClick={() => setActiveTab('scope')}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tighter transition-all border-b-2 ${activeTab === 'scope' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/20' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Links/Filter
                    </button>
                    <button 
                        onClick={() => setActiveTab('delegation')}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tighter transition-all border-b-2 ${activeTab === 'delegation' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/20' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Delegation
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[400px] custom-scrollbar bg-black/40">
                    {activeTab === 'settings' && (
                        <div className="space-y-5">
                            
                            {/* Security Risks */}
                            {hasSecurityIssues && (
                                <div>
                                    <p className="font-black text-red-500 text-[10px] uppercase tracking-widest mb-2 flex items-center">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                                        Security Vulnerabilities
                                    </p>
                                    <ul className="space-y-1.5">
                                        {securityRecs.map((rec, idx) => (
                                            <li key={idx} className="text-xs bg-red-950/20 border border-red-900/30 p-2 rounded text-gray-300">
                                                <span className="text-red-400 font-black">[{rec.severity}]</span> {rec.setting}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Conflicts */}
                            {hasConflicts && (
                                <div>
                                    <p className="font-black text-orange-500 text-[10px] uppercase tracking-widest mb-2">Precedence Conflicts</p>
                                    <ul className="space-y-1.5">
                                        {relations.conflicts.map(({ setting, withGpos }) => (
                                            <li key={setting} className="text-xs bg-orange-950/20 border border-orange-900/30 p-2 rounded">
                                                <div className="font-mono text-cyan-200 break-words mb-1">{setting}</div>
                                                <div className="text-[10px] text-gray-500 font-bold uppercase">vs: {withGpos.join(', ')}</div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Overlaps */}
                            {hasOverlaps && (
                                <div>
                                    <p className="font-black text-yellow-500 text-[10px] uppercase tracking-widest mb-2">Redundant Overlaps</p>
                                    <ul className="space-y-1.5">
                                        {relations.overlaps.map(({ setting, withGpos }) => (
                                            <li key={setting} className="text-xs bg-yellow-950/10 border border-yellow-900/30 p-2 rounded">
                                                <div className="font-mono text-cyan-200 break-words mb-1">{setting}</div>
                                                <div className="text-[10px] text-gray-500 font-bold uppercase">Linked: {withGpos.join(', ')}</div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* All Configured Settings List */}
                            <div>
                                <p className="font-black text-cyan-500 text-[10px] uppercase tracking-widest mb-2">Detailed Config Registry</p>
                                {configuredSettings.length > 0 ? (
                                    <div className="space-y-1">
                                        {configuredSettings.map((s, i) => (
                                            <div key={i} className="text-[11px] border-l-2 border-cyan-800 bg-gray-800/30 p-2 rounded-r">
                                                <div className="font-bold text-gray-200 break-words">{s.name}</div>
                                                <div className="font-mono text-cyan-400 mt-1 flex justify-between">
                                                    <span className="truncate pr-2">Value: {s.value}</span>
                                                    <span className="text-[9px] text-gray-500 uppercase">{s.policyType || 'Setting'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-600 text-[10px] italic">No detailed setting map available for this object.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'scope' && (
                        <div className="space-y-4">
                            <div>
                                <p className="font-black text-cyan-500 text-[10px] uppercase tracking-widest mb-2">Linked OUs</p>
                                {details?.linkedOUs && details.linkedOUs.length > 0 ? (
                                    <div className="space-y-1">
                                        {details.linkedOUs.map((ou, i) => (
                                            <div key={i} className="text-[10px] text-gray-400 font-mono bg-black/40 p-2 rounded border border-white/5 break-all">
                                                {ou}
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-gray-600 text-xs italic bg-black/20 p-2 rounded">Object is not currently linked.</p>}
                            </div>
                            <div>
                                <p className="font-black text-cyan-500 text-[10px] uppercase tracking-widest mb-2">Security Filtering</p>
                                <div className="flex flex-wrap gap-2">
                                    {details?.securityFiltering && details.securityFiltering.length > 0 ? (
                                        details.securityFiltering.map((sf, i) => (
                                            <span key={i} className="bg-cyan-900/30 text-cyan-300 px-2 py-1 rounded text-[10px] font-mono border border-cyan-800/50">
                                                {sf}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded text-[10px] font-mono">Authenticated Users</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'delegation' && (
                        <div>
                             <p className="font-black text-cyan-500 text-[10px] uppercase tracking-widest mb-2">Management Delegation</p>
                             {details?.delegation && details.delegation.length > 0 ? (
                                <div className="space-y-2">
                                    {details.delegation.map((del, i) => {
                                        const [name, perm] = del.split(':');
                                        return (
                                            <div key={i} className="bg-gray-800/40 p-2 rounded border-l-2 border-purple-500/50">
                                                <div className="font-bold text-xs text-gray-200">{name}</div>
                                                {perm && <div className="text-[10px] text-gray-500 uppercase mt-0.5">{perm.trim()}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                             ) : <p className="text-gray-600 text-xs italic bg-black/20 p-2 rounded">Standard Administrative permissions.</p>}
                        </div>
                    )}
                </div>
                <div className="px-4 py-2 bg-black/60 text-[9px] text-gray-500 border-t border-white/5 flex justify-between">
                    <span>Forensic Node ID: {gpoName.substring(0,8)}...</span>
                    <span>Ready for Presentation</span>
                </div>
            </div>
        </div>
    );
};

export const AnalyzedGpoList: React.FC<AnalyzedGpoListProps> = ({ analysis }) => {
    const [hoveredGpo, setHoveredGpo] = useState<string | null>(null);
    const [hoverPos, setHoverPos] = useState({ top: 0, left: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGpo, setSelectedGpo] = useState<string | null>(null);
    const hoverTimeout = useRef<number | null>(null);

    const gpoData = useMemo(() => {
        const allGposDetails = analysis.gpoDetails;
        const allGposFromDetails = allGposDetails.map(gpo => gpo.name);

        const relationsMap = new Map<string, GpoRelations>();
        
        allGposFromDetails.forEach(gpoName => {
             if (!relationsMap.has(gpoName)) {
                relationsMap.set(gpoName, { conflicts: [], overlaps: [] });
            }
        });

        analysis.findings.forEach(finding => {
            const { setting, type, policies } = finding;
            const policyNames = policies.map(p => p.name);
            
            policyNames.forEach(name => {
                if (!relationsMap.has(name)) {
                     relationsMap.set(name, { conflicts: [], overlaps: [] });
                }
            });

            if (policyNames.length > 1) {
                policyNames.forEach((currentGpoName) => {
                    const otherGpos = policyNames.filter(name => name !== currentGpoName);
                    if (otherGpos.length > 0) {
                        const relations = relationsMap.get(currentGpoName)!;
                        const list = type === 'Conflict' ? relations.conflicts : relations.overlaps;
                        list.push({ setting, withGpos: otherGpos });
                    }
                });
            }
        });

        const allGpoNames = Array.from(relationsMap.keys());
        
        let conflictCount = 0;
        let overlapOnlyCount = 0;

        allGpoNames.forEach(gpoName => {
            const relations = relationsMap.get(gpoName);
            if (relations) {
                if (relations.conflicts.length > 0) {
                    conflictCount++;
                } else if (relations.overlaps.length > 0) {
                    overlapOnlyCount++;
                }
            }
        });

        const sortedGpos = allGpoNames.sort((a, b) => a.localeCompare(b));

        const finalRelations: { [key: string]: GpoRelations } = {};
        relationsMap.forEach((value, key) => {
            finalRelations[key] = value;
        });

        return { allGpos: sortedGpos, gpoDetails: allGposDetails, relations: finalRelations, conflictCount, overlapOnlyCount };
    }, [analysis]);
    
    const filteredGpos = useMemo(() => {
        if (!searchTerm) {
            return gpoData.allGpos;
        }
        return gpoData.allGpos.filter(gpoName => 
            gpoName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [gpoData.allGpos, searchTerm]);

    const handleMouseEnterGpo = (e: React.MouseEvent<HTMLLIElement>, name: string) => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        
        const rect = e.currentTarget.getBoundingClientRect();
        let top = rect.top;
        let left = rect.right + 20;
        
        // Portal adjustment
        if (top + 550 > window.innerHeight) {
            top = Math.max(10, window.innerHeight - 560);
        }
        if (left + 400 > window.innerWidth) {
            left = rect.left - 400;
        }

        setHoverPos({ top, left });
        setHoveredGpo(name);
    };

    const handleMouseLeave = () => {
        hoverTimeout.current = window.setTimeout(() => {
            setHoveredGpo(null);
        }, 300);
    };

    const handleMouseEnterTooltip = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };

    return (
        <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-4 sm:p-6 animate-fade-in relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <ListIcon className="w-7 h-7 text-cyan-300 mr-3" />
                    <h3 className="text-xl font-bold text-cyan-300">Forest Inventory</h3>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span className="flex items-center font-black uppercase tracking-tighter">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></div>
                        Conflicts
                    </span>
                    <span className="flex items-center font-black uppercase tracking-tighter">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1.5"></div>
                        Overlaps
                    </span>
                </div>
            </div>
            
            <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="w-5 h-5 text-gray-500" />
                </span>
                <input
                    type="text"
                    placeholder="Search Forest Objects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-cyan-600 transition-all outline-none"
                />
            </div>
            
            {gpoData.allGpos.length > 0 ? (
                filteredGpos.length > 0 ? (
                    <ul className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredGpos.map(gpoName => {
                            const relations = gpoData.relations[gpoName];
                            const hasConflicts = relations?.conflicts?.length > 0;
                            const hasOverlaps = relations?.overlaps?.length > 0;

                            const dot = hasConflicts ? (
                                <span className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0 animate-pulse"></span>
                            ) : hasOverlaps ? (
                                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3 flex-shrink-0"></span>
                            ) : (
                                <span className="w-2 h-2 border border-gray-600 rounded-full mr-3 flex-shrink-0"></span>
                            );

                            return (
                                <li 
                                    key={gpoName}
                                    onMouseEnter={(e) => handleMouseEnterGpo(e, gpoName)}
                                    onMouseLeave={handleMouseLeave}
                                    onClick={() => setSelectedGpo(gpoName)}
                                    className="flex items-center p-2.5 rounded-lg bg-gray-800/40 border border-white/5 hover:border-cyan-500/50 hover:bg-cyan-900/20 transition-all cursor-pointer text-sm font-mono group"
                                >
                                    {dot}
                                    <span className="break-words flex-grow text-gray-300 group-hover:text-white transition-colors">{gpoName}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-all">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No results found for current query.</p>
                )
            ) : (
                <p className="text-sm text-gray-500 text-center py-4 font-mono">FOREST SCAN DATA NULL</p>
            )}

            {hoveredGpo && (
                <GpoHoverCard 
                    gpoName={hoveredGpo}
                    details={gpoData.gpoDetails.find(g => g.name === hoveredGpo)}
                    relations={gpoData.relations[hoveredGpo]}
                    securityRecs={analysis.securityRecommendations?.filter(r => r.gpoName === hoveredGpo) || []}
                    position={hoverPos}
                    onMouseEnter={handleMouseEnterTooltip}
                    onMouseLeave={handleMouseLeave}
                />
            )}

            {selectedGpo && (
                <GpoDetailModal
                    isOpen={!!selectedGpo}
                    onClose={() => setSelectedGpo(null)}
                    gpoName={selectedGpo}
                    gpoDetails={gpoData.gpoDetails.find(g => g.name === selectedGpo)}
                    findings={analysis.findings}
                    securityRecommendations={analysis.securityRecommendations || []}
                />
            )}
        </div>
    );
};
