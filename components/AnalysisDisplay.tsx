
import React, { useState } from 'react';
import type { Analysis, GpoDetails, AnalysisStats, RoadmapAction } from '../types';
import { RelationshipMatrix } from './RelationshipMatrix';
import { DetailedAuditView } from './DetailedAuditView';

const CloudIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
  </svg>
);

const ActionBadge: React.FC<{ action: RoadmapAction['actionType'] }> = ({ action }) => {
    const colors = {
        'Merge/Consolidate': 'bg-cyan-900/40 text-cyan-300 border-cyan-500/50',
        'Migrate': 'bg-blue-900/40 text-blue-300 border-blue-500/50',
        'Evaluate': 'bg-yellow-900/40 text-yellow-300 border-yellow-500/50',
        'Retire': 'bg-red-900/40 text-red-300 border-red-500/50'
    };
    return (
        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter border ${colors[action]}`}>
            {action}
        </span>
    );
};

const RoadmapTable: React.FC<{ actions: RoadmapAction[]; accentColor: string }> = ({ actions, accentColor }) => {
    if (!actions || actions.length === 0) return (
        <div className="p-12 text-center text-gray-500 bg-black/20 rounded-2xl border border-white/5 font-mono text-sm">
            NO ACTION NODES DETECTED FOR THIS PHASE
        </div>
    );
    return (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/20 shadow-2xl animate-fade-in">
            <table className="min-w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/5">
                    <tr>
                        <th className="px-6 py-4 font-black uppercase text-gray-400 tracking-wider w-40">Action Type</th>
                        <th className="px-6 py-4 font-black uppercase text-gray-400 tracking-wider">Target Node</th>
                        <th className="px-6 py-4 font-black uppercase text-gray-400 tracking-wider">Involved Source(s)</th>
                        <th className="px-6 py-4 font-black uppercase text-gray-400 tracking-wider">Strategic Logic</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {actions.map((action, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4">
                                <ActionBadge action={action.actionType} />
                            </td>
                            <td className="px-6 py-4 font-mono text-gray-300 group-hover:text-white break-all">
                                {action.targetName || action.primaryGpo}
                            </td>
                            <td className="px-6 py-4 font-mono text-gray-500 break-all leading-relaxed">
                                {action.secondaryGpos && action.secondaryGpos.length > 0 ? (
                                    <ul className="list-disc list-inside">
                                        {action.secondaryGpos.map((g, idx) => <li key={idx}>{g}</li>)}
                                    </ul>
                                ) : action.primaryGpo}
                            </td>
                            <td className="px-6 py-4 text-gray-400 leading-relaxed max-w-md">
                                {action.details}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const Dashboard: React.FC<{ stats: AnalysisStats }> = ({ stats }) => {
    const statItems = [
        { label: "Analyzed Policies", value: stats.totalGpos, color: "text-gray-100" },
        { label: "Intune Ready", value: stats.intuneReadyCount || 0, color: "text-cyan-400" },
        { label: "Security Risks", value: stats.securityAlerts || 0, color: "text-red-500" },
        { label: "Merge Opportunities", value: stats.consolidationOpportunities, color: "text-sky-400" },
    ];
    return (
        <div className="mb-10 p-6 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/5 shadow-inner">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                {statItems.map(item => (
                    <div key={item.label} className="bg-slate-900/60 p-5 rounded-2xl border border-white/5">
                        <p className={`text-4xl font-black ${item.color} tracking-tighter`}>{item.value}</p>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">{item.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const AnalysisDisplay: React.FC<{ analysis: Analysis }> = ({ analysis }) => {
  const [activePhase, setActivePhase] = useState<1 | 2 | 3>(1);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isDetailedAuditOpen, setIsDetailedAuditOpen] = useState(false);

  if (isDetailedAuditOpen) {
    return <DetailedAuditView analysis={analysis} activePhase={activePhase} onBack={() => setIsDetailedAuditOpen(false)} />;
  }

  const phaseMeta = {
    1: { title: "Consolidation & Shrinkage", subtitle: "Phase 1: Build Technology Masters", color: "bg-cyan-600", actions: analysis.roadmap?.phase1 || [] },
    2: { title: "Structural Integrity", subtitle: "Phase 2: Precedence & Conflict Fixing", color: "bg-blue-600", actions: analysis.roadmap?.phase2 || [] },
    3: { title: "Intune Modernization", subtitle: "Phase 3: Cloud Ready Handover", color: "bg-indigo-600", actions: analysis.roadmap?.phase3 || [] }
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-3xl rounded-3xl border border-white/5 p-6 sm:p-10 animate-fade-in">
      <div className="flex items-center justify-between mb-10 flex-wrap gap-6">
          <div>
            <h2 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.5em] mb-1">Confidential Forensic Roadmap</h2>
            <h2 className="text-3xl font-black text-gray-100 tracking-tighter uppercase">Forest Forensic Insight</h2>
          </div>
          <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsMapOpen(true)}
                className="inline-flex items-center px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl transition-all text-xs font-black uppercase tracking-widest border border-white/10"
              >
                Visual Map
              </button>
              <button 
                onClick={() => setIsDetailedAuditOpen(true)}
                className="inline-flex items-center px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl transition-all text-xs font-black uppercase tracking-[0.2em]"
              >
                C-Level Forensic Audit
              </button>
          </div>
      </div>
      
      <Dashboard stats={analysis.stats} />

      <div className="prose prose-invert prose-sm text-gray-400 max-w-none mb-12 p-8 bg-black/40 rounded-2xl border border-white/5">
        <p className="text-[11px] font-black text-cyan-600 uppercase tracking-[0.3em] mb-4">Domain Strategic Briefing</p>
        <p className="text-lg text-gray-200 leading-relaxed font-medium">{analysis.summary}</p>
      </div>

      {/* Phase Tabs */}
      <div className="mt-12">
        <div className="flex space-x-2 p-1.5 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 mb-8 inline-flex">
            {[1, 2, 3].map((num) => (
                <button
                    key={num}
                    onClick={() => setActivePhase(num as any)}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activePhase === num 
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' 
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                >
                    Phase 0{num}
                </button>
            ))}
        </div>

        <div className="animate-fade-in">
             <div className="flex items-center mb-6">
                <div className={`w-12 h-12 rounded-2xl ${phaseMeta[activePhase].color} flex items-center justify-center mr-5 border border-white/10 shadow-xl`}>
                    <span className="text-white font-black text-2xl">0{activePhase}</span>
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{phaseMeta[activePhase].title}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">{phaseMeta[activePhase].subtitle}</p>
                </div>
            </div>
            
            <RoadmapTable actions={phaseMeta[activePhase].actions} accentColor={phaseMeta[activePhase].color} />
        </div>
      </div>

      {/* Intune Specific Migration Hub - Only show if relevant to phase 3 or has data */}
      {(activePhase === 3 || analysis.stats.intuneReadyCount > 0) && (
        <div className="mt-14 p-8 bg-cyan-900/10 border border-cyan-500/20 rounded-3xl animate-fade-in">
            <div className="flex items-center mb-8">
                 <CloudIcon className="w-10 h-10 text-cyan-400 mr-5" />
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Intune Migration Hub (Phase 3)</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Optimized Cloud Transition Candidates</p>
                 </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analysis.gpoDetails.filter(g => g.intuneReady).map((gpo, i) => (
                    <div key={i} className="bg-black/60 p-5 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-cyan-500/30 transition-all">
                        <span className="font-mono text-cyan-300 text-sm group-hover:text-white transition-colors">{gpo.name}</span>
                        <span className="text-[10px] font-black text-green-500 uppercase border border-green-500/30 px-3 py-1 rounded-full bg-green-950/20">Ready</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      {isMapOpen && (
        <RelationshipMatrix 
            findings={analysis.findings} 
            gpoNames={analysis.gpoDetails.map(d => d.name)} 
            isOpen={isMapOpen} 
            onClose={() => setIsMapOpen(false)} 
        />
      )}
    </div>
  );
};
