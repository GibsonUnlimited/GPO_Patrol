
import React, { useState } from 'react';
import type { OrganizationAnalysis, GpoDetails, GpoClassification } from '../types';

interface OrganizationDisplayProps {
  result: OrganizationAnalysis;
}

// --- ICONS ---
const ServerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);
const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const ComputerDesktopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.375 1.5-3 3 0 01-5.25 0 3 3 0 01-.375-1.5V17.25m6 0v1.007a3 3 0 00.375 1.5-3 3 0 005.25 0 3 3 0 00.375-1.5V17.25m-6 0h6M12 12.75h.008v.008H12v-.008z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);
const ExclamationTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
  </svg>
);
const FolderOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);
const BoltIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const MixedPolicyRow: React.FC<{ 
    gpoName: string; 
    primaryCategory: string; 
    details: GpoDetails | undefined; 
}> = ({ gpoName, primaryCategory, details }) => {
    const [expanded, setExpanded] = useState(false);
    const userSettings = details?.configuredSettings?.filter(s => s.policyType === 'User') || [];
    const compSettings = details?.configuredSettings?.filter(s => s.policyType === 'Computer') || [];

    return (
        <div className={`rounded-xl border transition-all duration-300 ${expanded ? 'bg-red-950/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'bg-slate-900/40 border-white/5 hover:border-red-500/30'}`}>
            <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h4 className="font-mono text-gray-100 font-bold">{gpoName}</h4>
                        <span className="text-[10px] uppercase font-black tracking-widest text-red-500/60">Mixed State Conflict</span>
                    </div>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="hidden sm:flex space-x-2">
                        <span className="px-2 py-1 rounded bg-blue-900/30 text-blue-300 text-[10px] font-bold">{userSettings.length} USER</span>
                        <span className="px-2 py-1 rounded bg-purple-900/30 text-purple-300 text-[10px] font-bold">{compSettings.length} COMP</span>
                    </div>
                    <div className={`p-2 rounded-full hover:bg-white/5 transition-transform ${expanded ? 'rotate-180' : ''}`}>
                         <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="p-6 pt-0 border-t border-red-500/20 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-4">
                            <div className="flex items-center text-blue-400 text-xs font-bold uppercase tracking-widest bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                                <UserIcon className="w-4 h-4 mr-2" /> User Configuration Payload
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                                {userSettings.map((s, i) => (
                                    <div key={i} className="p-2 bg-black/30 rounded font-mono text-[10px] border border-white/5">
                                        <div className="text-blue-300">{s.name}</div>
                                        <div className="text-gray-500 mt-1">{s.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center text-purple-400 text-xs font-bold uppercase tracking-widest bg-purple-500/5 p-3 rounded-lg border border-purple-500/10">
                                <ComputerDesktopIcon className="w-4 h-4 mr-2" /> Computer Configuration Payload
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                                {compSettings.map((s, i) => (
                                    <div key={i} className="p-2 bg-black/30 rounded font-mono text-[10px] border border-white/5">
                                        <div className="text-purple-300">{s.name}</div>
                                        <div className="text-gray-500 mt-1">{s.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                         <div className="bg-slate-950 p-4 rounded-xl border border-white/5 flex-grow">
                             <h5 className="text-[10px] font-black text-gray-500 uppercase mb-2">Split Remediation Plan</h5>
                             <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside">
                                 <li>Create <span className="text-white font-mono">{gpoName}_User</span> and link it to current OUs.</li>
                                 <li>Disable "User Configuration" in the original GPO and rename to <span className="text-white font-mono">{gpoName}_Comp</span>.</li>
                                 <li>Export and import relevant registry keys to match the above payload split.</li>
                             </ol>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProposedGroupCard: React.FC<{ recommendation: any; allGpoDetails: GpoDetails[] }> = ({ recommendation, allGpoDetails = [] }) => {
    const [expanded, setExpanded] = useState(false);
    const aggregated = (recommendation?.suggestedGpos || []).flatMap((g: string) => 
        (allGpoDetails || []).find(d => d.name === g)?.configuredSettings || []
    );

    return (
        <div className={`rounded-2xl border transition-all duration-300 ${expanded ? 'bg-indigo-900/10 border-indigo-500 shadow-xl' : 'bg-slate-900/40 border-white/5 hover:border-indigo-500/30'}`}>
            <div className="p-6 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${recommendation.type === 'User' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'}`}>
                            {recommendation.type === 'User' ? <UserIcon className="w-6 h-6" /> : <ComputerDesktopIcon className="w-6 h-6" />}
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{recommendation.groupName}</h4>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-black mt-0.5">{recommendation.type} Blueprint Group</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                         <span className="text-xs font-mono text-gray-500">{(recommendation?.suggestedGpos || []).length} Sources</span>
                         <div className={`p-2 rounded-lg bg-black/40 border border-white/5 transform transition-transform ${expanded ? 'rotate-180' : ''}`}>
                             <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                         </div>
                    </div>
                </div>
                {!expanded && <p className="text-sm text-gray-500 mt-4 line-clamp-1">{recommendation.description}</p>}
            </div>

            {expanded && (
                <div className="p-6 pt-0 border-t border-indigo-500/20 animate-fade-in">
                    <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10 mt-6 mb-6">
                        <h5 className="text-xs font-bold text-indigo-300 uppercase mb-2">Strategy Summary</h5>
                        <p className="text-sm text-gray-400 leading-relaxed">{recommendation.description}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Unified Payload Map ({aggregated.length} Settings)</h5>
                            <button className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest">Copy Blueprint</button>
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar border border-white/5 rounded-xl bg-black/20">
                             <table className="min-w-full text-[10px] text-left font-mono">
                                 <thead className="bg-slate-900/80 sticky top-0">
                                     <tr>
                                         <th className="p-3 text-gray-500 uppercase">Policy Path</th>
                                         <th className="p-3 text-gray-500 uppercase">Value</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-white/5">
                                     {aggregated.map((s: any, i: number) => (
                                         <tr key={i} className="hover:bg-white/5">
                                             <td className="p-3 text-gray-300 break-all">{s.name}</td>
                                             <td className="p-3 text-cyan-500 break-all">{s.value}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const OrganizationDisplay: React.FC<OrganizationDisplayProps> = ({ result }) => {
  const mixedPolicies = (result?.classifications || []).filter(c => c.type === 'Mixed');
  const [activeTab, setActiveTab] = useState<'blueprint' | 'forensics' | 'script'>('blueprint');

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
      {/* Migration Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 hologram-card p-8 rounded-3xl border border-white/5 flex flex-col justify-between">
              <div>
                  <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                          <FolderOpenIcon className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h2 className="nexus-text text-3xl font-black">Forest Logic Command</h2>
                  </div>
                  <p className="text-gray-400 text-lg leading-relaxed max-w-3xl">{result?.summary}</p>
              </div>
              <div className="mt-10 flex items-center space-x-12 border-t border-white/5 pt-8">
                  <div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Complexity Index</span>
                      <div className="flex items-baseline space-x-2">
                          <span className="text-4xl font-black text-red-500">{result?.entropyScore || 72}</span>
                          <span className="text-xs text-gray-600 font-mono">/ 100</span>
                      </div>
                  </div>
                  <div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Mixed States</span>
                      <div className="flex items-baseline space-x-2">
                          <span className="text-4xl font-black text-orange-400">{mixedPolicies.length}</span>
                          <span className="text-xs text-gray-600 font-mono">FOUND</span>
                      </div>
                  </div>
                  <div className="flex-grow">
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 text-right">Migration Readiness</span>
                       <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                           <div className="bg-gradient-to-r from-red-500 via-orange-500 to-green-500 h-full w-[45%]"></div>
                       </div>
                  </div>
              </div>
          </div>
          <div className="bg-indigo-600 rounded-3xl p-8 flex flex-col justify-between shadow-[0_0_50px_rgba(79,70,229,0.2)]">
              <div>
                  <h3 className="text-xl font-black text-white leading-tight mb-4">Launch Migration Sequence</h3>
                  <p className="text-indigo-100 text-sm opacity-80">Generate the required PowerShell logic to instantiate the logical blueprints and split mixed policies across your forest.</p>
              </div>
              <button 
                onClick={() => setActiveTab('script')}
                className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center"
              >
                  <BoltIcon className="w-5 h-5 mr-2" />
                  Get Remediator
              </button>
          </div>
      </div>

      {/* Main Analysis View */}
      <div className="space-y-6">
          <div className="flex space-x-1 bg-slate-950/60 p-1.5 rounded-2xl border border-white/5 w-fit mx-auto">
              <button onClick={() => setActiveTab('blueprint')} className={`px-8 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'blueprint' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Functional Blueprints</button>
              <button onClick={() => setActiveTab('forensics')} className={`px-8 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'forensics' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Mixed Forensics</button>
              <button onClick={() => setActiveTab('script')} className={`px-8 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'script' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Automation Script</button>
          </div>

          {activeTab === 'blueprint' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  {(result?.recommendations || []).map((rec, i) => (
                      <ProposedGroupCard key={i} recommendation={rec} allGpoDetails={result?.gpoDetails || []} />
                  ))}
              </div>
          )}

          {activeTab === 'forensics' && (
              <div className="space-y-4 animate-fade-in max-w-5xl mx-auto">
                  {mixedPolicies.length > 0 ? (
                      mixedPolicies.map((gpo, idx) => (
                          <MixedPolicyRow 
                            key={idx} 
                            gpoName={gpo.gpoName} 
                            primaryCategory={gpo.primaryCategory} 
                            details={(result?.gpoDetails || []).find(d => d.name === gpo.gpoName)} 
                          />
                      ))
                  ) : (
                      <div className="text-center py-20 bg-green-500/5 rounded-3xl border border-green-500/20">
                          <p className="text-green-400 font-bold text-xl mb-2">Clean Forest State</p>
                          <p className="text-gray-500 text-sm">No mixed-state policies detected. All GPOs are functionally separated.</p>
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'script' && (
              <div className="animate-fade-in max-w-5xl mx-auto">
                  <div className="bg-black rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                      <div className="bg-gray-900 px-6 py-4 flex items-center justify-between border-b border-white/5">
                          <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500 mr-4"></div>
                              <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">Migration_Sequencer.ps1</span>
                          </div>
                          <button className="text-[10px] font-black text-cyan-400 uppercase tracking-widest hover:text-white transition-colors">Copy Command</button>
                      </div>
                      <div className="p-8 font-mono text-sm overflow-x-auto text-green-400 custom-scrollbar">
                          <pre>{result?.remediationScript || `# Forest Migration PowerShell Script
# 1. Split Mixed State GPOs
# 2. Re-assign Functional Groups
# 3. Optimize Login Processing Speed

Write-Host "Initializing Carlisle Migration Sequence..." -ForegroundColor Cyan

$Blueprints = @(
${(result?.recommendations || []).map(r => `    "${r.groupName}"`).join(',\n')}
)

foreach ($plan in $Blueprints) {
    Write-Host "Targeting Blueprint: $plan" -ForegroundColor Gray
    # Logic to create and link functional masters goes here
}`}</pre>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
