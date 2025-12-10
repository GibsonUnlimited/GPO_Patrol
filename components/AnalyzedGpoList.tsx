
import React, { useMemo, useState, useRef, useEffect } from 'react';
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
    const hasConfiguredSettings = details?.configuredSettings && details.configuredSettings.length > 0;

    return (
        <div 
            className="fixed z-[60] animate-fade-in"
            style={{ top: position.top, left: position.left }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="bg-gray-900 border border-gray-600 rounded-lg shadow-2xl w-96 max-h-[500px] flex flex-col overflow-hidden">
                <div className="px-4 py-3 bg-gray-800/80 border-b border-gray-700">
                    <p className="font-bold text-gray-100 font-mono break-words">{gpoName}</p>
                    <p className="text-[10px] text-cyan-400 mt-0.5 italic">Click list item for full details</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-900 border-b border-gray-700">
                     <button 
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-2 text-xs font-medium transition-colors border-b-2 ${activeTab === 'settings' ? 'border-red-500 text-red-400 bg-red-900/20' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                    >
                        Settings & Issues
                    </button>
                    <button 
                        onClick={() => setActiveTab('scope')}
                        className={`flex-1 py-2 text-xs font-medium transition-colors border-b-2 ${activeTab === 'scope' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/20' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                    >
                        Scope
                    </button>
                    <button 
                        onClick={() => setActiveTab('delegation')}
                        className={`flex-1 py-2 text-xs font-medium transition-colors border-b-2 ${activeTab === 'delegation' ? 'border-purple-500 text-purple-400 bg-purple-900/20' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                    >
                        Delegation
                    </button>
                </div>

                {/* Content */}
                <div className="p-3 overflow-y-auto max-h-[350px] custom-scrollbar bg-black/20">
                    {activeTab === 'settings' && (
                        <div className="space-y-4">
                            
                            {/* Security Risks Block */}
                            {hasSecurityIssues && (
                                <div>
                                    <p className="font-semibold text-red-400 text-xs border-b border-red-900/50 pb-1 mb-1">Security Risks</p>
                                    <ul className="space-y-1">
                                        {securityRecs.map((rec, idx) => (
                                            <li key={idx} className="text-xs text-gray-300">
                                                <span className="text-red-300 font-bold">[{rec.severity}]</span> {rec.setting}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Conflicts Block */}
                            {hasConflicts && (
                                <div>
                                    <p className="font-semibold text-orange-400 text-xs border-b border-orange-900/50 pb-1 mb-1">Conflicts</p>
                                    <ul className="space-y-2">
                                        {relations.conflicts.map(({ setting, withGpos }) => (
                                            <li key={setting} className="text-xs text-gray-300">
                                                <span className="font-mono bg-gray-800 px-1 rounded text-cyan-200 break-words block mb-0.5">{setting}</span>
                                                <span className="text-gray-500">vs </span> 
                                                <span className="font-mono break-words">{withGpos.join(', ')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                             {/* Overlaps Block */}
                            {hasOverlaps && (
                                <div>
                                    <p className="font-semibold text-yellow-400 text-xs border-b border-yellow-900/50 pb-1 mb-1">Overlaps</p>
                                    <ul className="space-y-2">
                                        {relations.overlaps.map(({ setting, withGpos }) => (
                                            <li key={setting} className="text-xs text-gray-300">
                                                <span className="font-mono bg-gray-800 px-1 rounded text-cyan-200 break-words block mb-0.5">{setting}</span>
                                                <span className="text-gray-500">w/ </span> 
                                                <span className="font-mono break-words">{withGpos.join(', ')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Configured Settings (New Section) */}
                            <div>
                                <p className="font-semibold text-cyan-400 text-xs border-b border-cyan-900/50 pb-1 mb-1">Configured Settings</p>
                                {hasConfiguredSettings ? (
                                    <ul className="space-y-2">
                                        {details?.configuredSettings?.map((setting, i) => (
                                            <li key={i} className="text-xs text-gray-300 bg-gray-800/30 p-1.5 rounded border border-gray-700/50">
                                                <div className="font-medium text-gray-200 break-words mb-0.5">{setting.name}</div>
                                                <div className="font-mono text-[10px] text-cyan-300 break-all">{setting.value}</div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 text-xs italic">No other configured settings found (or none extracted).</p>
                                )}
                            </div>

                        </div>
                    )}

                    {activeTab === 'scope' && (
                        <div className="space-y-3">
                            <div>
                                <p className="font-semibold text-cyan-400 text-xs border-b border-cyan-900/50 pb-1 mb-1">Linked OUs</p>
                                {details?.linkedOUs && details.linkedOUs.length > 0 ? (
                                    <ul className="space-y-1">
                                        {details.linkedOUs.map((ou, i) => (
                                            <li key={i} className="text-gray-300 font-mono text-[10px] break-all border-l border-gray-600 pl-2">
                                                {ou}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-gray-500 text-xs italic">Not linked.</p>}
                            </div>
                            <div>
                                <p className="font-semibold text-cyan-400 text-xs border-b border-cyan-900/50 pb-1 mb-1">Security Filtering</p>
                                {details?.securityFiltering && details.securityFiltering.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {details.securityFiltering.map((sf, i) => (
                                            <span key={i} className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-gray-600">
                                                {sf}
                                            </span>
                                        ))}
                                    </div>
                                ) : <p className="text-gray-500 text-xs italic">Authenticated Users (Default)</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'delegation' && (
                        <div>
                             <p className="font-semibold text-purple-400 text-xs border-b border-purple-900/50 pb-1 mb-1">Delegated Principals</p>
                             {details?.delegation && details.delegation.length > 0 ? (
                                <ul className="space-y-1">
                                    {details.delegation.map((del, i) => {
                                        const parts = del.split(':');
                                        const principal = parts[0];
                                        return (
                                            <li key={i} className="text-[10px] text-gray-300 border-l border-gray-700 pl-2">
                                                <span className="font-bold text-gray-200 block">{principal}</span>
                                                {parts[1] && <span className="text-gray-500">{parts[1]}</span>}
                                            </li>
                                        );
                                    })}
                                </ul>
                             ) : <p className="text-gray-500 text-xs italic">Standard Permissions</p>}
                        </div>
                    )}
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
        
        // Initialize relations map for all known GPOs
        allGposFromDetails.forEach(gpoName => {
             if (!relationsMap.has(gpoName)) {
                relationsMap.set(gpoName, { conflicts: [], overlaps: [] });
            }
        });

        // Populate relations from findings
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
        // Position to the right of the item, slightly aligned to top
        let top = rect.top;
        let left = rect.right + 10;
        
        // Adjust if close to bottom of screen
        if (top + 400 > window.innerHeight) {
            top = Math.max(10, window.innerHeight - 450);
        }

        setHoverPos({ top, left });
        setHoveredGpo(name);
    };

    const handleMouseLeave = () => {
        hoverTimeout.current = window.setTimeout(() => {
            setHoveredGpo(null);
        }, 300); // 300ms delay allows user to move mouse into the tooltip
    };

    const handleMouseEnterTooltip = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };

    return (
        <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-4 sm:p-6 animate-fade-in relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <ListIcon className="w-7 h-7 text-cyan-300 mr-3" />
                    <h3 className="text-xl font-bold text-cyan-300">Analyzed GPOs</h3>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span className="flex items-center font-medium">
                        <div className="relative w-4 h-4 mr-1.5 flex items-center justify-center">
                            <span className="absolute w-4 h-4 bg-red-500 rounded-full"></span>
                            <span className="relative text-white font-bold text-[10px] leading-none">{gpoData.conflictCount}</span>
                        </div>
                        Conflict
                    </span>
                    <span className="flex items-center font-medium">
                        <div className="relative w-4 h-4 mr-1.5 flex items-center justify-center">
                            <span className="absolute w-4 h-4 bg-yellow-400 rounded-full"></span>
                            <span className="relative text-gray-900 font-bold text-[10px] leading-none">{gpoData.overlapOnlyCount}</span>
                        </div>
                        Overlap
                    </span>
                </div>
            </div>
            
            <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="w-5 h-5 text-gray-500" />
                </span>
                <input
                    type="text"
                    placeholder="Search for a GPO..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-900/70 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    aria-label="Search GPOs"
                />
            </div>
            
            {gpoData.allGpos.length > 0 ? (
                filteredGpos.length > 0 ? (
                    <ul className="space-y-1.5 max-h-[35vh] overflow-y-auto pr-2">
                        {filteredGpos.map(gpoName => {
                            const relations = gpoData.relations[gpoName];
                            const hasConflicts = relations?.conflicts?.length > 0;
                            const hasOverlaps = relations?.overlaps?.length > 0;

                            const dot = hasConflicts ? (
                                <span className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0" title="Has Conflicts"></span>
                            ) : hasOverlaps ? (
                                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3 flex-shrink-0" title="Has Overlaps"></span>
                            ) : (
                                <span className="w-2 h-2 mr-3 flex-shrink-0"></span> // Placeholder for alignment
                            );

                            return (
                                <li 
                                    key={gpoName}
                                    onMouseEnter={(e) => handleMouseEnterGpo(e, gpoName)}
                                    onMouseLeave={handleMouseLeave}
                                    onClick={() => setSelectedGpo(gpoName)}
                                    className="flex items-center p-2 rounded-md bg-gray-700/50 hover:bg-cyan-600/50 transition-colors cursor-pointer text-sm font-mono relative animate-fade-in group"
                                >
                                    {dot}
                                    <span className="break-words flex-grow">{gpoName}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                        No GPOs found matching "{searchTerm}".
                    </p>
                )
            ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                    No GPOs were identified in the analysis.
                </p>
            )}

            {/* Render Tooltip via Fixed Positioning (Portal-like behavior without Portal component) */}
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
