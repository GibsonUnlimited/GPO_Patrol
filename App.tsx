
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { GpoInputForm } from './components/GpoInputForm';
import { GpoFolderInput } from './components/GpoFolderInput';
import { GpoOneToAllInputForm } from './components/GpoOneToAllInputForm';
import { GpoConsolidatorForm } from './components/GpoConsolidatorForm';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { ConsolidationDisplay } from './components/ConsolidationDisplay';
import { AnalysisProgress } from './components/AnalysisProgress';
import { ForensicVault } from './components/ForensicVault';
import { generateGpoScriptAndAnalysis, generateConsolidatedGpo } from './services/geminiService';
import { ReportToolbar } from './components/ReportToolbar';
import { AnalyzedGpoList } from './components/AnalyzedGpoList';
import { ScriptsModal } from './components/ScriptsModal';
import { SettingsModal } from './components/SettingsModal';
import { ScriptDisplay } from './components/ScriptDisplay';
import type { Analysis, AnalysisResponse, ProgressState, ConsolidationResult, LogEntry, VaultEntry } from './types';

// Add global declaration for AI Studio helpers
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    /**
     * Fix: Restored readonly to match the global aistudio definition provided by the environment.
     * This ensures the extended property has identical modifiers to existing global definitions, 
     * resolving the TypeScript error "All declarations of 'aistudio' must have identical modifiers."
     */
    readonly aistudio: AIStudio;
  }
}

type AnalyzerTab = 'paste' | 'folder' | 'one-to-all';
type ViewMode = 'landing' | 'analyzer' | 'consolidator';
type AppState = 'idle' | 'analyzing' | 'consolidating' | 'displaying_analysis' | 'displaying_consolidation';

const SAVE_KEY = 'gpoAnalysisSession';
const VAULT_KEY = 'gpo_sentry_vault';

// --- Icons ---
const LockClosedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);
const BoltIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
  </svg>
);
const BookOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);
const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);
const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);
const FolderOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
);

const AnalyzerAnimatedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-cyan-300">
     <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const ConsolidatorAnimatedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-sky-300">
        <circle cx="12" cy="12" r="3" className="fill-sky-500/20" />
        <g>
            <circle cx="5" cy="5" r="2" className="fill-sky-300" />
            <circle cx="19" cy="5" r="2" className="fill-sky-300" />
            <circle cx="5" cy="19" r="2" className="fill-sky-300" />
            <circle cx="19" cy="19" r="2" className="fill-sky-300" />
        </g>
    </svg>
);


interface GpoData {
    baseGpo?: string;
    comparisonGpos: string[];
}

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [appState, setAppState] = useState<AppState>('idle');
  const [analyzerTab, setAnalyzerTab] = useState<AnalyzerTab>('paste');
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [consolidationResult, setConsolidationResult] = useState<ConsolidationResult | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSessionAvailable, setIsSessionAvailable] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [isScriptsModalOpen, setIsScriptsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const checkKey = async () => {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    };
    checkKey();

    if (localStorage.getItem(SAVE_KEY)) {
      setIsSessionAvailable(true);
    }
  }, []);

  const handleSelectKey = async () => {
    await window.aistudio.openSelectKey();
    // Assume success per instructions to avoid race conditions
    setHasApiKey(true);
  };

  const handleRestore = (result: AnalysisResponse) => {
    setAnalysisResult(result);
    setAppState('displaying_analysis');
    setViewMode('analyzer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadSession = () => {
    try {
      const savedJson = localStorage.getItem(SAVE_KEY);
      if (savedJson) {
        const savedResult: AnalysisResponse = JSON.parse(savedJson);
        handleRestore(savedResult);
        setLogs([{ timestamp: new Date().toLocaleTimeString(), type: 'success', message: 'Session restored from Browser Storage.' }]);
      }
    } catch (e) {
      console.error("Failed to load session:", e);
      setError("Could not load the saved session.");
      localStorage.removeItem(SAVE_KEY);
      setIsSessionAvailable(false);
    }
  };

  const handleSessionFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = e.target?.result as string;
            const parsed = JSON.parse(json);
            if (parsed.analysis && parsed.analysis.stats) {
                setAnalysisResult(parsed);
                setError(null);
                setViewMode('analyzer');
                setAppState('displaying_analysis');
                setLogs([{ timestamp: new Date().toLocaleTimeString(), type: 'success', message: 'Session loaded successfully from file.' }]);
            } else {
                throw new Error("Invalid session file format.");
            }
        } catch (err) {
            alert("Failed to load session file.");
            console.error(err);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleClearSession = () => {
    localStorage.removeItem(SAVE_KEY);
    setIsSessionAvailable(false);
    alert("Saved session data has been cleared.");
  };
  
  const handleHome = () => {
    setAppState('idle');
    setError(null);
    setAnalysisResult(null);
    setConsolidationResult(null);
    setProgress(null);
    setLogs([]);
    setViewMode('landing');
  };

  const handleReset = () => {
      setError(null);
      setAnalysisResult(null);
      setConsolidationResult(null);
      setAppState('idle');
  };

  const addLog = useCallback((log: LogEntry) => {
      setLogs(prev => [...prev, log]);
  }, []);

  const handleGenerate = useCallback(async (gpoData: GpoData) => {
    setAppState('analyzing');
    setError(null);
    setAnalysisResult(null);
    setConsolidationResult(null);
    setProgress(null);
    setLogs([]);

    const onPartialResultCallback = (partialAnalysis: Analysis) => {
        setAnalysisResult(prev => {
            if (!prev) {
                return { analysis: partialAnalysis, script: '' };
            } else {
                // Fixed: Included the missing 'roadmap' property to satisfy the 'Analysis' type requirement.
                const newAnalysis: Analysis = {
                    summary: prev.analysis.summary,
                    roadmap: {
                      phase1: [...(prev.analysis.roadmap?.phase1 || []), ...(partialAnalysis.roadmap?.phase1 || [])],
                      phase2: [...(prev.analysis.roadmap?.phase2 || []), ...(partialAnalysis.roadmap?.phase2 || [])],
                      phase3: [...(prev.analysis.roadmap?.phase3 || []), ...(partialAnalysis.roadmap?.phase3 || [])],
                    },
                    stats: {
                        totalGpos: prev.analysis.stats.totalGpos + partialAnalysis.stats.totalGpos,
                        highSeverityConflicts: prev.analysis.stats.highSeverityConflicts + partialAnalysis.stats.highSeverityConflicts,
                        mediumSeverityConflicts: prev.analysis.stats.mediumSeverityConflicts + partialAnalysis.stats.mediumSeverityConflicts,
                        overlaps: prev.analysis.stats.overlaps + partialAnalysis.stats.overlaps,
                        consolidationOpportunities: prev.analysis.stats.consolidationOpportunities + partialAnalysis.stats.consolidationOpportunities,
                        securityAlerts: (prev.analysis.stats.securityAlerts || 0) + (partialAnalysis.stats.securityAlerts || 0),
                        intuneReadyCount: (prev.analysis.stats.intuneReadyCount || 0) + (partialAnalysis.stats.intuneReadyCount || 0),
                    },
                    findings: [...prev.analysis.findings, ...partialAnalysis.findings],
                    consolidation: [...(prev.analysis.consolidation || []), ...(partialAnalysis.consolidation || [])],
                    securityRecommendations: [...(prev.analysis.securityRecommendations || []), ...(partialAnalysis.securityRecommendations || [])],
                    gpoDetails: [...prev.analysis.gpoDetails, ...partialAnalysis.gpoDetails],
                };
                newAnalysis.gpoDetails = newAnalysis.gpoDetails.filter((gpo, index, self) =>
                    index === self.findIndex((t) => (t.name === gpo.name))
                );
                return { analysis: newAnalysis, script: '' };
            }
        });
    };

    try {
      const result = await generateGpoScriptAndAnalysis(gpoData, setProgress, onPartialResultCallback, addLog);
      setAnalysisResult(result);
      
      try {
        const vaultStr = localStorage.getItem(VAULT_KEY);
        const vault: VaultEntry[] = vaultStr ? JSON.parse(vaultStr) : [];
        const newEntry: VaultEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            title: `Forest Scan - ${gpoData.comparisonGpos.length} GPOs`,
            fingerprint: Math.random().toString(36).substring(7).toUpperCase(),
            gpoCount: result.analysis.stats.totalGpos,
            data: result
        };
        localStorage.setItem(VAULT_KEY, JSON.stringify([newEntry, ...vault].slice(0, 50)));
        localStorage.setItem(SAVE_KEY, JSON.stringify(result));
        setIsSessionAvailable(true);
      } catch (e) {
          console.warn('Vault update failed (Storage limit reached).');
      }

      setAppState('displaying_analysis');
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        setError("API Key verification failed. Please select a valid paid API key.");
      } else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      }
      setAnalysisResult(null); 
      setAppState('idle');
    } finally {
      setProgress(null);
    }
  }, [addLog]);

  const handleConsolidate = useCallback(async (gpoContents: string[], newGpoName: string) => {
    setAppState('consolidating');
    setError(null);
    setAnalysisResult(null);
    setConsolidationResult(null);
    setProgress(null);
    setLogs([]);
    
    try {
        const result = await generateConsolidatedGpo(gpoContents, newGpoName, setProgress, addLog);
        setConsolidationResult(result);
        setAppState('displaying_consolidation');
    } catch (err: any) {
        if (err.message?.includes("Requested entity was not found")) {
          setHasApiKey(false);
          setError("API Key verification failed. Please select a valid paid API key.");
        } else {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
        setConsolidationResult(null);
        setAppState('idle');
        console.error(err);
    } finally {
        setProgress(null);
    }
  }, [addLog]);
  
  const TabButton: React.FC<{tabId: string; activeTab: string; setTab: (id: any) => void; children: React.ReactNode}> = ({ tabId, activeTab, setTab, children }) => (
    <button
      onClick={() => setTab(tabId)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        activeTab === tabId
          ? 'bg-cyan-600 text-white shadow-md'
          : 'text-gray-300 hover:bg-gray-700/80'
      }`}
    >
      {children}
    </button>
  );

  // --- API Key Auth Gate UI ---
  if (hasApiKey === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-cyan-500/30 rounded-3xl p-10 shadow-[0_0_50px_rgba(6,182,212,0.1)] animate-fade-in">
          <div className="w-20 h-20 bg-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-cyan-500/20">
             <LockClosedIcon className="w-10 h-10 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Secure Forest Access</h1>
          <p className="text-gray-400 mb-8 leading-relaxed text-sm">
            Carlisle Policy Control requires a <span className="text-cyan-400 font-bold">Paid Tier API Key</span> to perform high-capacity domain forensic scans without quota interruption.
          </p>
          <button 
            onClick={handleSelectKey}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl shadow-lg shadow-cyan-900/40 transition-all active:scale-95 flex items-center justify-center"
          >
            <BoltIcon className="w-5 h-5 mr-2" />
            Connect Paid API Key
          </button>
          <div className="mt-8 pt-8 border-t border-white/5">
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noreferrer" 
              className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-cyan-400 transition-colors"
            >
              View Billing & Quota Requirements ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Loading state for auth check
  if (hasApiKey === null) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>;
  }

  const renderLanding = () => (
      <div className="max-w-6xl mx-auto mt-10 animate-fade-in">
          <div className="text-center mb-12">
               <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 mb-4 font-mono uppercase tracking-tighter">
                  Carlisle Policy Control: AD Forensic Intelligence
               </h1>
               <p className="text-xl text-gray-400">Scan, Detect, and Harden Group Policy across the entire Forest.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <button 
                  onClick={() => {
                      setViewMode('analyzer');
                      setAnalyzerTab('paste');
                  }}
                  className="group relative p-10 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-cyan-500/50 transition-all duration-300 text-left hover:shadow-[0_0_40px_rgba(6,182,212,0.25)] hover:-translate-y-1 overflow-hidden"
              >
                  <div className="relative z-10">
                      <div className="w-16 h-16 bg-cyan-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-cyan-500/20">
                          <AnalyzerAnimatedIcon />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-100 mb-3 group-hover:text-cyan-300 transition-colors">Forensic Analyzer</h2>
                      <p className="text-gray-400 leading-relaxed text-sm">
                          Deep scan for architectural violations. Identifies mixed User/Computer policies and groups like-minded settings for performance auditing.
                      </p>
                  </div>
              </button>
              
              <button 
                  onClick={() => setViewMode('consolidator')}
                  className="group relative p-10 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-sky-500/50 transition-all duration-300 text-left hover:shadow-[0_0_40_rgba(14,165,233,0.25)] hover:-translate-y-1 overflow-hidden"
              >
                   <div className="relative z-10">
                      <div className="w-16 h-16 bg-sky-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-sky-500/20">
                          <ConsolidatorAnimatedIcon />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-100 mb-3 group-hover:text-sky-300 transition-colors">Baseline Consolidator</h2>
                      <p className="text-gray-400 leading-relaxed text-sm">
                           Merge fragmented functional clusters into high-performance, single-purpose baselines with automated conflict resolution.
                      </p>
                   </div>
              </button>
          </div>
          
          <div className="mt-12 flex flex-col items-center space-y-4">
               <div className="flex flex-wrap justify-center gap-4">
                   <button 
                        onClick={() => setIsScriptsModalOpen(true)} 
                        className="inline-flex items-center px-6 py-3 border border-cyan-600/50 text-sm font-medium rounded-md text-cyan-300 bg-cyan-900/30 hover:bg-cyan-900/60 transition-colors"
                    >
                        <BookOpenIcon className="w-5 h-5 mr-2" />
                        Forensic Script Library
                    </button>

                    <button
                        onClick={() => {
                            setViewMode('analyzer');
                            setAnalyzerTab('folder');
                        }}
                        className="inline-flex items-center px-6 py-3 border border-indigo-500/50 text-sm font-medium rounded-md text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/60 transition-colors"
                    >
                        <FolderOpenIcon className="w-5 h-5 mr-2" />
                        Upload GPO Data Batch
                    </button>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleSessionFileUpload} 
                        className="hidden" 
                        accept=".json" 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="inline-flex items-center px-6 py-3 border border-gray-600/50 text-sm font-medium rounded-md text-gray-300 bg-gray-800/50 hover:bg-gray-800 transition-colors"
                    >
                        <UploadIcon className="w-5 h-5 mr-2" />
                        Load Report File
                    </button>
               </div>
          </div>

          <ForensicVault onRestore={handleRestore} />
      </div>
  );

  const renderAnalyzer = () => {
      const isLoading = appState === 'analyzing';
      const showResults = (appState === 'analyzing' && analysisResult) || appState === 'displaying_analysis';

      if (isLoading && logs.length > 0 && !analysisResult) {
          return <AnalysisProgress progress={progress} title="Deep Forest Scan Active" logs={logs} />;
      }

      const navHeader = (
        <div className="mb-6 flex items-center justify-between">
            <button 
                onClick={handleHome}
                disabled={isLoading}
                className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
            >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Dashboard
            </button>
            <h2 className="text-xl font-mono font-bold text-gray-300 uppercase tracking-widest hidden sm:block">Forensic Analyzer</h2>
        </div>
      );

      if (error) {
         return (
            <div className="max-w-4xl mx-auto">
                {navHeader}
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-6 rounded-lg shadow-lg animate-fade-in">
                    <h3 className="font-bold text-xl mb-2">Analysis Terminated</h3>
                    <p className="mb-4">{error}</p>
                    <button onClick={handleReset} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors">
                        Re-initialize
                    </button>
                </div>
            </div>
         );
      }

      if (showResults && analysisResult) {
         return (
            <div className="w-full max-w-[98%] mx-auto animate-fade-in">
                 {navHeader}
                 {appState === 'analyzing' && (
                    <AnalysisProgress progress={progress} title="Decoding Final Payload..." logs={logs} compact={true} />
                 )}
                 <ReportToolbar 
                        analysis={analysisResult.analysis}
                        script={analysisResult.script}
                        onClearSession={handleClearSession}
                        onSaveSession={() => {
                            localStorage.setItem(SAVE_KEY, JSON.stringify(analysisResult));
                            setIsSessionAvailable(true);
                        }}
                 />
                 <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-3 flex flex-col space-y-8">
                            <AnalysisDisplay analysis={analysisResult.analysis} />
                        </div>
                        <div className="lg:col-span-2 flex flex-col space-y-8">
                            <ScriptDisplay script={analysisResult.script} />
                            <AnalyzedGpoList analysis={analysisResult.analysis} />
                        </div>
                 </div>
            </div>
         )
      }

      return (
          <div className="max-w-4xl mx-auto animate-fade-in">
            {navHeader}
            <div className="mb-4 flex space-x-2 p-1 bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 self-start inline-block">
                <TabButton tabId="paste" activeTab={analyzerTab} setTab={setAnalyzerTab}>All-vs-All Scan</TabButton>
                <TabButton tabId="one-to-all" activeTab={analyzerTab} setTab={setAnalyzerTab}>1-to-All Scan</TabButton>
                <TabButton tabId="folder" activeTab={analyzerTab} setTab={setAnalyzerTab}>Batch File Load</TabButton>
            </div>

            {analyzerTab === 'paste' && (
                <GpoInputForm onGenerate={(gpos) => handleGenerate({ comparisonGpos: gpos })} isLoading={isLoading} />
            )}
            {analyzerTab === 'one-to-all' && (
                <GpoOneToAllInputForm onGenerate={handleGenerate} isLoading={isLoading} />
            )}
            {analyzerTab === 'folder' && (
                <GpoFolderInput onGenerate={(gpos) => handleGenerate({ comparisonGpos: gpos })} isLoading={isLoading} />
            )}
          </div>
      );
  }

  const renderConsolidator = () => {
      const isLoading = appState === 'consolidating';
      if (isLoading && logs.length > 0 && !consolidationResult) {
          return <AnalysisProgress progress={progress} title="Synthesizing Functional Baseline" logs={logs} />;
      }

       const navHeader = (
        <div className="mb-6 flex items-center justify-between">
            <button 
                onClick={handleHome}
                disabled={isLoading}
                className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
            >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Dashboard
            </button>
            <h2 className="text-xl font-mono font-bold text-gray-300 uppercase tracking-widest hidden sm:block">Baseline Consolidator</h2>
        </div>
      );

      if (error) {
         return (
            <div className="max-w-4xl mx-auto">
                {navHeader}
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-6 rounded-lg shadow-lg animate-fade-in">
                    <h3 className="font-bold text-xl mb-2">Consolidation Failed</h3>
                    <p className="mb-4">{error}</p>
                    <button onClick={handleReset} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors">
                        Re-attempt
                    </button>
                </div>
            </div>
         );
      }

      if ((appState === 'consolidating' || appState === 'displaying_consolidation') && consolidationResult) {
          return (
              <div className="w-full max-w-[98%] mx-auto animate-fade-in">
                  {navHeader}
                  <ConsolidationDisplay result={consolidationResult} />
              </div>
          )
      }

      return (
          <div className="max-w-4xl mx-auto animate-fade-in">
              {navHeader}
              <div className="text-center mb-8">
                <p className="text-gray-400">
                    Merge fragmented policies into high-performance baseline configurations.
                </p>
              </div>
              <GpoConsolidatorForm onGenerate={handleConsolidate} isLoading={isLoading} />
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-100 selection:bg-cyan-500/30">
      <Header onOpenSettings={() => setIsSettingsModalOpen(true)} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-0 max-w-[100%]">
        {viewMode === 'landing' && renderLanding()}
        {viewMode === 'analyzer' && renderAnalyzer()}
        {viewMode === 'consolidator' && renderConsolidator()}
      </main>
      <footer className="bg-gray-900/50 border-t border-gray-800 mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p className="cursor-help font-mono uppercase tracking-[0.2em] text-[10px]">Carlisle Policy Control • AUTHORED BY DAMIEN GIBSON &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
      <ScriptsModal 
        isOpen={isScriptsModalOpen} 
        onClose={() => setIsScriptsModalOpen(false)} 
        generatedScript={analysisResult?.script} 
        analysis={analysisResult?.analysis}
      />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </div>
  );
};

export default App;
