
import React, { useState } from 'react';

interface ScriptDisplayProps {
  script: string;
}

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

const TerminalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-5.571 3-5.571-3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.5v9l9.75 5.25 9.75-5.25v-9l-9.75-5.25L2.25 7.5z" />
    </svg>
);

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-3-3m0 0l3-3m-3 3h7.5" transform="rotate(-90 12 12)" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13.5" />
    </svg>
);


export const ScriptDisplay: React.FC<ScriptDisplayProps> = ({ script }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([script], { type: 'text/powershell' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GPO_Analysis_Script.ps1';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center">
            <div className="p-3 bg-cyan-900/30 rounded-lg mr-3 border border-cyan-500/20">
                <TerminalIcon className="w-8 h-8 text-cyan-300"/>
            </div>
            <div>
                 <h2 className="text-xl font-bold text-cyan-300">Analysis Script</h2>
                 <p className="text-sm text-gray-400">Advanced PowerShell logic generated for this analysis.</p>
            </div>
        </div>
        <div className="flex space-x-3">
             <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors border border-gray-600 text-gray-200"
            >
              <DownloadIcon className="w-5 h-5 mr-2" />
              Save .ps1
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-md text-sm font-medium transition-colors text-white shadow-lg shadow-cyan-900/50"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-5 h-5 mr-2" />
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
      </div>
    </div>
  );
};
