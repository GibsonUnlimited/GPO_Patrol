
import React, { useState, useEffect } from 'react';
import type { GpoFinding, GpoDetails } from '../types';

interface ResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  finding: GpoFinding | null;
  gpoDetails: GpoDetails[];
  initialTab?: 'inspect' | 'resolve';
}

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
  </svg>
);

const ClipboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
);

const DocumentTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

export const ResolutionModal: React.FC<ResolutionModalProps> = ({ isOpen, onClose, finding, gpoDetails, initialTab = 'inspect' }) => {
  const [activeTab, setActiveTab] = useState<'inspect' | 'resolve'>(initialTab);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedManual, setCopiedManual] = useState(false);
  const [copiedGpo, setCopiedGpo] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen || !finding) return null;

  const handleCopyScript = () => {
    if (finding.resolutionScript) {
        navigator.clipboard.writeText(finding.resolutionScript);
        setCopiedScript(true);
        setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  const handleCopyManual = () => {
      if (finding.manualSteps) {
          navigator.clipboard.writeText(finding.manualSteps);
          setCopiedManual(true);
          setTimeout(() => setCopiedManual(false), 2000);
      }
  };

  const handleCopyGpoDetails = (policyName: string) => {
    const details = gpoDetails.find(d => d.name === policyName);
    if (!details) return;

    const text = [
        `GPO Name: ${details.name}`,
        `Linked OUs: ${details.linkedOUs && details.linkedOUs.length ? '\n  - ' + details.linkedOUs.join('\n  - ') : 'None'}`,
        `Security Filtering: ${details.securityFiltering && details.securityFiltering.length ? '\n  - ' + details.securityFiltering.join('\n  - ') : 'Authenticated Users'}`,
        `Delegation: ${details.delegation && details.delegation.length ? '\n  - ' + details.delegation.join('\n  - ') : 'Default'}`
    ].join('\n');
    
    navigator.clipboard.writeText(text);
    setCopiedGpo(policyName);
    setTimeout(() => setCopiedGpo(null), 2000);
  };

  const isConflict = finding.type === 'Conflict';
  const severityColor = isConflict 
    ? (finding.severity === 'High' ? 'text-red-400' : 'text-orange-400')
    : 'text-yellow-400';
  const borderColor = isConflict
    ? (finding.severity === 'High' ? 'border-red-500' : 'border-orange-500')
    : 'border-yellow-500';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className={`bg-gray-900 border ${borderColor} rounded-xl shadow-2xl w-full max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden`} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800/50">
           <div>
               <div className="flex items-center space-x-3 mb-1">
                   <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isConflict ? 'bg-red-900/40 text-red-300' : 'bg-yellow-900/40 text-yellow-300'}`}>
                       {finding.type}
                   </span>
                   {finding.severity && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${finding.severity === 'High' ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'}`}>
                            {finding.severity} Severity
                        </span>
                   )}
               </div>
               <h2 className="text-xl font-bold text-gray-100 break-words">{finding.setting}</h2>
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
               <XIcon className="w-6 h-6" />
           </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-900/50">
            <button 
                onClick={() => setActiveTab('inspect')}
                className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'inspect' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/10' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
            >
                1. Inspect Source & Exposure
            </button>
            <button 
                onClick={() => setActiveTab('resolve')}
                className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'resolve' ? 'border-green-500 text-green-400 bg-green-900/10' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
            >
                2. Resolution Plan
            </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 bg-black/20">
            {activeTab === 'inspect' && (
                <div className="space-y-8 animate-fade-in">
                    
                    {/* Visual Exposure Map */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-400 flex items-center justify-center text-xs mr-2 border border-cyan-700">A</span>
                            Where is this setting exposed?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {finding.policies.map((policy, idx) => {
                                const details = gpoDetails.find(d => d.name === policy.name);
                                const isWinner = policy.isWinningPolicy;
                                return (
                                    <div key={idx} className={`relative p-4 rounded-lg border ${isWinner ? 'bg-green-900/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-gray-800/30 border-gray-700'}`}>
                                        
                                        <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
                                            {isWinner && (
                                                <div className="text-[10px] font-bold text-green-400 bg-green-900/30 px-2 py-0.5 rounded border border-green-800 select-none">
                                                    WINNING
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleCopyGpoDetails(policy.name)}
                                                className="p-1 text-gray-400 hover:text-cyan-300 bg-gray-900/50 hover:bg-gray-800 rounded border border-gray-600/50 transition-colors"
                                                title="Copy GPO Details"
                                            >
                                                {copiedGpo === policy.name ? <CheckCircleIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        <div className="font-bold text-gray-200 mb-1 break-words pr-24" title={policy.name}>{policy.name}</div>
                                        <div className="text-xs text-gray-400 mb-3 font-mono">
                                            Value: <span className={isWinner ? 'text-green-300' : 'text-gray-300'}>{policy.value}</span>
                                        </div>
                                        
                                        <div className="border-t border-gray-700 pt-2 mt-2">
                                            <p className="text-xs text-cyan-500 font-semibold mb-1">Target Links (Exposure):</p>
                                            {details?.linkedOUs && details.linkedOUs.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {details.linkedOUs.map(ou => (
                                                        <li key={ou} className="text-[10px] text-gray-400 font-mono break-all pl-2 border-l border-gray-600">
                                                            {ou}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-[10px] text-gray-500 italic">Not currently linked to any OU.</p>
                                            )}
                                        </div>
                                        
                                        <div className="border-t border-gray-700 pt-2 mt-2">
                                            <p className="text-xs text-cyan-500 font-semibold mb-1">Security Filtering:</p>
                                             {details?.securityFiltering && details.securityFiltering.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {details.securityFiltering.map(sf => (
                                                        <li key={sf} className="text-[10px] text-gray-400 font-mono break-all pl-2 border-l border-gray-600">
                                                            {sf}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-[10px] text-gray-500 italic">Authenticated Users</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detailed Comparison Table */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-400 flex items-center justify-center text-xs mr-2 border border-cyan-700">B</span>
                            Detailed Setting Comparison
                        </h3>
                        <div className="overflow-x-auto rounded-lg border border-gray-700">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-800 text-xs text-gray-400 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">GPO Name</th>
                                        <th className="px-4 py-3 min-w-[200px]">Configured Value</th>
                                        <th className="px-4 py-3">Policy State</th>
                                        <th className="px-4 py-3">Outcome</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-900/50 divide-y divide-gray-800">
                                    {finding.policies.map((policy, idx) => (
                                        <tr key={idx} className={policy.isWinningPolicy ? 'bg-green-900/10' : ''}>
                                            <td className="px-4 py-3 font-medium text-gray-200 break-words align-top">{policy.name}</td>
                                            <td className="px-4 py-3 font-mono text-gray-300 break-all align-top">{policy.value}</td>
                                            <td className="px-4 py-3 font-mono align-top">
                                                <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                                                    policy.policyState === 'Enabled' ? 'bg-green-900/30 text-green-400 border border-green-800' :
                                                    policy.policyState === 'Disabled' ? 'bg-red-900/30 text-red-400 border border-red-800' :
                                                    'bg-gray-700 text-gray-300'
                                                }`}>
                                                    {policy.policyState}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                {policy.isWinningPolicy 
                                                    ? <span className="text-green-400 text-xs font-bold flex items-center whitespace-nowrap"><CheckCircleIcon className="w-4 h-4 mr-1"/> Applied</span>
                                                    : <span className="text-gray-500 text-xs whitespace-nowrap">Overwritten</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'resolve' && (
                 <div className="space-y-8 animate-fade-in">
                    
                    {/* Recommendation */}
                    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-5">
                         <h3 className="text-lg font-semibold text-gray-200 mb-2">Recommendation</h3>
                         <p className="text-gray-300 leading-relaxed">{finding.recommendation}</p>
                    </div>
                    
                    {/* Manual Resolution Guide */}
                    {finding.manualSteps && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                                    <DocumentTextIcon className="w-5 h-5 mr-2 text-cyan-400" />
                                    Manual Resolution Guide (GPMC)
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
                                {finding.manualSteps}
                            </div>
                        </div>
                    )}

                    {/* Script */}
                    {finding.resolutionScript ? (
                        <div className="space-y-2">
                             <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-200">PowerShell Resolution Script</h3>
                                <button
                                    onClick={handleCopyScript}
                                    className="flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-xs font-medium transition-colors text-cyan-300 border border-cyan-800/50"
                                >
                                    {copiedScript ? (
                                        <>
                                            <CheckCircleIcon className="w-4 h-4 mr-1.5 text-green-400" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <ClipboardIcon className="w-4 h-4 mr-1.5" />
                                            Copy Script
                                        </>
                                    )}
                                </button>
                             </div>
                             <div className="relative group">
                                <pre className="bg-black p-4 rounded-lg border border-gray-700 text-sm overflow-x-auto whitespace-pre-wrap font-mono text-green-400 shadow-inner">
                                    <code>{finding.resolutionScript}</code>
                                </pre>
                             </div>
                             <p className="text-xs text-gray-500 italic mt-2">
                                * Review all scripts in a test environment before applying to production.
                             </p>
                        </div>
                    ) : (
                        <div className="p-8 text-center border-2 border-dashed border-gray-700 rounded-lg text-gray-500">
                            No automated script available for this finding. Please review the recommendation manually.
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
