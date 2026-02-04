
import React, { useState, useEffect, useRef } from 'react';
import type { PerformanceConfig } from '../types';

interface HeaderProps {
    onOpenSettings: () => void;
}

const CarlisleLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Geometric Outer Frame - Carlisle Corporate Style */}
    <path d="M10 30L50 10L90 30V70L50 90L10 70V30Z" stroke="currentColor" strokeWidth="4" className="text-cyan-500" />
    {/* Stylized 'C' */}
    <path d="M70 35C65 28 55 25 45 25C30 25 20 35 20 50C20 65 30 75 45 75C55 75 65 72 70 65" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-white" />
    <path d="M55 50H75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-cyan-400 opacity-50" />
  </svg>
);

const CogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 012.6-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CpuChipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21M8.25 6.75h7.5a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-7.5a2.25 2.25 0 012.25-2.25zM10.5 10.5h3v3h-3v-3z" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const headerRef = useRef<HTMLElement>(null);
  const [highMem, setHighMem] = useState(false);

  useEffect(() => {
    const updateMemStatus = () => {
        const perfStr = localStorage.getItem('gpo_perf_config');
        if (perfStr) {
            const config: PerformanceConfig = JSON.parse(perfStr);
            setHighMem(config.highMemoryMode);
        }
    };
    
    updateMemStatus();
    window.addEventListener('perf_config_updated', updateMemStatus);
    return () => window.removeEventListener('perf_config_updated', updateMemStatus);
  }, []);

  return (
    <header 
        ref={headerRef}
        className="relative bg-slate-950 border-b border-white/5 sticky top-0 z-10"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4 relative z-10 px-2 py-1 rounded-full cursor-default">
            <CarlisleLogo className="w-10 h-10 relative z-10" />
            <div className="relative z-10 hidden sm:block">
                <svg width="250" height="30" viewBox="0 0 250 30" aria-labelledby="carlisle-control-title">
                    <title id="carlisle-control-title">Carlisle Policy Control</title>
                    <text x="0" y="22" fontFamily="Inter, sans-serif" fontSize="18" fontWeight="bold" fill="#f8fafc">
                        Carlisle Policy Control
                    </text>
                </svg>
            </div>
          </div>
          
          <div className="relative z-10 flex items-center space-x-4">
            {highMem && (
                <div className="hidden lg:flex items-center bg-cyan-900/30 border border-cyan-500/30 px-3 py-1 rounded-md animate-pulse">
                    <CpuChipIcon className="w-3.5 h-3.5 text-cyan-400 mr-2" />
                    <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">Status: 64GB RAM Allocated</span>
                </div>
            )}
            <div className="hidden md:block text-right">
                <p className="text-[9px] font-black text-cyan-500 uppercase tracking-[0.2em] leading-none">Forensic Division</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Infrastructure: {highMem ? 'Enterprise' : 'Cloud'}</p>
            </div>
            <button 
                onClick={onOpenSettings}
                className="p-2 text-gray-400 hover:text-cyan-400 transition-colors bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30"
                aria-label="Settings"
            >
                <CogIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
