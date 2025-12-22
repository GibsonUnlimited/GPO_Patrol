
import React from 'react';

interface CacheModalProps {
  isOpen: boolean;
  onLoad: () => void;
  onNewRun: () => void;
  onClose: () => void;
  timestamp: string;
}

const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BoltIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

export const CacheModal: React.FC<CacheModalProps> = ({ isOpen, onLoad, onNewRun, onClose, timestamp }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
            <div className="flex items-center mb-4">
                <div className="bg-cyan-900/30 p-3 rounded-full border border-cyan-500/30 mr-4">
                    <ClockIcon className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-100">Previous Analysis Found</h3>
                    <p className="text-sm text-gray-400">We found existing results matching these exact files.</p>
                </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 mb-6">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Last Run Timestamp</p>
                <p className="text-gray-200 font-mono text-sm">{new Date(parseInt(timestamp)).toLocaleString()}</p>
            </div>

            <div className="space-y-3">
                <button
                    onClick={onLoad}
                    className="w-full flex items-center justify-center px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(8,145,178,0.4)] group"
                >
                    <BoltIcon className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                    Load Previous Results (Instant)
                </button>
                
                <button
                    onClick={onNewRun}
                    className="w-full flex items-center justify-center px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors border border-gray-700 hover:border-gray-600"
                >
                    <ArrowPathIcon className="w-5 h-5 mr-2" />
                    Run New Analysis
                </button>
            </div>
        </div>
        <div className="px-6 py-3 bg-gray-950 border-t border-gray-800 flex justify-center">
            <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-300">
                Cancel
            </button>
        </div>
      </div>
    </div>
  );
};
