
import React, { useState, useMemo } from 'react';
import type { Analysis, GpoFinding, GpoConsolidation, GpoDetails, AnalysisStats, GpoSecurityRecommendation } from '../types';
import { RelationshipMatrix } from './RelationshipMatrix';
import { ResolutionModal } from './ResolutionModal';
import { ConsolidationModal } from './ConsolidationModal';

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
const MapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
);
const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const WrenchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
);
const ScaleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
    </svg>
);
const ShieldCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
);
const ExclamationTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
    </svg>
);


// --- SUB-COMPONENTS ---
const PolicyStateIcon: React.FC<{ state: 'Enabled' | 'Disabled' | 'Value' }> = ({ state }) => {
    switch(state) {
        case 'Enabled': return <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />;
        case 'Disabled': return <XCircleIcon className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" />;
        case 'Value': return <ValueIcon className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />;
        default: return null;
    }
};

const getGlowClass = (type: 'Conflict' | 'Overlap' | 'Consolidation' | 'Security', severity?: 'Critical' | 'High' | 'Medium' | 'Low'): string => {
    if (type === 'Security') {
        if (severity === 'Critical') return 'shadow-[0_0_15px_rgba(220,38,38,0.7)]';
        if (severity === 'High') return 'shadow-[0_0_15px_rgba(239,68,68,0.6)]';
        return 'shadow-[0_0_10px_rgba(251,146,60,0.5)]';
    }
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

interface SecurityRecommendationCardProps {
    recommendation: GpoSecurityRecommendation;
}
const SecurityRecommendationCard: React.FC<SecurityRecommendationCardProps> = ({ recommendation }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const severityColor = recommendation.severity === 'Critical' ? 'bg-red-600' : 
                          recommendation.severity === 'High' ? 'bg-orange-600' : 'bg-yellow-600';
    const borderColor = recommendation.severity === 'Critical' ? 'border-red-500' : 
                        recommendation.severity === 'High' ? 'border-orange-500' : 'border-yellow-500';

    return (
        <div className="relative">
             <div className={`bg-white/5 backdrop-blur-md rounded-lg border-2 ${borderColor} overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.01]`}>
                <div className="p-4 cursor-pointer flex items-center justify-between" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="flex items-center">
                        <ShieldCheckIcon className="w-6 h-6 mr-3 text-red-400" />
                        <div>
                             <h4 className="font-bold text-gray-100">{recommendation.setting}</h4>
                             <p className="text-xs text-gray-400 font-mono">Found in: {recommendation.gpoName}</p>
                        </div>
                    </div>
                     <div className="flex items-center space-x-3">
                         <span className={`${severityColor} text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider`}>
                            {recommendation.severity}
                        </span>
                        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} />
                    </div>
                </div>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}>
                    <div className="p-4 bg-black/20 space-y-4 border-t border-gray-700/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="bg-gray-800/40 p-3 rounded border border-red-500/20">
                                 <p className="text-xs text-gray-400 uppercase font-semibold">Current Value</p>
                                 <p className="text-red-300 font-mono text-sm break-words">{recommendation.currentConfiguration}</p>
                             </div>
                             <div className="bg-gray-800/40 p-3 rounded border border-green-500/20">
                                 <p className="text-xs text-gray-400 uppercase font-semibold">Recommended Baseline</p>
                                 <p className="text-green-300 font-mono text-sm break-words">{recommendation.recommendedConfiguration}</p>
                             </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-300"><span className="font-bold text-cyan-400">Rationale:</span> {recommendation.rationale}</p>
                        </div>
                        {recommendation.manualSteps && (
                             <div className="bg-gray-900/50 p-3 rounded border border-gray-700 text-xs font-mono text-gray-400">
                                 <p className="mb-1 font-bold text-gray-500 uppercase">Remediation Steps:</p>
                                 {recommendation.manualSteps}
                             </div>
                        )}
                    </div>
                </div>
             </div>
        </div>
    );
};

interface FindingCardProps {
    finding: GpoFinding;
    gpoDetails: GpoDetails[];
    onInspect: () => void;
    onResolve: () => void;
}
const FindingCard: React.FC<FindingCardProps> = ({ finding, gpoDetails, onInspect, onResolve }) => {
    const [isExpanded, setIsExpanded] = useState(false);
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
                                <th className="px-4 py-2 font-medium">Configured Value</th>
                                <th className="px-4 py-2 font-medium">Policy State</th>
                                <th className="px-4 py-2 font-medium">Precedence</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                            {finding.policies.map((policy, index) => {
                                const details = gpoDetails.find(d => d.name === policy.name);
                                return (
                                    <tr key={index} className={policy.isWinningPolicy ? "bg-cyan-900/30" : ""}>
                                        <td className="px-4 py-3 font-medium text-gray-200 align-top">
                                            <div className="font-bold break-words">{policy.name}</div>
                                            {details?.linkedOUs && details.linkedOUs.length > 0 && (
                                                <div className="text-xs text-gray-400 mt-1 pl-2 border-l-2 border-gray-600">
                                                    <span className="font-semibold text-gray-500 block">Linked:</span>
                                                    <ul className="list-none mt-0.5">
                                                        {details.linkedOUs.map(ou => <li key={ou} className="font-mono break-all" title={ou}>{ou}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            {details?.securityFiltering && details.securityFiltering.length > 0 && (
                                                <div className="text-xs text-gray-400 mt-2 pl-2 border-l-2 border-gray-600">
                                                    <span className="font-semibold text-gray-500 block">Security Filtering:</span>
                                                    <ul className="list-none mt-0.5">
                                                        {details.securityFiltering.map(sf => <li key={sf} className="font-mono break-all" title={sf}>{sf}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            {(!details?.securityFiltering || details.securityFiltering.length === 0) && (
                                                 <div className="text-xs text-gray-500 mt-1 pl-2 border-l-2 border-gray-600">
                                                    <span className="font-semibold text-gray-600 block">Security:</span> Authenticated Users
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-gray-200 align-top break-all min-w-[150px]">
                                            {policy.value}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-gray-200 align-top whitespace-nowrap">
                                            <div className="flex items-center">
                                                <PolicyStateIcon state={policy.policyState} />
                                                <span>{policy.policyState}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top whitespace-nowrap">
                                            {policy.isWinningPolicy && (
                                                <span className="font-bold text-cyan-300">
                                                    Winning
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
             <div>
                <p className="text-sm text-gray-400 mb-1">Recommendation (Hardening Focus)</p>
                <p className="text-gray-300 text-sm">{finding.recommendation}</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onInspect(); }}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-cyan-300 text-sm font-medium rounded-md transition-colors border border-gray-600"
                >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    Inspect Source
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onResolve(); }}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-green-400 text-sm font-medium rounded-md transition-colors border border-gray-600"
                >
                    <WrenchIcon className="w-4 h-4 mr-2" />
                    Resolve Issue
                </button>
            </div>
        </div>
    );

    return (
        <div className="relative">
            <div 
                className={`group bg-white/5 backdrop-blur-md rounded-lg border-2 ${cardBorderColor} shadow-lg transition-all duration-300 ease-in-out`}
            >
                <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center flex-grow pr-4">
                            {isConflict ? <ConflictIcon className={`w-5 h-5 mr-3 flex-shrink-0 ${finding.severity === 'High' ? 'text-red-400' : 'text-red-500'}`} /> : <OverlapIcon className="w-5 h-5 mr-3 flex-shrink-0 text-yellow-400" />}
                            <div className="flex flex-col min-w-0">
                                <span className="font-bold text-gray-200">{finding.type}</span>
                                {/* Changed truncate to break-words to show full setting name */}
                                <p className="font-mono text-cyan-300 text-sm break-words" title={finding.setting}>{finding.setting}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 flex-shrink-0">
                            {finding.severity && (
                                <span className={`hidden sm:inline-block text-xs font-bold px-2 py-0.5 rounded-full ${finding.severity === 'High' ? 'bg-red-500/80 text-white' : 'bg-red-400/70 text-black'}`}>
                                    {finding.severity}
                                </span>
                            )}
                            <div className="flex -space-x-2 overflow-hidden">
                               <span className="text-sm text-gray-400 whitespace-nowrap">
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
        </div>
    );
};

interface ConsolidationCardProps {
    consolidation: GpoConsolidation;
    onCompare: () => void;
    onPlan: () => void;
}
const ConsolidationCard: React.FC<ConsolidationCardProps> = ({ consolidation, onCompare, onPlan }) => {
    const [isExpanded, setIsExpanded] = useState(false);

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
                        <span key={name} className="bg-gray-700 text-gray-300 text-xs font-mono px-2 py-1 rounded break-words">{name}</span>
                    ))}
                </div>
            </div>
            <div>
                <p className="text-sm text-gray-400 mb-1">Efficiency Justification</p>
                <p className="text-gray-300 text-sm">{consolidation.reason}</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onCompare(); }}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sky-300 text-sm font-medium rounded-md transition-colors border border-gray-600"
                >
                    <ScaleIcon className="w-4 h-4 mr-2" />
                    Compare Sources
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onPlan(); }}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-green-400 text-sm font-medium rounded-md transition-colors border border-gray-600"
                >
                    <MergeIcon className="w-4 h-4 mr-2" />
                    Consolidation Plan
                </button>
            </div>
        </div>
    );
    
    return (
        <div className="relative">
            <div className="bg-white/5 backdrop-blur-md rounded-lg border border-sky-500/50 overflow-hidden shadow-lg">
                <div className="px-4 py-3 bg-sky-900/40 text-sky-300 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="flex items-center">
                        <MergeIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="font-bold">Consolidation Readiness Detected</span>
                    </div>
                     <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                            {consolidation.mergeCandidates.length} GPOs Matching
                        </span>
                        <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} />
                    </div>
                </div>
                 <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}>
                    {renderDetailedContent()}
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC<{ stats: AnalysisStats, consolidation?: GpoConsolidation[] }> = ({ stats, consolidation }) => {
    
    const potentialTotal = useMemo(() => {
        let reduction = 0;
        if (consolidation) {
            consolidation.forEach(c => {
                if (c.mergeCandidates.length > 1) {
                    reduction += (c.mergeCandidates.length - 1);
                }
            });
        }
        return Math.max(0, stats.totalGpos - reduction);
    }, [stats.totalGpos, consolidation]);

    const statItems = [
        { 
            label: "Analyzed GPOs", 
            value: stats.totalGpos, 
            color: "text-cyan-300",
            subtext: stats.totalGpos !== potentialTotal ? `Target: ${potentialTotal}` : null,
            subtextColor: "text-green-400"
        },
        { label: "Consolidation Targets", value: stats.consolidationOpportunities, color: "text-sky-400 font-black animate-pulse" },
        { label: "Redundant Overlaps", value: stats.overlaps, color: "text-yellow-400" },
        { label: "Security Alerts", value: stats.securityAlerts || 0, color: "text-red-500" },
    ];

    return (
        <div className="mb-8 p-4 bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center">
                Efficiency & Minimization Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {statItems.map(item => (
                    <div key={item.label} className="bg-black/20 p-3 rounded-md flex flex-col justify-center border border-white/5">
                        <div className="flex items-baseline justify-center space-x-2">
                            <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
                            {item.subtext && (
                                <div className="flex flex-col items-center">
                                     <span className={`text-xs font-bold ${item.subtextColor} animate-pulse`}>
                                        {item.subtext}
                                    </span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">{item.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const AnalysisDisplay: React.FC<{ analysis: Analysis }> = ({ analysis }) => {
  const [consolidationFilter, setConsolidationFilter] = useState('');
  const [findingFilter, setFindingFilter] = useState('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  // Modal State
  const [selectedFinding, setSelectedFinding] = useState<GpoFinding | null>(null);
  const [findingMode, setFindingMode] = useState<'inspect' | 'resolve'>('inspect');
  const [selectedConsolidation, setSelectedConsolidation] = useState<GpoConsolidation | null>(null);
  const [consolidationMode, setConsolidationMode] = useState<'compare' | 'plan'>('compare');

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
  
  const hasSecurityRecs = analysis.securityRecommendations && analysis.securityRecommendations.length > 0;

  return (
    <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center">
            <MergeIcon className="w-7 h-7 text-cyan-300 mr-3"/>
            <h2 className="text-2xl font-bold text-cyan-300">Efficiency & Consolidation Report</h2>
          </div>
          {/* Visual Map Trigger */}
          <button 
            onClick={() => setIsMapOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-cyan-500/30 bg-cyan-900/20 hover:bg-cyan-900/40 text-cyan-300 rounded-md transition-colors text-sm font-medium"
          >
            <MapIcon className="w-4 h-4 mr-2" />
            View Minimization Matrix
          </button>
      </div>
      
      <Dashboard stats={analysis.stats} consolidation={analysis.consolidation} />

      {/* Map Modal */}
      <RelationshipMatrix 
            findings={analysis.findings} 
            gpoNames={analysis.gpoDetails.map(g => g.name)}
            isOpen={isMapOpen}
            onClose={() => setIsMapOpen(false)}
      />

      {/* Resolution Modal */}
      <ResolutionModal
            isOpen={!!selectedFinding}
            onClose={() => setSelectedFinding(null)}
            finding={selectedFinding}
            gpoDetails={analysis.gpoDetails}
            initialTab={findingMode}
      />
      
      {/* Consolidation Modal */}
      <ConsolidationModal
            isOpen={!!selectedConsolidation}
            onClose={() => setSelectedConsolidation(null)}
            consolidation={selectedConsolidation}
            gpoDetails={analysis.gpoDetails}
            allFindings={analysis.findings}
            initialTab={consolidationMode}
      />

      <div className="prose prose-invert prose-sm text-gray-300 max-w-none mb-8 p-4 bg-black/30 rounded-md border border-gray-700/50 animate-fade-in">
        <p className="font-medium text-gray-200">Executive Minimization Strategy</p>
        {analysis.summary ? (
             <p>{analysis.summary}</p>
        ) : (
             <p className="text-gray-500 italic animate-pulse">Calculating optimal forest density...</p>
        )}
      </div>

      {/* --- CONSOLIDATION SECTION (MOVED TO TOP) --- */}
      {analysis.consolidation && analysis.consolidation.length > 0 && (
        <div className="mb-10">
             <h3 className="text-xl font-semibold text-gray-200 mb-4 ml-1">Consolidation Opportunities (Minimization Focus)</h3>
             <p className="text-sm text-gray-400 mb-4 ml-1">
                 Priority candidates for merging based on 100% matches in Linked OUs, Security Filtering, and Delegation.
             </p>
             <div className="relative mb-4">
                <SearchIcon className="w-5 h-5 text-gray-500 absolute top-1/2 left-3 -translate-y-1/2" />
                <input type="text" placeholder="Filter recommendations..." value={consolidationFilter} onChange={e => setConsolidationFilter(e.target.value)}
                    className="w-full bg-gray-900/70 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-sm text-gray-200 focus:ring-cyan-500"/>
             </div>
             <div className="space-y-4">
                {filteredConsolidations.map((item, index) => (
                    <div 
                        key={index}
                        className={`rounded-lg transition-shadow duration-300 hover:shadow-cyan-500/30 animate-fade-in ${getGlowClass('Consolidation')}`}
                    >
                        <ConsolidationCard 
                            consolidation={item} 
                            onCompare={() => {
                                setSelectedConsolidation(item);
                                setConsolidationMode('compare');
                            }}
                            onPlan={() => {
                                setSelectedConsolidation(item);
                                setConsolidationMode('plan');
                            }}
                        />
                    </div>
                ))}
             </div>
        </div>
      )}

      {/* --- SECURITY RECOMMENDATIONS SECTION --- */}
      {hasSecurityRecs && (
        <div className="mb-10 animate-fade-in">
             <div className="flex items-center mb-4">
                 <ShieldCheckIcon className="w-6 h-6 text-red-500 mr-2" />
                 <h3 className="text-xl font-semibold text-gray-200">Recommended Security Hardening</h3>
             </div>
             <p className="text-sm text-gray-400 mb-4 ml-1">
                 Remediating these configurations will harden your posture while potentially simplifying logic.
             </p>
             <div className="grid grid-cols-1 gap-4">
                 {analysis.securityRecommendations!.map((rec, index) => (
                    <div key={index} className={getGlowClass('Security', rec.severity)}>
                         <SecurityRecommendationCard recommendation={rec} />
                    </div>
                 ))}
             </div>
        </div>
      )}
      
      <div>
        <h3 className="text-xl font-semibold text-gray-200 mb-2 ml-1">Setting Forensics (Conflicts & Overlaps)</h3>
        <p className="text-sm text-gray-400 mb-4 ml-1">
             Detailed settings analysis. Resolving these helps prepare for future consolidation.
        </p>
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
                         className={`rounded-lg transition-shadow duration-300 hover:shadow-cyan-500/30 animate-fade-in ${getGlowClass(finding.type, finding.severity)}`}
                    >
                         <FindingCard 
                             finding={finding} 
                             gpoDetails={analysis.gpoDetails} 
                             onInspect={() => {
                                 setSelectedFinding(finding);
                                 setFindingMode('inspect');
                             }}
                             onResolve={() => {
                                 setSelectedFinding(finding);
                                 setFindingMode('resolve');
                             }}
                         />
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
