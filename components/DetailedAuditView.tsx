
import React, { useMemo, useState } from 'react';
import type { Analysis, GpoDetails, GpoFinding, RoadmapAction } from '../types';

interface DetailedAuditViewProps {
  analysis: Analysis;
  activePhase: number;
  onBack: () => void;
}

const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const PrintIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231a1.125 1.125 0 0 1-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
  </svg>
);

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
);

const SectionHeader: React.FC<{ title: string; subtitle: string; summary: string }> = ({ title, subtitle, summary }) => (
  <div className="mb-8 border-b border-white/10 pb-6 print:border-black print:mb-4">
    <h2 className="text-2xl font-black text-gray-100 print:text-black uppercase tracking-tighter">{title}</h2>
    <p className="text-cyan-400 print:text-blue-700 text-[10px] font-black uppercase tracking-[0.3em] mb-4">{subtitle}</p>
    <div className="bg-cyan-900/10 print:bg-gray-100 border-l-4 border-cyan-500 print:border-blue-700 p-4 rounded-r-lg">
      <p className="text-sm text-gray-300 print:text-gray-800 italic">"Executive Summary: {summary}"</p>
    </div>
  </div>
);

export const DetailedAuditView: React.FC<DetailedAuditViewProps> = ({ analysis, activePhase, onBack }) => {
  const [hoveredGpo, setHoveredGpo] = useState<GpoDetails | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const overlaps = useMemo(() => analysis.findings.filter(f => f.type === 'Overlap'), [analysis.findings]);
  const conflicts = useMemo(() => analysis.findings.filter(f => f.type === 'Conflict'), [analysis.findings]);
  
  // Logical Identification: Low Hanging Fruit (100% scope/security matches)
  const lowHangingFruit = useMemo(() => {
    const groups: Record<string, GpoDetails[]> = {};
    
    analysis.gpoDetails.forEach(gpo => {
        // Create unique fingerprint based on scope and security
        const ouKey = [...(gpo.linkedOUs || [])].sort().join('|');
        const sfKey = [...(gpo.securityFiltering || ['Authenticated Users'])].sort().join('|');
        const delKey = [...(gpo.delegation || [])].sort().join('|');
        const fingerprint = `OU:${ouKey}#SF:${sfKey}#DEL:${delKey}`;
        
        if (!groups[fingerprint]) groups[fingerprint] = [];
        groups[fingerprint].push(gpo);
    });

    // Filter for groups with more than 1 GPO (actual merge candidates)
    return Object.entries(groups)
        .filter(([_, members]) => members.length > 1)
        .map(([key, members]) => ({
            fingerprint: key,
            members,
            metadata: {
                ou: members[0].linkedOUs,
                sf: members[0].securityFiltering,
                del: members[0].delegation
            }
        }));
  }, [analysis.gpoDetails]);

  // Phase 1 specific grouping: Consolidation Targets
  const consolidationGroups = useMemo(() => {
    const groups = (analysis.roadmap.phase1 || []).filter(a => a.actionType === 'Merge/Consolidate');
    return groups;
  }, [analysis.roadmap.phase1]);

  const unassignedGpos = useMemo(() => {
    const assigned = new Set<string>();
    analysis.roadmap.phase1.forEach(a => {
        assigned.add(a.primaryGpo);
        a.secondaryGpos?.forEach(s => assigned.add(s));
    });
    return analysis.gpoDetails.filter(g => !assigned.has(g.name));
  }, [analysis.gpoDetails, analysis.roadmap.phase1]);

  const renderGpoNode = (gpoName: string) => {
    const details = analysis.gpoDetails.find(d => d.name === gpoName);
    if (!details) return null;
    return (
        <div 
            key={gpoName}
            onMouseEnter={() => setHoveredGpo(details)}
            onMouseLeave={() => setHoveredGpo(null)}
            className="p-4 bg-gray-950/50 border border-white/5 rounded-xl hover:border-cyan-500/40 transition-colors cursor-help mb-2"
        >
            <div className="flex justify-between items-center">
                <span className="font-mono text-sm text-gray-200">{gpoName}</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black">
                    {details.configuredSettings?.length || 0} Settings Detected
                </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
                {details.linkedOUs.slice(0, 2).map((ou, idx) => (
                    <span key={idx} className="text-[9px] text-gray-600 bg-black/40 px-2 py-0.5 rounded border border-white/5 truncate max-w-[200px]">{ou}</span>
                ))}
                {details.linkedOUs.length > 2 && <span className="text-[9px] text-gray-600">+{details.linkedOUs.length - 2} more</span>}
            </div>
        </div>
    );
  };

  const renderPhase1 = () => (
    <div className="space-y-12">
        <SectionHeader 
            title="Consolidation Action Plan" 
            subtitle="Phase 1: GPO Volume Reduction Strategy"
            summary="Strategic plan to merge technology-specific policies into masters. Total GPO count reduction target established for end-of-Feb deadline."
        />

        {/* --- LOW HANGING FRUIT SECTION --- */}
        {lowHangingFruit.length > 0 && (
            <div className="mb-12 animate-fade-in">
                <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-green-900/30 rounded-xl flex items-center justify-center mr-4 border border-green-500/30">
                        <SparklesIcon className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-100 uppercase tracking-tighter">Low Hanging Fruit</h3>
                        <p className="text-[9px] text-green-500 font-bold uppercase tracking-widest">100% Scope & Security Matches Detected</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {lowHangingFruit.map((group, groupIdx) => (
                        <div key={groupIdx} className="bg-green-950/10 border border-green-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(34,197,94,0.05)]">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-green-400 uppercase tracking-[0.3em] bg-green-900/40 px-2 py-0.5 rounded">Merge Safety: 100%</span>
                                    <h4 className="text-sm font-bold text-gray-200 mt-2">Functional Cluster {groupIdx + 1}</h4>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-green-400">{group.members.length}</span>
                                    <span className="text-[8px] text-gray-500 font-black block uppercase tracking-tighter">GPOs in Group</span>
                                </div>
                            </div>

                            {/* Shared Metadata Summary */}
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5 mb-6 space-y-3">
                                <div>
                                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Target Scope</p>
                                    <div className="font-mono text-[10px] text-cyan-300 break-all">{group.metadata.ou.join(', ') || 'Domain Root'}</div>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Sec Filter</p>
                                        <div className="font-mono text-[9px] text-gray-400">{group.metadata.sf?.join(', ') || 'Auth Users'}</div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Delegation</p>
                                        <div className="font-mono text-[9px] text-gray-400 truncate">{group.metadata.del?.length || 0} Principles</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">Consolidation Members</p>
                                {group.members.map(g => renderGpoNode(g.name))}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-8 p-4 bg-green-900/5 border border-green-500/10 rounded-xl text-center">
                    <p className="text-xs text-green-500/70 font-medium">Consolidating these clusters is high-confidence. No scope or filtering logic will be modified by merging these sets.</p>
                </div>
            </div>
        )}

        {/* Consolidation Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {consolidationGroups.map((group, idx) => (
                <div key={idx} className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-6 shadow-2xl print:border-black">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">{group.targetName || 'Master Policy Node'}</h3>
                            <p className="text-[9px] text-cyan-500 font-bold uppercase tracking-widest">Master Consolidation Target</p>
                        </div>
                        <div className="bg-cyan-900/30 px-3 py-1 rounded-full border border-cyan-500/30">
                            <span className="text-xs font-black text-cyan-300">SHRINK RATIO: {group.secondaryGpos?.length || 0}:1</span>
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <p className="text-xs text-gray-400 mb-4 italic leading-relaxed">"{group.details}"</p>
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Source Forest Objects</h4>
                        <div className="space-y-2">
                            {group.secondaryGpos?.map(s => renderGpoNode(s))}
                            {/* If primaryGpo is a source, render it too */}
                            {(!group.secondaryGpos?.includes(group.primaryGpo) && !group.targetName) && renderGpoNode(group.primaryGpo)}
                        </div>
                    </div>
                </div>
            ))}

            {/* Lone GPOs / Retirements / Migrations */}
            <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-black text-gray-300 uppercase tracking-tighter mb-6">Isolated Forest Nodes</h3>
                <div className="space-y-4">
                    {unassignedGpos.map(g => renderGpoNode(g.name))}
                </div>
            </div>
        </div>
    </div>
  );

  const renderPhase2 = () => (
    <div className="space-y-12">
        <SectionHeader 
            title="Integrity & Precedence Map" 
            subtitle="Phase 2: Conflict & Overlap Resolution"
            summary="Identified high-severity precedence conflicts. Deterministic state audit to ensure reliable policy application across all OUs."
        />
        
        {/* Conflict Matrix */}
        <div className="bg-red-950/10 border border-red-900/30 rounded-2xl p-6">
             <h3 className="text-lg font-black text-red-400 uppercase tracking-widest mb-4">Integrity Violation Matrix</h3>
             <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                    <thead className="bg-red-900/20 text-red-300 uppercase font-black">
                        <tr>
                            <th className="px-4 py-3 text-left">Setting</th>
                            <th className="px-4 py-3 text-left">Winning Configuration</th>
                            <th className="px-4 py-3 text-left">Overwritten State</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {conflicts.map((f, i) => (
                            <tr key={i} className="hover:bg-red-900/5">
                                <td className="px-4 py-4 font-mono font-bold text-gray-200">{f.setting}</td>
                                <td className="px-4 py-4">
                                    <div className="text-green-400 font-mono">{f.policies.find(p => p.isWinningPolicy)?.value}</div>
                                    <div className="text-[9px] text-gray-500 uppercase mt-1">{f.policies.find(p => p.isWinningPolicy)?.name}</div>
                                </td>
                                <td className="px-4 py-4">
                                    {f.policies.filter(p => !p.isWinningPolicy).map((l, idx) => (
                                        <div key={idx} className="text-red-300/60 font-mono line-through text-[10px] mb-1">{l.name}: {l.value}</div>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>

        {/* Overlap Matrix */}
        <div className="bg-yellow-950/10 border border-yellow-900/30 rounded-2xl p-6">
             <h3 className="text-lg font-black text-yellow-500 uppercase tracking-widest mb-4">Redundancy Audit</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                    <thead className="bg-yellow-900/20 text-yellow-300 uppercase font-black">
                        <tr>
                            <th className="px-4 py-3 text-left">Duplicate Setting</th>
                            <th className="px-4 py-3 text-left">Configured Value</th>
                            <th className="px-4 py-3 text-left">Redundant Sources</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {overlaps.map((f, i) => (
                            <tr key={i} className="hover:bg-yellow-900/5">
                                <td className="px-4 py-4 font-mono font-bold text-gray-200">{f.setting}</td>
                                <td className="px-4 py-4 text-cyan-400 font-mono">{f.policies[0].value}</td>
                                <td className="px-4 py-4 text-gray-500 italic">
                                    {f.policies.map(p => p.name).join(', ')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    </div>
  );

  const renderPhase3 = () => (
    <div className="space-y-12">
        <SectionHeader 
            title="Cloud Modernization Roadmap" 
            subtitle="Phase 3: Intune Handover & Forest Hygiene"
            summary="Detection of Intune-ready settings and final domain cleanup. Preparing the environment for system team handover."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analysis.gpoDetails.map((gpo, idx) => (
                <div key={idx} className={`p-6 rounded-2xl border ${gpo.intuneReady ? 'bg-cyan-900/10 border-cyan-500/30 shadow-lg' : 'bg-slate-900/40 border-white/5'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-gray-200 font-mono text-sm truncate pr-4">{gpo.name}</h3>
                        {gpo.intuneReady && <span className="bg-green-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">Intune Ready</span>}
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500 uppercase font-black">Performance Profile</span>
                            <span className={`font-bold ${gpo.performanceImpact === 'High' ? 'text-red-400' : 'text-green-400'}`}>{gpo.performanceImpact || 'Low'} Impact</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500 uppercase font-black">Modernization Class</span>
                            <span className="text-cyan-400">{gpo.intuneReady ? 'Cloud Direct' : 'Legacy Required'}</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-[10px] text-gray-400 leading-relaxed italic truncate">Target OU: {gpo.linkedOUs[0] || 'Unlinked Root'}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="max-w-[100%] mx-auto animate-fade-in pb-20 px-4 print:bg-white print:text-black print:p-0" onMouseMove={handleMouseMove}>
      <style>{`
        @media print {
          #app-background, footer, header, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>
      
      <div className="mb-10 flex items-center justify-between no-print">
        <button onClick={onBack} className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors font-bold uppercase text-xs tracking-widest">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Return to Console
        </button>
        <div className="flex space-x-4">
             <button onClick={() => window.print()} className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest">
                <PrintIcon className="w-4 h-4 mr-2" /> Export PDF Report
             </button>
            <div className="text-right">
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Forensic Audit: Phase 0{activePhase}</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Carlisle Policy Intelligence Core</p>
            </div>
        </div>
      </div>

      {/* Settings Tooltip */}
      {hoveredGpo && (
        <div 
          className="fixed z-50 pointer-events-none no-print"
          style={{ 
            left: Math.min(mousePos.x + 20, window.innerWidth - 420), 
            top: Math.min(mousePos.y + 20, window.innerHeight - 320) 
          }}
        >
          <div className="bg-slate-900 border border-cyan-500/50 rounded-xl shadow-2xl p-4 w-[400px] max-h-[300px] overflow-y-auto custom-scrollbar backdrop-blur-xl">
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2">Policy Configuration Payload</p>
            <p className="text-white font-bold text-xs mb-3 border-b border-white/10 pb-2">{hoveredGpo.name}</p>
            <div className="space-y-2">
              {hoveredGpo.configuredSettings && hoveredGpo.configuredSettings.length > 0 ? (
                hoveredGpo.configuredSettings.map((s, i) => (
                  <div key={i} className="bg-black/40 p-2 rounded border border-white/5">
                    <p className="text-[10px] text-gray-300 font-bold leading-tight">{s.name}</p>
                    <p className="text-[10px] font-mono text-cyan-300 mt-1 break-all">Value: {s.value}</p>
                    <p className="text-[9px] text-gray-500 uppercase mt-0.5">{s.policyType || 'Setting'}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">No detailed setting data available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase Conditional Rendering */}
      {activePhase === 1 && renderPhase1()}
      {activePhase === 2 && renderPhase2()}
      {activePhase === 3 && renderPhase3()}
      
      {/* Universal Signature Footer */}
      <div className="mt-20 pt-10 border-t border-white/10 text-center text-gray-600 print:text-black">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Forensic Scan Verified by Carlisle Intelligence Core</p>
        <p className="text-[9px] mt-2 opacity-50 font-mono">D_GIBSON_PROJECT_ID: FOREST_SCAN_00{activePhase} // END_OF_FEB_EXPIRY</p>
      </div>
    </div>
  );
};
