
import React, { useState } from 'react';
import type { OrganizationAnalysis } from '../types';

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


export const OrganizationDisplay: React.FC<OrganizationDisplayProps> = ({ result }) => {
  const mixedPolicies = result.classifications.filter(c => c.type === 'Mixed');
  const userPolicies = result.classifications.filter(c => c.type === 'User');
  const computerPolicies = result.classifications.filter(c => c.type === 'Computer');

  return (
    <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-6 space-y-8 animate-fade-in">
      
      {/* Header & Summary */}
      <div className="border-b border-gray-700 pb-6">
         <div className="flex items-center mb-4">
             <div className="bg-indigo-900/30 p-3 rounded-lg border border-indigo-500/30 mr-4">
                 <FolderOpenIcon className="w-8 h-8 text-indigo-400" />
             </div>
             <div>
                 <h2 className="text-2xl font-bold text-gray-100">Logical Organization Plan</h2>
                 <p className="text-gray-400">Functional analysis of settings to separate User vs. Computer and group like-minded policies.</p>
             </div>
         </div>
         <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700">
             <p className="text-gray-300 leading-relaxed">{result.summary}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COL: Classification Stats */}
          <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-200 border-b border-gray-700 pb-2">Policy Classification</h3>
              
              {/* Mixed Policies Warning */}
              {mixedPolicies.length > 0 && (
                  <div className="bg-red-900/10 border border-red-500/40 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                          <ExclamationTriangleIcon className="w-6 h-6 text-red-400 mr-2" />
                          <h4 className="font-bold text-red-300">Mixed Policies Detected ({mixedPolicies.length})</h4>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                          These GPOs contain both User and Computer settings. This is considered bad practice. 
                          It is recommended to split these into separate policies for cleaner targeting.
                      </p>
                      <ul className="space-y-2">
                          {mixedPolicies.map((gpo, idx) => (
                              <li key={idx} className="bg-red-950/30 p-2 rounded border border-red-900/50 flex justify-between items-center text-sm">
                                  <span className="font-mono text-red-200">{gpo.gpoName}</span>
                                  <span className="text-xs text-gray-500 bg-black/30 px-2 py-1 rounded">{gpo.primaryCategory}</span>
                              </li>
                          ))}
                      </ul>
                  </div>
              )}

              {/* Counts */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-900/10 border border-blue-500/30 rounded-lg p-4 text-center">
                      <UserIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <span className="block text-2xl font-bold text-blue-300">{userPolicies.length}</span>
                      <span className="text-xs text-gray-500 uppercase">User Policies</span>
                  </div>
                  <div className="bg-purple-900/10 border border-purple-500/30 rounded-lg p-4 text-center">
                      <ComputerDesktopIcon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <span className="block text-2xl font-bold text-purple-300">{computerPolicies.length}</span>
                      <span className="text-xs text-gray-500 uppercase">Computer Policies</span>
                  </div>
              </div>
              
              {/* Full Classification List */}
              <div className="bg-gray-800/20 border border-gray-700 rounded-lg overflow-hidden">
                  <table className="min-w-full text-sm text-left">
                      <thead className="bg-gray-900/50 text-xs text-gray-400 uppercase tracking-wider">
                          <tr>
                              <th className="px-4 py-3">GPO Name</th>
                              <th className="px-4 py-3">Type</th>
                              <th className="px-4 py-3">Detected Function</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                          {result.classifications.map((gpo, idx) => (
                              <tr key={idx} className="hover:bg-gray-700/20">
                                  <td className="px-4 py-2 font-medium text-gray-300">{gpo.gpoName}</td>
                                  <td className="px-4 py-2">
                                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                          gpo.type === 'Mixed' ? 'bg-red-900/50 text-red-400' :
                                          gpo.type === 'User' ? 'bg-blue-900/50 text-blue-400' :
                                          'bg-purple-900/50 text-purple-400'
                                      }`}>
                                          {gpo.type}
                                      </span>
                                  </td>
                                  <td className="px-4 py-2 text-gray-400">{gpo.primaryCategory}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* RIGHT COL: Recommendations */}
          <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-200 border-b border-gray-700 pb-2">Proposed Logical Groups</h3>
              <p className="text-sm text-gray-400">
                  Groups created based on functional similarity. Merging these reduces complexity and keeps like-minded settings together.
              </p>

              <div className="space-y-4">
                  {result.recommendations.map((rec, idx) => (
                      <div key={idx} className="bg-gray-800/30 border border-gray-700 hover:border-indigo-500/50 transition-colors rounded-lg p-5">
                          <div className="flex justify-between items-start mb-3">
                              <div>
                                  <h4 className="text-lg font-bold text-indigo-300">{rec.groupName}</h4>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{rec.type} Configuration Group</p>
                              </div>
                              <span className="bg-indigo-900/30 text-indigo-300 px-2 py-1 rounded text-xs border border-indigo-700/50 whitespace-nowrap">
                                  {rec.suggestedGpos.length} GPOs
                              </span>
                          </div>
                          
                          <p className="text-sm text-gray-300 mb-4">{rec.description}</p>
                          
                          <div className="bg-black/30 p-3 rounded border border-gray-700/50">
                              <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">Candidates for Grouping:</p>
                              <div className="flex flex-wrap gap-2">
                                  {rec.suggestedGpos.map((gpo) => (
                                      <span key={gpo} className="text-xs font-mono bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                          {gpo}
                                      </span>
                                  ))}
                              </div>
                          </div>
                          <div className="mt-3 text-xs text-gray-500 italic">
                              Reason: {rec.reason}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};
