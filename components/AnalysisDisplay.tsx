
import React, { useState, useMemo } from 'react';
import type { Analysis, GpoFinding, GpoConsolidation, GpoDocumentation } from '../types';
import { RelationshipMatrix } from './RelationshipMatrix';
import { ResolutionModal } from './ResolutionModal';
import { ConsolidationModal } from './ConsolidationModal';
import { AnalyzedGpoList } from './AnalyzedGpoList';
import { ReportToolbar } from './ReportToolbar';

// --- ICONS ---
const MergeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25z" />
    </svg>
);
const BoltIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
);
const DocIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const PolicyStateIcon: React.FC<{ state: 'Enabled' | 'Disabled' | 'Value' }> = ({ state }) => {
    switch(state) {
        case 'Enabled': return <div className="w-2 h-2 rounded-full bg-green-400 mr-2" />;
        case 'Disabled': return <div className="w-2 h-2 rounded-full bg-red-400 mr-2" />;
        default: return <div className="w-2 h-2 rounded-full bg-gray-400 mr-2" />;
    }
};

const IntelligenceDirectives: React.FC<{ summary: string }> = ({ summary }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const directives = useMemo(() => {
        return summary
            .split(/[.!?]/)
            .map(s => s.trim())
            .filter(s => s.length > 20)
            .slice(0, 4);
    }, [summary]);

    return (
        <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-5 mb-8 relative overflow-hidden group/directives shadow-xl">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover/directives:opacity-20 transition-opacity">
                <BoltIcon className="w-16 h-16 text-cyan-400" />
            </div>
            
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 flex items-center">
                    <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full mr-3 animate-pulse shadow-[0_0_8px_rgba(6,182,212,1)]" />
                    Forensic Findings Directive
                </h3>
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-[10px] font-black text-gray-500 hover:text-cyan-400 uppercase tracking-widest transition-colors flex items-center"
                >
                    {isExpanded ? 'Minimize Analysis' : 'Expand Narrative'}
                    <span className={`ml-2 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                {directives.map((text, i) => (
                    <div key={i} className="flex items-start group/item">
                        <span className="text-cyan-500 mr-3 font-mono font-black text-sm group-hover/item:translate-x-1 transition-transform">»</span>
                        <p className="text-xs text-gray-300 leading-relaxed font-medium uppercase tracking-tight">{text}.</p>
                    </div>
                ))}
            </div>

            {isExpanded && (
                <div className="mt-6 pt-6 border-t border-white/5 animate-fade-in">
                    <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-cyan-500/30 pl-4">
                        {summary}
                    </p>
                </div>
            )}
        </div>
    );
};

const DocumentationPanel: React.FC<{ doc: GpoDocumentation, context: string }> = ({ doc, context }) => {
    return (
        <div className="mt-4 p-5 bg-slate-950/60 border border-white/5 rounded-2xl animate-fade-in">
            <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4 flex items-center">
                <DocIcon className="w-3 h-3 mr-2" /> Forensic Documentation Brief
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Pain Point & Risk</span>
                    <p className="text-[11px] text-red-400/80 leading-relaxed">{doc.painPoint}</p>
                </div>
                <div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Impact of Resolution</span>
                    <p className="text-[11px] text-green-400/80 leading-relaxed">{doc.impact}</p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
                <span className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Technical Briefing</span>
                <p className="text-[11px] text-gray-300 leading-relaxed">{doc.technicalBrief}</p>
            </div>

            {doc.suggestedName && (
                <div className="mt-4 flex gap-4">
                    <div className="bg-cyan-500/5 px-3 py-2 rounded-lg border border-cyan-500/10">
                        <span className="text-[8px] text-gray-500 block uppercase mb-0.5">Recommended Name</span>
                        <span className="text-[10px] font-mono text-cyan-300">{doc.suggestedName}</span>
                    </div>
                    {doc.classification && (
                        <div className="bg-indigo-500/5 px-3 py-2 rounded-lg border border-indigo-500/10">
                            <span className="text-[8px] text-gray-500 block uppercase mb-0.5">Classification</span>
                            <span className="text-[10px] font-mono text-indigo-300">{doc.classification}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const StatCard: React.FC<{ label: string, value: number | string, color: string, subtext?: string }> = ({ label, value, color, subtext }) => (
    <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-center hover:bg-slate-800/60 transition-colors group">
        <p className={`text-3xl font-black ${color} group-hover:scale-105 transition-transform origin-left`}>{value}</p>
        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-1 group-hover:text-gray-400 transition-colors">{label}</p>
        {subtext && <p className="text-[8px] text-cyan-500/60 font-mono mt-1.5">{subtext}</p>}
    </div>
);

export const AnalysisDisplay: React.FC<{ analysis: Analysis }> = ({ analysis }) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<GpoFinding | null>(null);
  const [selectedConsolidation, setSelectedConsolidation] = useState<GpoConsolidation | null>(null);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  const stats = analysis.stats;

  return (
    <div className="max-w-[100%] mx-auto animate-fade-in pb-20">
      <div className="mb-8">
          <ReportToolbar 
            analysis={analysis} 
            onClearSession={() => window.location.reload()} 
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Intelligence Data Feed */}
        <div className="lg:col-span-8 space-y-8">
          
          <IntelligenceDirectives summary={analysis.summary} />

          {/* High Priority Consolidation Targets */}
          {analysis.consolidation && analysis.consolidation.length > 0 && (
            <section className="bg-slate-950/40 backdrop-blur-3xl rounded-3xl border border-sky-500/20 overflow-hidden shadow-2xl">
              <div className="px-6 py-4 bg-sky-950/20 border-b border-sky-500/10 flex justify-between items-center">
                <div className="flex items-center">
                    <MergeIcon className="w-5 h-5 text-sky-400 mr-3" />
                    <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Consolidation Pathways</h2>
                </div>
                <div className="flex space-x-2">
                    <span className="text-[8px] font-black px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/20 uppercase tracking-widest">Efficiency Target</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {analysis.consolidation.map((item, idx) => {
                    const docId = `cons-${idx}`;
                    return (
                        <div key={idx} className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-sky-500/40 transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-100 font-bold group-hover:text-sky-300 transition-colors leading-tight">{item.recommendation}</p>
                                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">{item.reason}</p>
                                </div>
                                <button 
                                    onClick={() => setExpandedDocId(expandedDocId === docId ? null : docId)}
                                    className={`ml-4 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${expandedDocId === docId ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-800 border-white/10 text-gray-500 hover:text-cyan-400'}`}
                                >
                                    {expandedDocId === docId ? 'Close Brief' : 'Doc Brief'}
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {item.mergeCandidates.map(c => (
                                    <span key={c} className="text-[9px] font-mono px-2 py-1 bg-black/40 rounded-lg border border-white/5 text-sky-400/80 truncate max-w-[160px]" title={c}>{c}</span>
                                ))}
                            </div>

                            {expandedDocId === docId && item.documentation && (
                                <DocumentationPanel doc={item.documentation} context="Consolidation Strategy" />
                            )}

                            <div className="flex justify-end mt-4">
                                <button 
                                    onClick={() => setSelectedConsolidation(item)}
                                    className="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em] flex items-center hover:text-white transition-all"
                                >
                                    View Logic Plan <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
              </div>
            </section>
          )}

          {/* Forensic Settings Feed */}
          <section className="bg-slate-950/40 backdrop-blur-3xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
             <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-gray-900/20">
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Forensic Logic Trace</h2>
                <button 
                    onClick={() => setIsMapOpen(true)}
                    className="text-[10px] font-black text-cyan-400 uppercase tracking-widest hover:text-white transition-colors"
                >
                    Dependency Graph
                </button>
             </div>
             <div className="divide-y divide-white/5">
                {analysis.findings.length > 0 ? analysis.findings.map((finding, idx) => {
                    const docId = `finding-${idx}`;
                    return (
                        <div 
                            key={idx} 
                            className="p-6 hover:bg-cyan-500/5 transition-all group relative"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${finding.type === 'Conflict' ? 'bg-red-900/40 text-red-400 border border-red-500/20' : 'bg-yellow-900/40 text-yellow-400 border border-yellow-500/20'}`}>
                                        {finding.type}
                                    </span>
                                    <span className="text-[9px] font-mono text-gray-600 uppercase tracking-tighter bg-black/30 px-2 py-1 rounded-md border border-white/5">{finding.policies.length} VECTORS</span>
                                </div>
                                <button 
                                    onClick={() => setExpandedDocId(expandedDocId === docId ? null : docId)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${expandedDocId === docId ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-800 border-white/10 text-gray-500 hover:text-cyan-400'}`}
                                >
                                    {expandedDocId === docId ? 'Hide Documentation' : 'Documentation Brief'}
                                </button>
                            </div>
                            
                            <h4 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors break-words mb-3 leading-tight">{finding.setting}</h4>
                            
                            <div className="flex items-center flex-wrap gap-4 mb-4">
                               {finding.policies.slice(0, 3).map((p, i) => (
                                   <div key={i} className="flex items-center text-[10px] text-gray-500 max-w-[240px]">
                                      <PolicyStateIcon state={p.policyState} />
                                      <span className="truncate opacity-80">{p.name} ({p.value})</span>
                                   </div>
                               ))}
                            </div>

                            {expandedDocId === docId && finding.documentation && (
                                <DocumentationPanel doc={finding.documentation} context={`${finding.type} Deviation`} />
                            )}

                            <div className="flex justify-end pt-4">
                                <button 
                                    onClick={() => setSelectedFinding(finding)}
                                    className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] flex items-center hover:text-white transition-all"
                                >
                                    Deep Investigation <span className="ml-2">→</span>
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="p-20 text-center opacity-40">
                        <p className="text-sm font-mono tracking-widest uppercase">No Forensic Deviations Detected</p>
                    </div>
                )}
             </div>
          </section>
        </div>

        {/* Right Column: Vitals Sidebar (Sticky) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
           
          <div className="grid grid-cols-2 gap-4">
              <StatCard label="Audited GPOs" value={stats.totalGpos} color="text-cyan-400" />
              <StatCard label="Consolidation" value={stats.consolidationOpportunities} color="text-sky-400" />
              <StatCard label="Security Risks" value={stats.securityAlerts || 0} color="text-red-500" />
              <StatCard label="Logic Errors" value={stats.highSeverityConflicts + stats.mediumSeverityConflicts} color="text-orange-400" />
          </div>

          <AnalyzedGpoList analysis={analysis} />

          <div className="p-6 bg-slate-900/40 rounded-3xl border border-white/5 text-[9px] text-gray-600 font-mono tracking-widest text-center uppercase">
              SCAN_INTEGRITY_VERIFIED &bull; ID: {Math.random().toString(36).substring(7).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Forensic Modals */}
      <RelationshipMatrix 
            findings={analysis.findings} 
            gpoNames={analysis.gpoDetails.map(g => g.name)}
            isOpen={isMapOpen}
            onClose={() => setIsMapOpen(false)}
      />
      <ResolutionModal
            isOpen={!!selectedFinding}
            onClose={() => setSelectedFinding(null)}
            finding={selectedFinding}
            gpoDetails={analysis.gpoDetails}
      />
      <ConsolidationModal
            isOpen={!!selectedConsolidation}
            onClose={() => setSelectedConsolidation(null)}
            consolidation={selectedConsolidation}
            gpoDetails={analysis.gpoDetails}
            allFindings={analysis.findings}
      />
    </div>
  );
};
