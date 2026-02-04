
import React, { useState, useEffect } from 'react';
import type { PerformanceConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const ShieldExclamationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
  </svg>
);

const BoltIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
  </svg>
);

const ServerStackIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.128 16.556 17.975 12 17.975s-8.25-1.847-8.25-4.125v-3.75m16.5 0v3.75" />
    </svg>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [highMem, setHighMem] = useState(false);

  useEffect(() => {
    const perfStr = localStorage.getItem('gpo_perf_config');
    if (perfStr) {
        const config: PerformanceConfig = JSON.parse(perfStr);
        setHighMem(config.highMemoryMode);
    }
  }, [isOpen]);

  const toggleHighMem = () => {
    const newVal = !highMem;
    setHighMem(newVal);
    localStorage.setItem('gpo_perf_config', JSON.stringify({ highMemoryMode: newVal }));
    // Notify app state for instant visual update
    window.dispatchEvent(new Event('perf_config_updated'));
  };

  const handleFactoryReset = () => {
    if (confirm("Are you sure? This will delete all saved sessions and logs.")) {
        localStorage.clear();
        alert("Application data cleared. The page will now reload.");
        window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
        onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
            <h2 className="text-xl font-bold text-gray-100 flex items-center">
                <ShieldExclamationIcon className="w-6 h-6 mr-2 text-cyan-400" />
                Settings & Forensic Config
            </h2>
             <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-white transition-colors p-2"
            >
                ✕
            </button>
        </div>
        
        <div className="p-6 space-y-8">
            
            {/* Server Infrastructure Profile */}
            <div className="bg-slate-800/40 border border-cyan-500/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <ServerStackIcon className="w-6 h-6 text-cyan-400 mr-3" />
                        <div>
                            <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider">Server Instance Profile</h3>
                            <p className="text-[10px] text-gray-500 uppercase font-mono">Resource Allocation Control</p>
                        </div>
                    </div>
                    <button 
                        onClick={toggleHighMem}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${highMem ? 'bg-cyan-600' : 'bg-gray-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${highMem ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Memory Allocation</span>
                        <span className={`text-xs font-bold font-mono ${highMem ? 'text-cyan-400' : 'text-gray-500'}`}>
                            {highMem ? '64GB OPTIMIZED' : 'STANDARD (8GB)'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Processing Parallelism</span>
                        <span className={`text-xs font-bold font-mono ${highMem ? 'text-cyan-400' : 'text-gray-500'}`}>
                            {highMem ? 'HIGH (8X CHUNKING)' : 'NORMAL (3X CHUNKING)'}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 italic">
                        * Use 64GB mode for fast forensic scanning of the entire forest. High memory mode enables larger data buffers and faster AI inference.
                    </p>
                </div>
            </div>

            {/* Quota & Limits Info */}
            <div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-5">
                <div className="flex items-center mb-3">
                    <BoltIcon className="w-5 h-5 text-blue-400 mr-2" />
                    <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider">Quota & Limits Management</h3>
                </div>
                <div className="space-y-3 text-xs text-gray-400 leading-relaxed">
                    <p>
                        Scanning large GPO datasets (25MB+) often triggers <span className="text-blue-300 font-bold">429: Resource Exhausted</span> errors.
                    </p>
                    <p className="font-bold text-gray-300">To increase your processing capacity:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-1">
                        <li>Switch to a paid tier GCP project if using a Pro model.</li>
                        <li>Monitor your TPM (Tokens Per Minute) and RPM (Requests Per Minute) limits.</li>
                    </ol>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="inline-block mt-2 text-cyan-400 font-bold hover:underline">
                        View Official Billing & Quota Docs ↗
                    </a>
                </div>
            </div>

            <hr className="border-gray-700" />

            {/* Privacy Disclaimer */}
            <div>
                <h3 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-tighter">Privacy & Data Handling</h3>
                <div className="bg-gray-800/50 p-4 rounded-md border border-gray-700/50 text-[11px] text-gray-400 space-y-2">
                    <p>
                        <strong className="text-gray-200">1. Data Processing:</strong> This application sends the GPO content you provide to Google's Gemini API for analysis. 
                        Do not upload data that violates your organization's data handling policies.
                    </p>
                    <p>
                        <strong className="text-gray-200">2. Local Storage:</strong> Analysis results and session data are stored in your browser's LocalStorage for convenience. 
                        This data remains on your device.
                    </p>
                    <p>
                        <strong className="text-gray-200">3. No Middleman:</strong> This tool is a client-side application. No data passes through a GPO Patrol server. 
                        Communication is directly between your browser and Google's APIs.
                    </p>
                </div>
            </div>

            <hr className="border-gray-700" />

            {/* Danger Zone */}
            <div>
                <h3 className="text-sm font-bold text-red-400 mb-2 uppercase tracking-tighter">Danger Zone</h3>
                <div className="flex items-center justify-between bg-red-900/10 border border-red-900/30 p-4 rounded-md">
                    <div>
                        <p className="text-sm text-gray-300 font-medium">Factory Reset</p>
                        <p className="text-[10px] text-gray-500">Clears all sessions and logs.</p>
                    </div>
                    <button 
                        onClick={handleFactoryReset}
                        className="flex items-center px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 rounded-md transition-colors text-xs font-bold uppercase"
                    >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Reset App
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
