
import React, { useState, useEffect, useMemo } from 'react';
import type { GpoConsolidation, GpoDetails, GpoFinding } from '../types';

interface ConsolidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  consolidation: GpoConsolidation | null;
  gpoDetails: GpoDetails[];
  allFindings: GpoFinding[];
  initialTab?: 'compare' | 'plan';
}

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MergeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25z" />
    </svg>
);

const DocumentTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const ClipboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
);

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
  </svg>
);

export const ConsolidationModal: React.FC<ConsolidationModalProps> = ({ isOpen, onClose, consolidation, gpoDetails, allFindings, initialTab = 'compare' }) => {
  const [activeTab, setActiveTab] = useState<'compare' | 'plan'>(initialTab);
  const [copiedManual, setCopiedManual] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Derive shared issues for the modal
  const { sharedIssues, comparisonSettings } = useMemo(() => {
      if (!consolidation) return { sharedIssues: { conflicts: 0, overlaps: 0 }, comparisonSettings: [] };
      
      const involved = new Set(consolidation.mergeCandidates);
      let conflicts = 0;
      let overlaps = 0;
      const settingsList: { name: string, type: 'Conflict'|'Overlap', values: Record<string, string> }[] = [];

      allFindings.forEach(f => {
          // Check if at least 1 of the involved policies are in this finding
          const relevantPolicies = f.policies.filter(p => involved.has(p.name));
          if (relevantPolicies.length >= 1) {
              if (f.type === 'Conflict') conflicts++;
              else overlaps++;

              const values: Record<string, string> = {};
              // Populate values from finding policies
              f.policies.forEach(p => {
                  if (involved.has(p.name)) {
                      values[p.name] = p.value;
                  }
              });

              settingsList.push({
                  name: f.setting,
                  type: f.type,
                  values
              });
          }
      });
      return { sharedIssues: { conflicts, overlaps }, comparisonSettings: settingsList };
  }, [consolidation, allFindings]);

  const handleCopyManual = () => {
      if (consolidation?.manualSteps) {
          navigator.clipboard.writeText(consolidation.manualSteps);
          setCopiedManual(true);
          setTimeout(() => setCopiedManual(false), 2000);
      }
  };

  if (!isOpen || !consolidation) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 border border-sky-500 rounded-xl shadow-2xl w-full max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800/50">
           <div className="flex items-center">
               <div className="bg-sky-900/30 p-2 rounded-lg mr-4 border border-sky-500/30">
                   <MergeIcon className="w-6 h-6 text-sky-400" />
               </div>
               <div>
                   <h2 className="text-xl font-bold text-gray-100">Consolidation Opportunity</h2>
                   <p className="text-sm text-gray-400">Comparing {consolidation.mergeCandidates.length} GPOs for merge suitability.</p>
               </div>
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
               <XIcon className="w-6 h-6" />
           </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-900/50">
            <button 
                onClick={() => setActiveTab('compare')}
                className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'compare' ? 'border-sky-500 text-sky-400 bg-sky-900/10' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
            >
                1. Side-by-Side Comparison
            </button>
            <button 
                onClick={() => setActiveTab('plan')}
                className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'plan' ? 'border-green-500 text-green-400 bg-green-900/10' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
            >
                2. Merge Plan & Justification
            </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 bg-black/20">
            {activeTab === 'compare' && (
                <div className="space-y-6 animate-fade-in">
                    
                    {/* Shared Issues Summary */}
                    <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                         <div>
                             <p className="text-gray-300 font-medium">Why consolidate these?</p>
                             <p className="text-sm text-gray-500">Based on analysis of settings shared between these GPOs.</p>
                         </div>
                         <div className="flex space-x-4">
                             <div className="text-center px-4 border-r border-gray-700">
                                 <span className="block text-2xl font-bold text-red-400">{sharedIssues.conflicts}</span>
                                 <span className="text-xs text-gray-500 uppercase">Conflicts</span>
                             </div>
                             <div className="text-center px-4">
                                 <span className="block text-2xl font-bold text-yellow-400">{sharedIssues.overlaps}</span>
                                 <span className="text-xs text-gray-500 uppercase">Overlaps</span>
                             </div>
                         </div>
                    </div>

                    {/* Comparison Table */}
                    {/* Used max-h-[65vh] and sticky headers to keep location visible while scrolling */}
                    <div className="overflow-auto rounded-lg border border-gray-700 max-h-[65vh]">
                        <table className="min-w-full text-sm text-left border-collapse">
                            <thead className="bg-gray-800 text-xs text-gray-400 uppercase tracking-wider sticky top-0 z-20 shadow-md">
                                <tr>
                                    <th className="px-4 py-3 border-r border-gray-700 w-64 bg-gray-900 sticky left-0 z-30 align-top">Feature</th>
                                    {consolidation.mergeCandidates.map((gpo, idx) => {
                                        const details = gpoDetails.find(d => d.name === gpo);
                                        return (
                                            <th key={idx} className="px-4 py-3 min-w-[220px] border-r border-gray-700 last:border-none break-words align-top bg-gray-800">
                                                <div className="text-sm font-bold text-white mb-2">{gpo}</div>
                                                {/* Added Location (Linked OUs) to header for easy GPMC lookup */}
                                                {details?.linkedOUs && details.linkedOUs.length > 0 ? (
                                                    <div className="bg-black/30 rounded p-1.5 border border-gray-700/50">
                                                        <span className="text-[10px] text-sky-400 font-bold uppercase block mb-1">GPMC Location</span>
                                                        <ul className="space-y-1">
                                                            {details.linkedOUs.map((ou, i) => (
                                                                <li key={i} className="text-[10px] text-gray-400 font-mono break-all leading-tight">
                                                                    {ou}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-gray-500 italic mt-1 bg-black/20 p-1.5 rounded">No Links Found</div>
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="bg-gray-900/50 divide-y divide-gray-800">
                                {/* Security Filtering Row */}
                                <tr>
                                    <td className="px-4 py-4 font-bold text-gray-300 border-r border-gray-700 bg-gray-900 sticky left-0 z-10 align-top">Security Filtering</td>
                                    {consolidation.mergeCandidates.map((gpo, idx) => {
                                        const details = gpoDetails.find(d => d.name === gpo);
                                        return (
                                            <td key={idx} className="px-4 py-4 align-top border-r border-gray-700 last:border-none">
                                                 {details?.securityFiltering && details.securityFiltering.length > 0 ? (
                                                     <div className="flex flex-wrap gap-1">
                                                        {details.securityFiltering.map(sf => (
                                                            <span key={sf} className="bg-gray-800 text-gray-300 border border-gray-600 px-1.5 py-0.5 rounded text-xs font-mono break-words">
                                                                {sf}
                                                            </span>
                                                        ))}
                                                     </div>
                                                ) : <span className="text-gray-500 text-xs">Authenticated Users</span>}
                                            </td>
                                        );
                                    })}
                                </tr>
                                {/* Delegation Row */}
                                <tr>
                                    <td className="px-4 py-4 font-bold text-gray-300 border-r border-gray-700 bg-gray-900 sticky left-0 z-10 align-top">Delegation</td>
                                    {consolidation.mergeCandidates.map((gpo, idx) => {
                                        const details = gpoDetails.find(d => d.name === gpo);
                                        return (
                                            <td key={idx} className="px-4 py-4 align-top border-r border-gray-700 last:border-none">
                                                 {details?.delegation && details.delegation.length > 0 ? (
                                                     <ul className="list-disc list-inside space-y-1">
                                                        {details.delegation.map((del, i) => (
                                                            <li key={i} className="text-xs text-gray-400 break-words" title={del}>
                                                                {del}
                                                            </li>
                                                        ))}
                                                     </ul>
                                                ) : <span className="text-gray-600 text-xs italic">Default</span>}
                                            </td>
                                        );
                                    })}
                                </tr>
                                
                                {/* Settings Comparison Rows */}
                                {comparisonSettings.length > 0 && (
                                    <>
                                        <tr>
                                            <td colSpan={consolidation.mergeCandidates.length + 1} className="px-4 py-2 bg-gray-800 font-bold text-xs text-gray-400 uppercase tracking-wider border-y border-gray-700 sticky left-0 z-10">
                                                Identified Settings ({comparisonSettings.length})
                                            </td>
                                        </tr>
                                        {comparisonSettings.map((setting, idx) => (
                                            <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-300 border-r border-gray-700 bg-gray-900 sticky left-0 z-10 align-top">
                                                    <div className="break-words font-bold">{setting.name}</div>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block ${setting.type === 'Conflict' ? 'bg-red-900/50 text-red-300' : 'bg-yellow-900/50 text-yellow-300'}`}>
                                                        {setting.type}
                                                    </span>
                                                </td>
                                                {consolidation.mergeCandidates.map((gpo, gpoIdx) => (
                                                    <td key={gpoIdx} className="px-4 py-3 border-r border-gray-700 last:border-none font-mono text-xs text-gray-400 break-all align-top">
                                                        {setting.values[gpo] ? (
                                                            <span className="text-cyan-200">{setting.values[gpo]}</span>
                                                        ) : (
                                                            <span className="text-gray-600 italic">Not Configured</span>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'plan' && (
                 <div className="space-y-6 animate-fade-in">
                    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4">Strategic Recommendation</h3>
                        <p className="text-gray-300 leading-relaxed text-base mb-6">
                            {consolidation.recommendation}
                        </p>
                        
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Justification</h4>
                        <div className="bg-gray-900/50 p-4 rounded border-l-4 border-sky-500">
                             <p className="text-gray-300 text-sm">
                                {consolidation.reason}
                             </p>
                        </div>
                    </div>

                    {/* Manual Consolidation Guide */}
                    {consolidation.manualSteps && (
                        <div className="space-y-2">
                             <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                                    <DocumentTextIcon className="w-5 h-5 mr-2 text-cyan-400" />
                                    Manual Consolidation Guide (GPMC)
                                </h3>
                                <button
                                    onClick={handleCopyManual}
                                    className="flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-xs font-medium transition-colors text-cyan-300 border border-cyan-800/50"
                                >
                                    {copiedManual ? (
                                        <>
                                            <CheckCircleIcon className="w-4 h-4 mr-1.5 text-green-400" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <ClipboardIcon className="w-4 h-4 mr-1.5" />
                                            Copy Instructions
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">
                                {consolidation.manualSteps}
                            </div>
                        </div>
                    )}
                 </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-gray-900 border-t border-gray-800 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-colors">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};
