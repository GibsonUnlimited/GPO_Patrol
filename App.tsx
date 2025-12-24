
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { GpoInputForm } from './components/GpoInputForm';
import { GpoFolderInput } from './components/GpoFolderInput';
import { GpoOneToAllInputForm } from './components/GpoOneToAllInputForm';
import { GpoConsolidatorForm } from './components/GpoConsolidatorForm';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { OrganizationDisplay } from './components/OrganizationDisplay';
import { AnalysisProgress } from './components/AnalysisProgress';
import { ScriptDisplay } from './components/ScriptDisplay';
import { PrioritySelector } from './components/PrioritySelector';
import { generateGpoScriptAndAnalysis, generateConsolidatedGpo, generateOrganizationAnalysis } from './services/geminiService';
import { SettingsModal } from './components/SettingsModal';
import type { Analysis, AnalysisResponse, ProgressState, LogEntry, OrganizationAnalysis, PriorityItem } from './types';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

type InputMethod = 'workshop' | 'bulk';
type LogicMode = 'analysis' | 'organization';
type ViewMode = 'landing' | 'input' | 'consolidator';
type AppState = 'idle' | 'processing' | 'displaying_analysis' | 'displaying_organization' | 'error' | 'pending_priorities';

const App: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('landing');
    const [appState, setAppState] = useState<AppState>('idle');
    const [inputMethod, setInputMethod] = useState<InputMethod>('workshop');
    const [logicMode, setLogicMode] = useState<LogicMode>('analysis');
    const [bulkSubTab, setBulkSubTab] = useState<'folder' | 'sync'>('folder');
    
    const [pendingGpoData, setPendingGpoData] = useState<any>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
    const [organizationResult, setOrganizationResult] = useState<OrganizationAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<ProgressState | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isProTier, setIsProTier] = useState<boolean>(false);

    useEffect(() => {
        const checkTier = async () => {
            if (window.aistudio?.hasSelectedApiKey) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setIsProTier(hasKey);
            }
        };
        checkTier();
    }, []);

    const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
        const entry: LogEntry = { timestamp: new Date().toLocaleTimeString(), message, type };
        setLogs(prev => [...prev, entry]);
    }, []);

    const handleUpgradeTier = async () => {
        if (window.aistudio?.openSelectKey) {
            await window.aistudio.openSelectKey();
            setIsProTier(true);
            setError(null);
            addLog("Professional Tier authenticated.", "success");
        }
    };

    const handleHome = () => {
        setAppState('idle');
        setError(null);
        setAnalysisResult(null);
        setOrganizationResult(null);
        setProgress(null);
        setLogs([]);
        setViewMode('landing');
    };

    const handleReset = () => {
        setError(null);
        setAppState('idle');
        setLogs([]);
    };

    const executeAnalyzer = async (gpoData: any, priorities: PriorityItem[]) => {
        setAppState('processing');
        setError(null);
        setLogs([]);
        addLog(`Initializing Analysis Hub with main focus on ${priorities[0]}...`, "info");
        try {
            const result = await generateGpoScriptAndAnalysis({ ...gpoData, priorities }, setProgress, (p) => {
                addLog(`Analyzed segment. Total found: ${p.consolidation?.length || 0} consolidation targets.`, "success");
            });
            setAnalysisResult(result);
            setAppState('displaying_analysis');
        } catch (err: any) {
            setError(err.message);
            addLog(`CRITICAL FAILURE: ${err.message}`, "error");
            setAppState('error');
        }
    };

    const executeOrganizer = async (contents: string[], priorities: PriorityItem[]) => {
        setAppState('processing');
        setError(null);
        setLogs([]);
        addLog(`Analyzing logical structures prioritizing ${priorities[0]}...`, "info");
        try {
            const result = await generateOrganizationAnalysis(contents, priorities, setProgress);
            setOrganizationResult(result);
            addLog("Structural analysis complete.", "success");
            setAppState('displaying_organization');
        } catch (err: any) {
            setError(err.message);
            addLog(`ORGANIZATION FAILURE: ${err.message}`, "error");
            setAppState('error');
        }
    };

    const handleGpoDataReady = useCallback((gpoData: any) => {
        setPendingGpoData(gpoData);
        setAppState('pending_priorities');
    }, []);

    const handleConfirmPriorities = useCallback(async (priorities: PriorityItem[]) => {
        if (!pendingGpoData) return;
        const contents = pendingGpoData.baseGpo ? [...pendingGpoData.comparisonGpos, pendingGpoData.baseGpo] : pendingGpoData.comparisonGpos;
        if (logicMode === 'organization') {
            executeOrganizer(contents, priorities);
        } else {
            executeAnalyzer(pendingGpoData, priorities);
        }
    }, [logicMode, pendingGpoData]);

    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-100 selection:bg-cyan-500/30">
            <Header isProTier={isProTier} onOpenSettings={() => setIsSettingsModalOpen(true)} />
            
            {appState === 'pending_priorities' && (
                <PrioritySelector 
                  onConfirm={handleConfirmPriorities} 
                  onCancel={() => setAppState('idle')} 
                  isLoading={false}
                />
            )}

            {appState === 'error' && (
                <div className="bg-red-950/40 border-y border-red-500/30 py-4 px-6 flex flex-col items-center animate-fade-in">
                    <div className="flex items-center justify-between w-full max-w-6xl">
                        <div className="flex items-center text-red-200">
                            <span className="font-bold mr-2">NEXUS LINK FAILURE:</span>
                            <span className="text-sm opacity-90">{error}</span>
                        </div>
                        <button onClick={handleReset} className="px-4 py-1.5 bg-red-600 hover:bg-red-500 rounded-md text-xs font-bold">Retry</button>
                    </div>
                </div>
            )}

            <main className="flex-grow container mx-auto px-6 py-12 max-w-[100%]">
                {viewMode === 'landing' && (
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        <div className="text-center mb-16">
                            <h1 className="nexus-text text-5xl md:text-6xl font-black mb-6">Carlisle Policy Control</h1>
                            <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
                                Forensic GPO management for optimized forest performance and security.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <button onClick={() => { setInputMethod('workshop'); setLogicMode('analysis'); setViewMode('input'); }} className="group p-10 hologram-card rounded-3xl text-left border border-white/5 hover:border-cyan-500/40 transition-all">
                                <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                                   <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                </div>
                                <h2 className="text-xl font-bold mb-4 group-hover:text-cyan-300 transition-colors">Efficiency Analysis Hub</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">Prioritize consolidation to minimize total GPO count. Identifies 100% matches in Linked OUs, Security Filtering, and Delegation.</p>
                            </button>
                            <button onClick={() => { setInputMethod('bulk'); setLogicMode('organization'); setViewMode('input'); }} className="group p-10 hologram-card rounded-3xl text-left border border-indigo-500/20 hover:border-indigo-500/60 transition-all bg-indigo-500/5">
                                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/40 group-hover:scale-110 transition-transform">
                                   <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                </div>
                                <h2 className="text-xl font-bold mb-4 group-hover:text-indigo-300 transition-colors">Logical Policy Optimizer</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">Organize settings into like-minded groups. Enforce User/Computer separation to minimize GPO count and accelerate sign-on times.</p>
                            </button>
                            <button onClick={() => setViewMode('consolidator')} className="group p-10 hologram-card rounded-3xl text-left border border-white/5 hover:border-orange-500/40 transition-all">
                                <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 border border-orange-500/20 group-hover:scale-110 transition-transform">
                                   <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                </div>
                                <h2 className="text-xl font-bold mb-4 group-hover:text-orange-300 transition-colors">Merge Compatibility Checker</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">Perform deep-dive research into GPO compatibility for safe merging of redundant or fragmented policies.</p>
                            </button>
                        </div>
                    </div>
                )}

                {viewMode === 'input' && appState !== 'error' && (
                   <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
                            <button onClick={handleHome} className="text-cyan-500 hover:text-cyan-400 flex items-center font-mono text-sm tracking-widest uppercase">
                                <span className="mr-2">&larr;</span> Terminate Session
                            </button>
                            
                            {appState === 'idle' && (
                                <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-white/10 shadow-2xl">
                                    <button 
                                        onClick={() => setLogicMode('analysis')}
                                        className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${logicMode === 'analysis' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        Audit Efficiency
                                    </button>
                                    <button 
                                        onClick={() => setLogicMode('organization')}
                                        className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${logicMode === 'organization' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        Functional Logic
                                    </button>
                                </div>
                            )}
                        </div>

                        {appState === 'processing' ? (
                            <AnalysisProgress progress={progress} title={logicMode === 'analysis' ? "AUDITING CONSOLIDATION VECTORS..." : "MAPPING FUNCTIONAL STRUCTURES..."} logs={logs} />
                        ) : appState === 'displaying_analysis' && analysisResult ? (
                            <div className="w-full space-y-10 animate-fade-in">
                                {analysisResult.script && <ScriptDisplay script={analysisResult.script} />}
                                <AnalysisDisplay analysis={analysisResult.analysis} />
                            </div>
                        ) : appState === 'displaying_organization' && organizationResult ? (
                             <OrganizationDisplay result={organizationResult} />
                        ) : (
                            <div className="animate-fade-in">
                                <div className="flex space-x-3 mb-8 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5 w-fit mx-auto shadow-inner">
                                    <button onClick={() => setInputMethod('workshop')} className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${inputMethod === 'workshop' ? 'bg-cyan-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Workshop Lab</button>
                                    <button onClick={() => setInputMethod('bulk')} className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${inputMethod === 'bulk' ? 'bg-cyan-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Bulk Repository</button>
                                </div>
                                <div className="max-w-4xl mx-auto">
                                    {inputMethod === 'workshop' && <GpoInputForm onGenerate={(g) => handleGpoDataReady({ comparisonGpos: g })} isLoading={false} />}
                                    {inputMethod === 'bulk' && (
                                        <div className="space-y-6">
                                            <div className="flex space-x-2 bg-slate-900/50 p-1 rounded-lg border border-white/5 w-fit">
                                                <button onClick={() => setBulkSubTab('folder')} className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${bulkSubTab === 'folder' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>Upload Stream</button>
                                                <button onClick={() => setBulkSubTab('sync')} className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${bulkSubTab === 'sync' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>Forest Sync (1-to-All)</button>
                                            </div>
                                            {bulkSubTab === 'folder' ? (
                                                <GpoFolderInput onGenerate={(g) => handleGpoDataReady({ comparisonGpos: g })} isLoading={false} />
                                            ) : (
                                                <GpoOneToAllInputForm onGenerate={handleGpoDataReady} isLoading={false} />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                   </div>
                )}

                {viewMode === 'consolidator' && (
                     <div className="max-w-4xl mx-auto animate-fade-in">
                        <button onClick={handleHome} className="mb-8 text-orange-500 hover:text-orange-400 flex items-center font-mono text-sm tracking-widest uppercase">
                            <span className="mr-2">&larr;</span> Terminate Session
                        </button>
                        <GpoConsolidatorForm onGenerate={() => {}} isLoading={false} />
                     </div>
                )}
            </main>
            <footer className="p-10 text-center text-gray-600 text-[10px] font-mono tracking-[0.4em] uppercase border-t border-white/5 bg-slate-950/40">
                GPO SENTRY &bull; Forensic Forest Intelligence &bull; v4.2.0-PRO
            </footer>
            <SettingsModal isOpen={isSettingsModalOpen} isProTier={isProTier} onUpgradeTier={handleUpgradeTier} onClose={() => setIsSettingsModalOpen(false)} />
        </div>
    );
};

export default App;
