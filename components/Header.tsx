
import React, { useState, useEffect, useRef } from 'react';

interface HeaderProps {
    onOpenSettings: () => void;
    isProTier?: boolean;
}

const NexusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
    <path d="M12 2L12 22M2 12L22 12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
    <rect x="8.5" y="8.5" width="7" height="7" rx="1" className="fill-cyan-500/10 stroke-cyan-400" strokeWidth="2" />
    <path d="M7 7L17 17M17 7L7 17" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
    <circle cx="12" cy="12" r="3.5" className="fill-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
  </svg>
);

const CogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, isProTier }) => {
  return (
    <header className="relative bg-slate-950/80 backdrop-blur-2xl border-b border-cyan-500/20 sticky top-0 z-50 overflow-hidden h-24 flex items-center shadow-2xl group/header">
      <style>{`
        @keyframes full-orbit {
          from { transform: perspective(1000px) rotateY(0deg) rotateX(10deg); }
          to { transform: perspective(1000px) rotateY(360deg) rotateX(10deg); }
        }
        @keyframes reverse-orbit {
          from { transform: perspective(1000px) rotateY(360deg) rotateX(-20deg); }
          to { transform: perspective(1000px) rotateY(0deg) rotateX(-20deg); }
        }
        .animate-orbit { animation: full-orbit 12s linear infinite; }
        .animate-reverse-orbit { animation: reverse-orbit 8s linear infinite; }
        .siren-text {
          background: linear-gradient(to right, #ef4444 0%, #3b82f6 25%, #ffffff 45%, #ef4444 50%, #3b82f6 75%, #ef4444 100%);
          background-size: 400% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <div className="container mx-auto px-6 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-6">
          <div className="relative w-16 h-16 flex items-center justify-center transform-gpu">
            <div className="absolute inset-0 rounded-full border border-white/5"></div>
            <div className={`absolute w-14 h-14 border-2 ${isProTier ? 'border-indigo-500' : 'border-cyan-500/60'} rounded-full animate-orbit`}></div>
            <div className="absolute w-10 h-10 border-2 border-red-500/40 rounded-full animate-reverse-orbit"></div>
            <div className="relative z-20">
              <NexusIcon className={`w-8 h-8 ${isProTier ? 'text-indigo-400' : 'text-cyan-400'}`} />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center">
                <h1 className="siren-text nexus-text text-xl md:text-4xl font-black tracking-tighter">GPO PATROL</h1>
                {isProTier && <span className="ml-3 px-2 py-0.5 bg-indigo-600 text-[8px] font-black rounded text-white tracking-widest uppercase">Professional</span>}
            </div>
            <p className="text-[10px] text-cyan-500/60 uppercase tracking-[0.3em] font-mono">Forensic Forest Intelligence</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex flex-col text-right mr-4 border-r border-cyan-500/20 pr-4">
             <span className="text-[10px] text-gray-500 uppercase font-mono">Service Tier</span>
             <span className={`text-xs font-bold flex items-center justify-end ${isProTier ? 'text-indigo-400' : 'text-cyan-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${isProTier ? 'bg-indigo-500' : 'bg-cyan-500'}`}></span>
                {isProTier ? 'PRO TIER (UNLIMITED)' : 'FREE TIER (LIMITED)'}
             </span>
          </div>
          <button onClick={onOpenSettings} className="group/btn p-3 text-cyan-400 hover:text-white transition-all bg-slate-900/60 rounded-xl border border-white/10 hover:border-cyan-500/50 hover:bg-slate-800 shadow-xl">
            <CogIcon className="w-6 h-6 group-hover/btn:rotate-180 transition-transform duration-700" />
          </button>
        </div>
      </div>
    </header>
  );
};
