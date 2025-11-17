import React, { useState, useMemo } from 'react';
import type { ConsolidationResult, SourceMapEntry } from '../types';

interface ConsolidationDisplayProps {
  result: ConsolidationResult;
}

// --- ICONS ---
const ClipboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
);
const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);
const CodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>
);
const TerminalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-5.571 3-5.571-3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.5v9l9.75 5.25 9.75-5.25v-9l-9.75-5.25L2.25 7.5z" />
    </svg>
);
const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

// --- SUB-COMPONENTS ---
const CodeBlock: React.FC<{ title: string; content: string; language: string; icon: React.ReactNode; }> = ({ title, content, language, icon }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center">
                    {icon}
                    <h2 className="text-xl font-bold text-cyan-300">{title}</h2>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {copied ? (
                        <>
                            <CheckIcon className="w-5 h-5 mr-2 text-green-400" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <ClipboardIcon className="w-5 h-5 mr-2" />
                            Copy
                        </>
                    )}
                </button>
            </div>
            <div className="p-1 flex-grow">
                <pre className="bg-black/50 p-4 rounded-md text-sm overflow-x-auto h-full min-h-[50vh] whitespace-pre-wrap">
                    <code className={`language-${language} text-gray-200`}>
                        {content}
                    </code>
                </pre>
            </div>
        </div>
    );
};

const SourceMapTable: React.FC<{ sourceMap: SourceMapEntry[] }> = ({ sourceMap }) => {
    const [filter, setFilter] = useState('');
    const filteredMap = useMemo(() =>
        sourceMap.filter(item =>
            item.settingName.toLowerCase().includes(filter.toLowerCase()) ||
            item.sourceGpoName.toLowerCase().includes(filter.toLowerCase())
        ), [sourceMap, filter]);

    return (
        <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 p-4">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Setting Source Map</h3>
            <p className="text-sm text-gray-400 mb-4">An audit trail for every setting in the new GPO.</p>
            <div className="relative mb-4">
                <SearchIcon className="w-5 h-5 text-gray-500 absolute top-1/2 left-3 -translate-y-1/2" />
                <input type="text" placeholder="Filter settings or sources..." value={filter} onChange={e => setFilter(e.target.value)}
                    className="w-full bg-gray-900/70 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-sm text-gray-200 focus:ring-cyan-500"/>
            </div>
            <div className="overflow-x-auto max-h-96">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase tracking-wider sticky top-0">
                        <tr>
                            <th className="px-4 py-2 font-medium">Final Setting</th>
                            <th className="px-4 py-2 font-medium">Source GPO</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                        {filteredMap.map((item, index) => (
                            <tr key={index}>
                                <td className="px-4 py-2 font-mono text-gray-300 break-all">{item.settingName}</td>
                                <td className="px-4 py-2"><span className="bg-cyan-900/50 text-cyan-300 font-mono text-xs px-2 py-1 rounded">{item.sourceGpoName}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const ConsolidationDisplay: React.FC<ConsolidationDisplayProps> = ({ result }) => {
    const { gpoXml, script, mergeReport } = result;
    const hasOverwrittenSettings = mergeReport.overwrittenSettings.length > 0;

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-200">Consolidation Complete</h2>
                <p className="text-gray-400 mt-2 max-w-3xl mx-auto">
                    Your GPOs have been merged. Review the detailed Merge Report for an audit of all changes, then use the Generated Assets to deploy the new policy.
                </p>
            </div>
            
            {/* --- MERGE REPORT --- */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-cyan-300 border-b-2 border-cyan-500/50 pb-2">Merge Report</h2>
                
                <div className="prose prose-invert prose-sm text-gray-300 max-w-none p-4 bg-black/30 rounded-md border border-gray-700/50">
                    <p className="font-medium text-gray-200 flex items-center"><InfoIcon className="w-5 h-5 mr-2 text-cyan-400" /> Executive Summary</p>
                    <p>{mergeReport.summary}</p>
                </div>

                {hasOverwrittenSettings && (
                    <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 p-4">
                        <h3 className="text-lg font-semibold text-red-400 mb-2">Overwritten Settings</h3>
                        <p className="text-sm text-gray-400 mb-4">These settings existed in multiple GPOs. The "Winning" value was applied based on the order you provided.</p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-2 font-medium">Setting</th>
                                        <th className="px-4 py-2 font-medium">Overwritten GPO & Value</th>
                                        <th className="px-4 py-2 font-medium">Winning GPO & Value</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                                    {mergeReport.overwrittenSettings.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 font-mono text-gray-300 align-top break-all">{item.settingName}</td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-col gap-1">
                                                    <span className="bg-red-900/50 text-red-300 font-mono text-xs px-2 py-1 rounded self-start">{item.overwrittenGpoName}</span>
                                                    <p className="text-gray-400 font-mono break-all">{item.overwrittenValue}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                 <div className="flex flex-col gap-1">
                                                    <span className="bg-cyan-900/50 text-cyan-300 font-mono text-xs px-2 py-1 rounded self-start">{item.winningGpoName}</span>
                                                    <p className="text-gray-200 font-mono break-all">{item.winningValue}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <SourceMapTable sourceMap={mergeReport.sourceMap} />
            </div>

            {/* --- GENERATED ASSETS --- */}
            <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-cyan-300 border-b-2 border-cyan-500/50 pb-2">Generated Assets</h2>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <CodeBlock 
                        title="Consolidated GPO Report"
                        content={gpoXml}
                        language="xml"
                        icon={<CodeIcon className="w-7 h-7 text-cyan-300 mr-3"/>}
                    />
                    <CodeBlock 
                        title="PowerShell Creation Script"
                        content={script}
                        language="powershell"
                        icon={<TerminalIcon className="w-7 h-7 text-cyan-300 mr-3"/>}
                    />
                </div>
            </div>
        </div>
    );
};