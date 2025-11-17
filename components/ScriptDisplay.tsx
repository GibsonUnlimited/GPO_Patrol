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


export const ScriptDisplay: React.FC<ScriptDisplayProps> = ({ script }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <div className="flex items-center">
            <TerminalIcon className="w-7 h-7 text-cyan-300 mr-3"/>
            <h2 className="text-xl font-bold text-cyan-300">Advanced PowerShell Script</h2>
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
              Copy Script
            </>
          )}
        </button>
      </div>
      <div className="p-4 flex-grow">
        <p className="text-sm text-gray-400 mb-4 px-1">This script now includes advanced parameters for targeting specific domains, OUs, and settings. Check the script's comment-based help for usage details.</p>
        <pre className="bg-black/50 p-4 rounded-md text-sm overflow-x-auto h-[60vh] whitespace-pre-wrap">
          <code className="language-powershell text-gray-200">
            {script}
          </code>
        </pre>
      </div>
    </div>
  );
};