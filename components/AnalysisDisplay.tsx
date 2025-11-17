import React, { useState, useMemo } from 'react';
import type { Analysis, GpoFinding, GpoConsolidation, GpoDetails, AnalysisStats } from '../types';

// --- ICONS ---
const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ConflictIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
    </svg>
);
const OverlapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.375 1.5-3 3 0 01-5.25 0 3 3 0 01-.375-1.5V17.25m6 0v1.007a3 3 0 00.375 1.5-3 3 0 005.25 0 3 3 0 00.375-1.5V17.25m-6 0h6M12 12.75h.008v.008H12v-.008z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18.75h12A2.25 2.25 0 0020.25 16.5V7.5A2.25 2.25 0 0018 5.25H6A2.25 2.25 0 003.75 7.5v9A2.25 2.25 0 006 18.75z" />
    </svg>
);
const MergeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25z" />
    </svg>
);
const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);
const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
);
const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
);
const ValueIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
);
const ClipboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
);


// --- SUB-COMPONENTS ---
const CodeBlockWithCopy: React.FC<{ script: string }> = ({ script }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-black/50 p-3 rounded-md text-sm overflow-x-auto whitespace-pre-wrap font-mono">
        <code className="language-powershell text-gray-200">
          {script}
        </code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 flex items-center px-2 py-1 bg-gray-700/80 hover:bg-gray-600 rounded-md text-xs font-medium transition-all duration-200 text-gray-300 opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Copy script"
      >
        {copied ? (
          <>
            <CheckCircleIcon className="w-4 h-4 mr-1.5 text-green-400" />
            Copied
          </>
        ) : (
          <>
            <ClipboardIcon className="w-4 h-4 mr-1.5" />
            Copy
          </>
        )}
      </button>
    </div>
  );
};

const PolicyStateIcon: React.FC<{ state: 'Enabled' | 'Disabled' | 'Value' }> = ({ state }) => {
    switch(state) {
        case 'Enabled': return <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" title="Enabled" />;
        case 'Disabled': return <XCircleIcon className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" title="Disabled" />;
        case 'Value': return <ValueIcon className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" title="Value" />;
        default: return null;
    }
};

const getGlowClass = (type: 'Conflict' | 'Overlap' | 'Consolidation', severity?: 'High' | 'Medium'): string => {
    if (type === 'Conflict') {
        return severity === 'High' 
            ? 'shadow-[0_0_15px_rgba(239,68,68,0.6)]' 
            : 'shadow-[0_0_15px_rgba(239,68,68,0.4)]';
    }
    if (type === 'Overlap') {
        return 'shadow-[0_0_15px_rgba(251,191,36,0.5)]';
    }
    return 'shadow-[0_0_15px_rgba(59,130,246,0.5)]'; // Consolidation
};


interface FindingCardProps {
    finding: GpoFinding;
    gpoDetails: GpoDetails[];
}
const FindingCard: React.FC<FindingCardProps> = ({ finding, gpoDetails }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isConflict = finding.type === 'Conflict';
    const cardBorderColor = isConflict 
      ? (finding.severity === 'High' ? 'border-red-500/80' : 'border-red-600/50') 
      : 'border-yellow-500/50';

    const renderDetailedContent = () => (
        <div className="p-4 space-y-4">
            <div>
                 <p className="text-sm text-gray-400 mb-2">Involved Policies & Security Context</p>
                 <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-2 font-medium">Policy & Links</th>
                                <th className="px-4 py-2 font-medium">Policy State</th>
                                <th className="px-4 py-2 font-medium">Configured Value</th>
                                <th className="px-4 py-2 font-medium">Precedence</th>
                                <th className="px-4 py-2 font-medium">Security</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                            {finding.policies.map((policy, index) => {
                                const details = gpoDetails.find(d => d.name === policy.name);
                                return (
                                    <tr key={index} className={policy.isWinningPolicy ? "bg-cyan-900/30" : ""}>
                                        <td className="px-4 py-3 font-medium text-gray-200 align-top">
                                            <div className="font-bold">{policy.name}</div>
                                            {details?.linkedOUs && details.linkedOUs.length > 0 && (
                                                <div className="text-xs text-gray-400 mt-1 pl-2 border-l-2 border-gray-600">
                                                    <span className="font-semibold text-gray-500 block">Linked:</span>
                                                    <ul className="list-none mt-0.5">
                                                        {details.linkedOUs.map(ou => <li key={ou} className="font-mono truncate" title={ou}>{ou}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-gray-200 align-top whitespace-nowrap">
                                            <div className="flex items-center">
                                                <PolicyStateIcon state={policy.policyState} />
                                                <span>{policy.policyState}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-gray-200 align-top break-all">
                                            {policy.value}
                                        </td>
                                        <td className="px-4 py-3 align-top whitespace-nowrap">
                                            {policy.isWinningPolicy && (
                                                <span className="font-bold text-cyan-300">
                                                    Winning
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top text-xs">
                                            {details?.securityFiltering && details.securityFiltering.length > 0 &&
                                                <div className="mb-2">
                                                    <p className="font-semibold text-gray-400">Filtering:</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {details.securityFiltering.map(sf => <span key={sf} className="bg-gray-700 font-mono text-gray-300 px-1.5 py-0.5 rounded">{sf}</span>)}
                                                    </div>
                                                </div>
                                            }
                                            {details?.delegation && details.delegation.length > 0 &&
                                                <div>
                                                    <p className="font-semibold text-gray-400">Delegation:</p>
                                                    <ul className="list-disc list-inside mt-1">
                                                        {details.delegation.map(d => <li key={d} className="text-gray-300">{d}</li>)}
                                                    </ul>
                                                </div>
                                            }
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
             <div>
                <p className="text-sm text-gray-400 mb-1">Recommendation</p>
                <p className="text-gray-300 text-sm">{finding.recommendation}</p>
            </div>
            {finding.resolutionScript && (
                <div>
                    <p className="text-sm text-gray-400 mb-1">Suggested PowerShell Fix</p>
                    <CodeBlockWithCopy script={finding.resolutionScript} />
                </div>
            )}
        </div>
    );

    return (
        <div 
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div 
                className={`group bg-white/5 backdrop-blur-md rounded-lg border-2 ${cardBorderColor} shadow-lg transition-all duration-300 ease-in-out`}
            >
                <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            {isConflict ? <ConflictIcon className={`w-5 h-5 mr-3 ${finding.severity === 'High' ? 'text-red-400' : 'text-red-500'}`} /> : <OverlapIcon className="w-5 h-5 mr-3 text-yellow-400" />}
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-200">{finding.type}</span>
                                <p className="font-mono text-cyan-300 text-sm truncate max-w-sm md:max-w-md lg:max-w-lg" title={finding.setting}>{finding.setting}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {finding.severity && (
                                <span className={`hidden sm:inline-block text-xs font-bold px-2 py-0.5 rounded-full ${finding.severity === 'High' ? 'bg-red-500/80 text-white' : 'bg-red-400/70 text-black'}`}>
                                    {finding.severity}
                                </span>
                            )}
                            <div className="flex -space-x-2 overflow-hidden">
                               <span className="text-sm text-gray-400">
                                    {finding.policies.length} GPOs
                               </span>
                            </div>
                            <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} />
                        </div>
                    </div>
                </div>
                
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px]' : 'max-h-0'}`}>
                    {renderDetailedContent()}
                </div>
            </div>
            
            {isHovered && !isExpanded && (
                 <div className="absolute left-0 top-full mt-2 w-full max-w-4xl bg-gray-900 border-2 border-cyan-500 rounded-lg shadow-2xl z-20 text-xs animate-fade-in pointer-events-none">
                    {renderDetailedContent()}
                 </div>
            )}
        </div>
    );
};

const ConsolidationCard: React.FC<{ consolidation: GpoConsolidation }> = ({ consolidation }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const renderDetailedContent = () => (
        <div className="p-4 space-y-4">
            <div>
                <p className="text-sm text-gray-400 mb-1">Recommendation</p>
                <p className="text-gray-200 font-medium">{consolidation.recommendation}</p>
            </div>
            <div>
                <p className="text-sm text-gray-400 mb-1">Policies to Merge ({consolidation.mergeCandidates.length})</p>
                <div className="flex flex-wrap gap-2">
                    {consolidation.mergeCandidates.map(name => (
                        <span key={name} className="bg-gray-700 text-gray-300 text-xs font-mono px-2 py-1 rounded">{name}</span>
                    ))}
                </div>
            </div>
            <div>
                <p className="text-sm text-gray-400 mb-1">Justification</p>
                <p className="text-gray-300 text-sm">{consolidation.reason}</p>
            </div>
        </div>
    );
    
    return (
        <div 
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="bg-white/5 backdrop-blur-md rounded-lg border border-sky-500/50 overflow-hidden shadow-lg">
                <div className="px-4 py-3 bg-sky-900/40 text-sky-300 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="flex items-center">
                        <MergeIcon className="w-5 h-5 mr-3" />
                        <span className="font-bold">Consolidation Opportunity</span>
                    </div>
                     <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">
                            {consolidation.mergeCandidates.length} GPOs
                        </span>
                        <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} />
                    </div>
                </div>
                 <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}>
                    {renderDetailedContent()}
                </div>
            </div>

            {isHovered && !isExpanded && (
                 <div className="absolute left-0 top-full mt-2 w-full max-w-lg bg-gray-900 border-2 border-cyan-500 rounded-lg shadow-2xl z-20 text-xs animate-fade-in pointer-events-none">
                    {renderDetailedContent()}
                 </div>
            )}
        </div>
    );
};

const Dashboard: React.FC<{ stats: AnalysisStats }> = ({ stats }) => {
    const statItems = [
        { label: "Total GPOs Analyzed", value: stats.totalGpos, color: "text-cyan-300" },
        { label: "High-Severity Conflicts", value: stats.highSeverityConflicts, color: "text-red-400" },
        { label: "Medium-Severity Conflicts", value: stats.mediumSeverityConflicts, color: "text-red-500" },
        { label: "Consolidation Opportunities", value: stats.consolidationOpportunities, color: "text-sky-400" },
    ];
    return (
        <div className="mb-8 p-4 bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">At-a-Glance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {statItems.map(item => (
                    <div key={item.label} className="bg-black/20 p-3 rounded-md">
                        <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">{item.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const AnalysisDisplay: React.FC<{ analysis: Analysis }> = ({ analysis }) => {
  const [consolidationFilter, setConsolidationFilter] = useState('');
  const [findingFilter, setFindingFilter] = useState('');

  const filteredConsolidations = useMemo(() => 
    analysis.consolidation?.filter(c => 
      c.reason.toLowerCase().includes(consolidationFilter.toLowerCase()) || 
      c.recommendation.toLowerCase().includes(consolidationFilter.toLowerCase())
    ) || [], [analysis.consolidation, consolidationFilter]
  );
  
  const filteredFindings = useMemo(() =>
    analysis.findings.filter(f => {
        const searchTerm = findingFilter.toLowerCase();
        if (!searchTerm) return true;
        return (
            f.setting.toLowerCase().includes(searchTerm) ||
            f.severity?.toLowerCase().includes(searchTerm) ||
            f.type.toLowerCase().includes(searchTerm) ||
            f.policies.some(p => p.name.toLowerCase().includes(searchTerm))
        );
    }), [analysis.findings, findingFilter]
  );

  return (
    <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-4 sm:p-6">
      <div className="flex items-center mb-6">
        <InfoIcon className="w-7 h-7 text-cyan-300 mr-3"/>
        <h2 className="text-2xl font-bold text-cyan-300">GPO Analysis Report</h2>
      </div>
      
      <Dashboard stats={analysis.stats} />

      <div className="prose prose-invert prose-sm text-gray-300 max-w-none mb-8 p-4 bg-black/30 rounded-md border border-gray-700/50">
        <p className="font-medium text-gray-200">Executive Summary</p>
        <p>{analysis.summary}</p>
      </div>

      {analysis.consolidation && analysis.consolidation.length > 0 && (
        <div className="mb-8">
             <h3 className="text-xl font-semibold text-gray-200 mb-4 ml-1">Consolidation Recommendations</h3>
             <div className="relative mb-4">
                <SearchIcon className="w-5 h-5 text-gray-500 absolute top-1/2 left-3 -translate-y-1/2" />
                <input type="text" placeholder="Filter recommendations..." value={consolidationFilter} onChange={e => setConsolidationFilter(e.target.value)}
                    className="w-full bg-gray-900/70 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-sm text-gray-200 focus:ring-cyan-500"/>
             </div>
             <div className="space-y-4">
                {filteredConsolidations.map((item, index) => (
                    <div 
                        key={index}
                        className={`rounded-lg transition-shadow duration-300 hover:shadow-cyan-500/30 ${getGlowClass('Consolidation')}`}
                    >
                        <ConsolidationCard consolidation={item} />
                    </div>
                ))}
             </div>
        </div>
      )}
      
      <div>
        <h3 className="text-xl font-semibold text-gray-200 mb-4 ml-1">Detailed Findings</h3>
        <div className="relative mb-4">
            <SearchIcon className="w-5 h-5 text-gray-500 absolute top-1/2 left-3 -translate-y-1/2" />
            <input type="text" placeholder="Filter by setting, severity, type, or GPO name..." value={findingFilter} onChange={e => setFindingFilter(e.target.value)}
                className="w-full bg-gray-900/70 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-sm text-gray-200 focus:ring-cyan-500"/>
         </div>
        {filteredFindings.length > 0 ? (
            <div className="space-y-4">
                {filteredFindings.map((finding, index) => (
                    <div 
                         key={index}
                         className={`rounded-lg transition-shadow duration-300 hover:shadow-cyan-500/30 ${getGlowClass(finding.type, finding.severity)}`}
                    >
                         <FindingCard finding={finding} gpoDetails={analysis.gpoDetails} />
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-700 rounded-lg">
                <p className="font-medium">No Findings Match Your Filter</p>
                <p className="text-sm">Clear the filter to see all findings.</p>
            </div>
        )}
      </div>
    </div>
  );
};