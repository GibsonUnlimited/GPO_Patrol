
import React, { useState, useMemo } from 'react';
import type { GpoDetails, GpoFinding, GpoSecurityRecommendation } from '../types';

interface GpoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  gpoName: string;
  gpoDetails: GpoDetails | undefined;
  findings: GpoFinding[];
  securityRecommendations: GpoSecurityRecommendation[];
}

// --- ICONS ---
const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ShieldCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
);

const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const UserGroupIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
);

const BuildingLibraryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
  </svg>
);

const FolderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

const DocumentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

// --- HELPER COMPONENT: OU Tree ---
interface OUTreeNode {
    type: 'Domain' | 'OU' | 'GPO';
    name: string;
    fullName: string;
}

const ScopeVisualizer: React.FC<{ linkedOUs: string[], gpoName: string }> = ({ linkedOUs, gpoName }) => {
    // Parse Distinguished Name (DN) strings into structured arrays
    const parsedPaths = useMemo(() => {
        return linkedOUs.map(dn => {
            const parts = dn.split(',').reverse(); // Reverse to go from Root (DC) down to OU
            const nodes: OUTreeNode[] = [];
            
            // Collect DC parts first to form the domain name
            const dcParts = parts.filter(p => p.startsWith('DC=')).map(p => p.replace('DC=', ''));
            const domainName = dcParts.join('.');
            if (domainName) {
                nodes.push({ type: 'Domain', name: domainName, fullName: dcParts.map(p => `DC=${p}`).join(',') });
            }

            // Add OUs in order
            parts.filter(p => p.startsWith('OU=')).forEach(p => {
                const ouName = p.replace('OU=', '');
                nodes.push({ type: 'OU', name: ouName, fullName: p });
            });

            // Add the GPO itself as the leaf
            nodes.push({ type: 'GPO', name: gpoName, fullName: gpoName });

            return nodes;
        });
    }, [linkedOUs, gpoName]);

    if (!linkedOUs || linkedOUs.length === 0) {
        return (
            <div className="p-8 text-center border-2 border-dashed border-gray-700 rounded-lg text-gray-500">
                <p>This GPO is not currently linked to any Organizational Units.</p>
                <p className="text-xs mt-1 italic">It may be used as a template or linked to a domain/site not captured in the reports.</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {parsedPaths.map((path, pathIdx) => (
                <div key={pathIdx} className="bg-gray-800/20 rounded-xl p-6 border border-gray-700/50">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Scope Path #{pathIdx + 1}</h4>
                    <div className="relative ml-2">
                        {path.map((node, nodeIdx) => {
                            const isLast = nodeIdx === path.length - 1;
                            const isGPO = node.type === 'GPO';
                            const isDomain = node.type === 'Domain';

                            return (
                                <div key={nodeIdx} className="flex items-start relative pb-6 group">
                                    {/* Vertical Line Connector */}
                                    {!isLast && (
                                        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 to-cyan-500/10 group-hover:from-cyan-400 transition-colors"></div>
                                    )}

                                    {/* Icon/Circle Container */}
                                    <div className={`relative z-10 w-6 h-6 flex items-center justify-center rounded-full border shadow-lg ${
                                        isGPO ? 'bg-indigo-600 border-indigo-400 shadow-indigo-900/40' : 
                                        isDomain ? 'bg-cyan-900 border-cyan-500 shadow-cyan-950' : 
                                        'bg-gray-700 border-gray-500 shadow-black/50'
                                    }`}>
                                        {isDomain && <BuildingLibraryIcon className="w-3.5 h-3.5 text-cyan-200" />}
                                        {node.type === 'OU' && <FolderIcon className="w-3.5 h-3.5 text-gray-200" />}
                                        {isGPO && <DocumentIcon className="w-3.5 h-3.5 text-white" />}
                                    </div>

                                    {/* Text Content */}
                                    <div className="ml-4">
                                        <div className="flex items-center">
                                            <span className={`text-sm font-mono ${isGPO ? 'text-indigo-300 font-bold' : isDomain ? 'text-cyan-300 font-bold' : 'text-gray-300'}`}>
                                                {node.name}
                                            </span>
                                            {isDomain && <span className="ml-2 px-1.5 py-0.5 rounded bg-cyan-950 text-[10px] text-cyan-500 border border-cyan-900 uppercase font-bold tracking-tighter">Root</span>}
                                            {isGPO && <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-950 text-[10px] text-indigo-400 border border-indigo-900 uppercase font-bold tracking-tighter">Policy Applied</span>}
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-mono mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                            {isGPO ? 'Applied via link inheritance' : `LDAP: ${node.fullName}`}
                                        </p>
                                        
                                        {/* Inheritance Info for GPO */}
                                        {isGPO && (
                                            <div className="mt-2 bg-indigo-900/20 border border-indigo-500/20 rounded p-2 text-[11px] text-indigo-300 flex items-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 animate-pulse"></div>
                                                Inherits settings from all parent levels above.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const GpoDetailModal: React.FC<GpoDetailModalProps> = ({ isOpen, onClose, gpoName, gpoDetails, findings, securityRecommendations }) => {
  const [activeTab, setActiveTab] = useState<'security' | 'scope' | 'delegation'>('security');

  if (!isOpen) return null;

  // Filter findings for this GPO
  const relevantFindings = findings.filter(f => f.policies.some(p => p.name === gpoName));
  const relevantSecurityRecs = securityRecommendations.filter(r => r.gpoName === gpoName);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 border border-cyan-500/30 rounded-xl shadow-2xl w-full max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800/50">
           <div>
               <h2 className="text-xl font-bold text-gray-100 flex items-center">
                   <span className="bg-cyan-900/30 text-cyan-400 p-2 rounded-lg mr-3 border border-cyan-500/20">
                       GPO
                   </span>
                   {gpoName}
               </h2>
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
               <XIcon className="w-6 h-6" />
           </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-900/50 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('security')}
                className={`flex-1 min-w-[150px] py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'security' ? 'border-red-500 text-red-400 bg-red-900/10' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
            >
                <div className="flex items-center justify-center">
                    <ShieldCheckIcon className="w-4 h-4 mr-2" />
                    Security Findings
                </div>
            </button>
            <button 
                onClick={() => setActiveTab('scope')}
                className={`flex-1 min-w-[150px] py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'scope' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/10' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
            >
                <div className="flex items-center justify-center">
                    <EyeIcon className="w-4 h-4 mr-2" />
                    Hierarchy & Scope
                </div>
            </button>
            <button 
                onClick={() => setActiveTab('delegation')}
                className={`flex-1 min-w-[150px] py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'delegation' ? 'border-purple-500 text-purple-400 bg-purple-900/10' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
            >
                <div className="flex items-center justify-center">
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    Delegation
                </div>
            </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 bg-black/20">
            {activeTab === 'security' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="p-4 bg-gray-800/40 rounded border border-gray-700 mb-4">
                        <p className="text-sm text-gray-400">
                            This view lists analyzed security configurations, including hardening recommendations and identified conflicts/overlaps. 
                            <span className="italic opacity-70 ml-1">(Note: Only analyzed settings are shown here).</span>
                        </p>
                    </div>

                    {/* Security Recommendations */}
                    {relevantSecurityRecs.length > 0 && (
                        <div>
                             <h3 className="text-md font-bold text-red-400 mb-3 border-b border-red-900/30 pb-1">Security Posture Risks</h3>
                             <div className="grid gap-3">
                                {relevantSecurityRecs.map((rec, idx) => (
                                    <div key={idx} className="bg-red-900/10 border border-red-500/20 p-3 rounded">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-gray-200 text-sm">{rec.setting}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${rec.severity === 'Critical' ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'}`}>
                                                {rec.severity}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-xs grid grid-cols-2 gap-2">
                                            <div>
                                                <span className="block text-gray-500 uppercase">Current</span>
                                                <span className="text-red-300 font-mono">{rec.currentConfiguration}</span>
                                            </div>
                                            <div>
                                                <span className="block text-gray-500 uppercase">Recommended</span>
                                                <span className="text-green-300 font-mono">{rec.recommendedConfiguration}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {/* Conflicts & Overlaps */}
                    {relevantFindings.length > 0 && (
                        <div>
                            <h3 className="text-md font-bold text-yellow-400 mb-3 border-b border-yellow-900/30 pb-1 mt-6">Conflicts & Overlaps</h3>
                            <div className="grid gap-3">
                                {relevantFindings.map((finding, idx) => {
                                    const policy = finding.policies.find(p => p.name === gpoName);
                                    return (
                                        <div key={idx} className="bg-gray-800/30 border border-gray-700 p-3 rounded">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-medium text-gray-300 text-sm break-all">{finding.setting}</p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${finding.type === 'Conflict' ? 'bg-red-900/40 text-red-300' : 'bg-yellow-900/40 text-yellow-300'}`}>
                                                    {finding.type}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono">
                                                Configured Value: <span className="text-cyan-300">{policy?.value}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {relevantFindings.length === 0 && relevantSecurityRecs.length === 0 && (
                         <p className="text-center text-gray-500 py-8">No security alerts or conflicts found for this GPO in the current analysis.</p>
                    )}
                </div>
            )}

            {activeTab === 'scope' && (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h3 className="text-lg font-semibold text-cyan-300 mb-2">Inheritance & Application Hierarchy</h3>
                        <p className="text-xs text-gray-400 mb-6 border-b border-gray-800 pb-4">
                            Visualizing how this policy is linked within your Active Directory environment. Settings flow from top to bottom (LSDOU).
                        </p>
                        <ScopeVisualizer linkedOUs={gpoDetails?.linkedOUs || []} gpoName={gpoName} />
                    </div>

                    {/* Security Filtering Section */}
                    <div className="mt-10">
                        <h3 className="text-lg font-semibold text-cyan-300 mb-3">Security Filtering</h3>
                         <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                             <p className="text-xs text-gray-500 mb-2 italic">Even if linked above, the policy only applies to these principals:</p>
                             {gpoDetails?.securityFiltering && gpoDetails.securityFiltering.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {gpoDetails.securityFiltering.map((filter, idx) => (
                                        <span key={idx} className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-xs font-mono border border-gray-600">
                                            {filter}
                                        </span>
                                    ))}
                                </div>
                             ) : (
                                <div className="flex items-center">
                                     <span className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-xs font-mono border border-gray-600">
                                        Authenticated Users
                                     </span>
                                     <span className="ml-2 text-xs text-gray-500">(Default)</span>
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'delegation' && (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h3 className="text-lg font-semibold text-purple-400 mb-3">Delegation & Permissions</h3>
                        <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
                             {gpoDetails?.delegation && gpoDetails.delegation.length > 0 ? (
                                <table className="min-w-full text-sm text-left">
                                    <thead className="bg-gray-800 text-xs text-gray-400 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">Principal</th>
                                            <th className="px-4 py-3">Permission</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {gpoDetails.delegation.map((del, idx) => {
                                            const parts = del.includes(':') ? del.split(':') : [del, 'Unknown'];
                                            const principal = parts[0].trim();
                                            const permission = parts.slice(1).join(':').trim();
                                            return (
                                                <tr key={idx} className="hover:bg-gray-700/30">
                                                    <td className="px-4 py-3 font-medium text-gray-300">{principal}</td>
                                                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{permission}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                             ) : (
                                 <div className="p-6 text-center">
                                     <p className="text-gray-500 italic">No specific delegation permissions found or parsed.</p>
                                     <p className="text-xs text-gray-600 mt-1">Standard Domain Admin/Enterprise Admin rights apply.</p>
                                 </div>
                             )}
                        </div>
                    </div>
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
