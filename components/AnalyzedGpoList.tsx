import React, { useMemo, useState } from 'react';
import type { Analysis, GpoDetails } from '../types';

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


const Tooltip: React.FC<{ gpoName: string; relations: GpoRelations | undefined; linkedOUs: string[] }> = ({ gpoName, relations, linkedOUs }) => {
    const hasConflicts = relations?.conflicts?.length > 0;
    const hasOverlaps = relations?.overlaps?.length > 0;
    const hasRelations = hasConflicts || hasOverlaps;
    const hasOUs = linkedOUs && linkedOUs.length > 0;

    return (
        <div className="absolute left-full top-0 ml-2 p-3 w-80 bg-gray-900 border border-gray-600 rounded-lg shadow-2xl z-20 text-xs animate-fade-in max-h-80 overflow-y-auto">
            <p className="font-bold text-gray-100 mb-2 border-b border-gray-700 pb-1 font-mono">{gpoName}</p>
            {!hasRelations && !hasOUs && <p className="text-gray-400">No conflicts, overlaps, or OU links found for this GPO.</p>}
            
            {hasOUs && (
                 <div className="mb-2 border-b border-gray-700 pb-2">
                    <p className="font-semibold text-sky-400">Linked OUs:</p>
                    <ul className="space-y-1 mt-1">
                        {linkedOUs.map((ou) => (
                            <li key={ou} className="text-gray-300 font-mono text-xs break-all">
                                {ou}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {hasConflicts && (
                <div className="mb-2">
                    <p className="font-semibold text-red-400">Conflicts:</p>
                    <ul className="space-y-2 mt-1">
                        {relations.conflicts.map(({ setting, withGpos }) => (
                            <li key={setting} className="text-gray-300">
                                <span className="font-mono bg-gray-700/50 px-1 py-0.5 rounded text-cyan-300 break-all">{setting}</span>
                                <span className="text-gray-400"> with </span> 
                                <span className="font-mono">{withGpos.join(', ')}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {hasOverlaps && (
                 <div>
                    <p className="font-semibold text-yellow-400">Overlaps:</p>
                     <ul className="space-y-2 mt-1">
                        {relations.overlaps.map(({ setting, withGpos }) => (
                            <li key={setting} className="text-gray-300">
                                <span className="font-mono bg-gray-700/50 px-1 py-0.5 rounded text-cyan-300 break-all">{setting}</span>
                                <span className="text-gray-400"> with </span> 
                                <span className="font-mono">{withGpos.join(', ')}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export const AnalyzedGpoList: React.FC<AnalyzedGpoListProps> = ({ analysis }) => {
    const [hoveredGpo, setHoveredGpo] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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
        
        // Calculate counts
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

        const sortedGpos = allGpoNames.sort((a, b) => {
            const relationsA = relationsMap.get(a);
            const relationsB = relationsMap.get(b);
        
            const scoreA = relationsA?.conflicts?.length > 0 ? 0 : (relationsA?.overlaps?.length > 0 ? 1 : 2);
            const scoreB = relationsB?.conflicts?.length > 0 ? 0 : (relationsB?.overlaps?.length > 0 ? 1 : 2);
        
            if (scoreA !== scoreB) {
                return scoreA - scoreB;
            }
        
            return a.localeCompare(b);
        });

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

    return (
        <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-4 sm:p-6">
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
                            const details = gpoData.gpoDetails.find(g => g.name === gpoName);
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
                                    onMouseEnter={() => setHoveredGpo(gpoName)}
                                    onMouseLeave={() => setHoveredGpo(null)}
                                    className="flex items-center p-2 rounded-md bg-gray-700/50 hover:bg-cyan-600/50 transition-colors cursor-default text-sm font-mono relative"
                                >
                                    {dot}
                                    <span className="truncate">{gpoName}</span>
                                    {hoveredGpo === gpoName && (
                                        <Tooltip gpoName={gpoName} relations={relations} linkedOUs={details?.linkedOUs || []} />
                                    )}
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
        </div>
    );
};