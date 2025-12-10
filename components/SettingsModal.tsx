
import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

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

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('user_gemini_api_key');
    if (storedKey) setApiKey(storedKey);
  }, [isOpen]);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('user_gemini_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('user_gemini_api_key');
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleFactoryReset = () => {
    if (confirm("Are you sure? This will delete all saved sessions, logs, and your API key from this browser. This cannot be undone.")) {
        localStorage.clear();
        setApiKey('');
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
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-100 flex items-center">
                <ShieldExclamationIcon className="w-6 h-6 mr-2 text-cyan-400" />
                Settings & Privacy
            </h2>
             <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-white transition-colors"
            >
                ✕
            </button>
        </div>
        
        <div className="p-6 space-y-8">
            
            {/* API Key Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                     <label className="block text-sm font-medium text-gray-300">Gemini API Key</label>
                     <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 underline">
                        Get an API Key
                     </a>
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Paste your Google Gemini API Key here..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-800 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm transition-colors"
                    />
                </div>
                <div className="flex justify-end">
                     <button
                        onClick={handleSaveKey}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            isSaved ? 'bg-green-600 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                        }`}
                     >
                        {isSaved ? 'Saved!' : 'Save Key'}
                     </button>
                </div>
                <p className="text-xs text-gray-500">
                    Your API Key is stored locally in your browser's LocalStorage. It is never sent to any server other than Google's Generative AI API during analysis.
                </p>
            </div>

            <hr className="border-gray-700" />

            {/* Privacy Disclaimer */}
            <div>
                <h3 className="text-sm font-bold text-gray-300 mb-2">Privacy & Data Handling</h3>
                <div className="bg-gray-800/50 p-4 rounded-md border border-gray-700/50 text-sm text-gray-400 space-y-2">
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
                <h3 className="text-sm font-bold text-red-400 mb-2">Danger Zone</h3>
                <div className="flex items-center justify-between bg-red-900/10 border border-red-900/30 p-4 rounded-md">
                    <div>
                        <p className="text-sm text-gray-300 font-medium">Factory Reset</p>
                        <p className="text-xs text-gray-500">Clears all sessions, logs, and API keys.</p>
                    </div>
                    <button 
                        onClick={handleFactoryReset}
                        className="flex items-center px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 rounded-md transition-colors text-sm"
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
