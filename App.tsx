
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { GpoInputForm } from './components/GpoInputForm';
import { GpoFolderInput } from './components/GpoFolderInput';
import { GpoOneToAllInputForm } from './components/GpoOneToAllInputForm';
import { GpoConsolidatorForm } from './components/GpoConsolidatorForm';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { ConsolidationDisplay } from './components/ConsolidationDisplay';
import { AnalysisProgress } from './components/AnalysisProgress';
import { generateGpoScriptAndAnalysis, generateConsolidatedGpo } from './services/geminiService';
import { ReportToolbar } from './components/ReportToolbar';
import { AnalyzedGpoList } from './components/AnalyzedGpoList';
import { ScriptsModal } from './components/ScriptsModal';
import { SettingsModal } from './components/SettingsModal';
import { ScriptDisplay } from './components/ScriptDisplay';
import type { Analysis, AnalysisResponse, ProgressState, ConsolidationResult, LogEntry } from './types';

type AnalyzerTab = 'paste' | 'folder' | 'one-to-all';
type ViewMode = 'landing' | 'analyzer' | 'consolidator';
type AppState = 'idle' | 'analyzing' | 'consolidating' | 'displaying_analysis' | 'displaying_consolidation';

const SAVE_KEY = 'gpoAnalysisSession';

// --- Icons ---
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);
const LoadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
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
const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M6 16.5v2.25a2.25 2.25 0 01-2.25 2.25H3.75m11.25-18v11.25c0 1.242 1.008 2.25 2.25 2.25h2.25M15 1.5v2.25a2.25 2.25 0 002.25 2.25H19.5m-7.5-3v11.25c0 1.242 1.008 2.25 2.25 2.25h2.25M10.5 1.5v2.25a2.25 2.25 0 002.25 2.25H15" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 16.5h16.5" />
    </svg>
);
const MergeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25z" />
    </svg>
);
const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);


interface GpoData {
    baseGpo?: string;
    comparisonGpos: string[];
}

const App: React.FC = () => {
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
    if (localStorage.getItem(SAVE_KEY)) {
      setIsSessionAvailable(true);
    }
  }, []);

  const handleLoadSession = () => {
    try {
      const savedJson = localStorage.getItem(SAVE_KEY);
      if (savedJson) {
        const savedResult: AnalysisResponse = JSON.parse(savedJson);
        setAnalysisResult(savedResult);
        setError(null);
        setViewMode('analyzer');
        setAppState('displaying_analysis');
        setLogs([{ timestamp: new Date().toLocaleTimeString(), type: 'success', message: 'Session restored from Browser Storage.' }]);
      }
    } catch (e) {
      console.error("Failed to load session:", e);
      setError("Could not load the saved session. The data might be corrupted.");
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
            // Basic validation
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
            alert("Failed to load session file. It may be corrupted or invalid.");
            console.error(err);
        }
    };
    reader.readAsText(file);
    // Reset value so same file can be selected again
    event.target.value = '';
  };

  const handleClearSession = () => {
    localStorage.removeItem(SAVE_KEY);
    setIsSessionAvailable(false);
    alert("Saved session data has been cleared from local storage.");
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

  const handleGenerate = useCallback(async (gpoData: GpoData) => {
    setAppState('analyzing');
    setError(null);
    setAnalysisResult(null);
    setConsolidationResult(null);
    setProgress(null);
    setLogs([]);

    const onPartialResultCallback = (partialAnalysis: Analysis) => {
        const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const batchLogs: LogEntry[] = [];
        
        partialAnalysis.gpoDetails.forEach(gpo => {
            batchLogs.push({ timestamp, type: 'info', message: `Scanning Policy: "${gpo.name}"` });
            if (gpo.linkedOUs && gpo.linkedOUs.length > 0) {
                 gpo.linkedOUs.forEach(ou => 
                    batchLogs.push({ timestamp, type: 'detail', message: `   ↳ Linked to: ${ou}` })
                 );
            }
        });

        if (partialAnalysis.securityRecommendations && partialAnalysis.securityRecommendations.length > 0) {
             batchLogs.push({ timestamp, type: 'error', message: `   [!] FOUND ${partialAnalysis.securityRecommendations.length} SECURITY RISKS` });
        }

        partialAnalysis.findings.forEach(finding => {
             if (finding.type === 'Conflict') {
                 batchLogs.push({ timestamp, type: 'error', message: `   [!] CONFLICT: ${finding.setting} (${finding.severity})` });
             } else {
                 batchLogs.push({ timestamp, type: 'warning', message: `   [+] OVERLAP: ${finding.setting}` });
             }
        });
        
        batchLogs.push({ timestamp, type: 'success', message: `✓ Batch analysis processed.` });

        setLogs(prev => [...prev, ...batchLogs]);

        setAnalysisResult(prev => {
            if (!prev) {
                return { analysis: partialAnalysis, script: '' };
            } else {
                const newAnalysis: Analysis = {
                    summary: prev.analysis.summary,
                    stats: {
                        totalGpos: prev.analysis.stats.totalGpos + partialAnalysis.stats.totalGpos,
                        highSeverityConflicts: prev.analysis.stats.highSeverityConflicts + partialAnalysis.stats.highSeverityConflicts,
                        mediumSeverityConflicts: prev.analysis.stats.mediumSeverityConflicts + partialAnalysis.stats.mediumSeverityConflicts,
                        overlaps: prev.analysis.stats.overlaps + partialAnalysis.stats.overlaps,
                        consolidationOpportunities: prev.analysis.stats.consolidationOpportunities + partialAnalysis.stats.consolidationOpportunities,
                        securityAlerts: (prev.analysis.stats.securityAlerts || 0) + (partialAnalysis.stats.securityAlerts || 0),
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
      const totalGpos = (gpoData.baseGpo ? 1 : 0) + gpoData.comparisonGpos.length;
      // Require at least 2 GPOs for All-vs-All, but allow 1 for 1-to-All (if just generating script/baseline)
      const minGpos = gpoData.baseGpo ? 1 : 2;
      
      if (totalGpos < minGpos) {
        throw new Error(gpoData.baseGpo ? "Please provide at least the Base GPO." : "At least two GPO reports are required for analysis.");
      }
      const result = await generateGpoScriptAndAnalysis(gpoData, setProgress, onPartialResultCallback);
      
      setAnalysisResult(result);
      
      // Auto-save session
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(result));
        setIsSessionAvailable(true);
      } catch (e) {
          console.warn("Could not save session to localStorage (likely too large).");
          setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type: 'warning', message: 'Session data too large to auto-save.' }]);
      }

      setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type: 'success', message: 'Final Analysis & Script Generated.' }]);
      setAppState('displaying_analysis');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setAnalysisResult(null); 
      setAppState('idle');
      console.error(err);
    } finally {
      setProgress(null);
    }
  }, []);

  const handleConsolidate = useCallback(async (gpoContents: string[], newGpoName: string) => {
    setAppState('consolidating');
    setError(null);
    setAnalysisResult(null);
    setConsolidationResult(null);
    setProgress(null);
    setLogs([{ timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Starting consolidation process...' }]);
    
    try {
        const result = await generateConsolidatedGpo(gpoContents, newGpoName, setProgress);
        setConsolidationResult(result);
        setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type: 'success', message: 'Consolidation Complete.' }]);
        setAppState('displaying_consolidation');
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setConsolidationResult(null);
        setAppState('idle');
        console.error(err);
    } finally {
        setProgress(null);
    }
  }, []);
  
  const TabButton: React.FC<{tabId: AnalyzerTab; children: React.ReactNode}> = ({ tabId, children }) => (
    <button
      onClick={() => setAnalyzerTab(tabId)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        analyzerTab === tabId
          ? 'bg-cyan-600 text-white shadow-md'
          : 'text-gray-300 hover:bg-gray-700/80'
      }`}
      aria-pressed={analyzerTab === tabId}
    >
      {children}
    </button>
  );

  const renderLanding = () => (
      <div className="max-w-6xl mx-auto mt-10 animate-fade-in">
          <div className="text-center mb-12">
               <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 mb-4">
                  GPO Patrol: Hardening & Performance
               </h1>
               <p className="text-xl text-gray-400">Optimize your Active Directory environment for speed and security.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Analyzer Card */}
              <button 
                  onClick={() => {
                      setViewMode('analyzer');
                      setAnalyzerTab('paste');
                  }}
                  className="group relative p-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-cyan-500/50 transition-all duration-300 text-left hover:shadow-[0_0_40px_rgba(6,182,212,0.25)] hover:-translate-y-1 overflow-hidden"
              >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                      <div className="w-16 h-16 bg-cyan-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-cyan-500/20">
                          <ChartBarIcon className="w-8 h-8 text-cyan-300" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-100 mb-3 group-hover:text-cyan-300 transition-colors">Analyzer & Hardening</h2>
                      <p className="text-gray-400 leading-relaxed">
                          Detect security conflicts and identify "sparse" GPOs that slow down logins. 
                          Generate remediation scripts to enforce a tight security baseline.
                      </p>
                  </div>
              </button>

              {/* Consolidator Card */}
              <button 
                  onClick={() => setViewMode('consolidator')}
                  className="group relative p-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-sky-500/50 transition-all duration-300 text-left hover:shadow-[0_0_40px_rgba(14,165,233,0.25)] hover:-translate-y-1 overflow-hidden"
              >
                   <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                   <div className="relative z-10">
                      <div className="w-16 h-16 bg-sky-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-sky-500/20">
                          <MergeIcon className="w-8 h-8 text-sky-300" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-100 mb-3 group-hover:text-sky-300 transition-colors">Performance Consolidator</h2>
                      <p className="text-gray-400 leading-relaxed">
                           Merge fragmented policies into high-performance baselines. 
                           Reducing GPO count directly improves client login times and simplifies management.
                      </p>
                   </div>
              </button>
          </div>
          
          <div className="mt-12 flex flex-col items-center space-y-4">
               <div className="flex space-x-4">
                   <button 
                        onClick={() => setIsScriptsModalOpen(true)} 
                        className="inline-flex items-center px-6 py-3 border border-cyan-600/50 text-sm font-medium rounded-md text-cyan-300 bg-cyan-900/30 hover:bg-cyan-900/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-colors"
                    >
                        <BookOpenIcon className="w-5 h-5 mr-2" />
                        Scripts & Tools Library
                    </button>
                    
                    {/* Load Session File Button */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleSessionFileUpload} 
                        className="hidden" 
                        accept=".json" 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="inline-flex items-center px-6 py-3 border border-gray-600/50 text-sm font-medium rounded-md text-gray-300 bg-gray-800/50 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 transition-colors"
                    >
                        <UploadIcon className="w-5 h-5 mr-2" />
                        Load Analysis File
                    </button>
               </div>

               {isSessionAvailable && (
                    <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 p-6 text-center mt-8 max-w-md w-full animate-fade-in">
                        <h3 className="text-lg font-medium text-gray-200 mb-2">Resume Previous Session?</h3>
                        <p className="text-gray-400 mb-4 text-sm">You have a previously saved analysis in local storage.</p>
                        <div className="flex justify-center items-center space-x-4">
                            <button onClick={handleLoadSession} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 transition-colors">
                                <LoadIcon className="w-4 h-4 mr-2" /> Resume
                            </button>
                            <button onClick={handleClearSession} className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">
                                <TrashIcon className="w-4 h-4 mr-2" /> Clear
                            </button>
                        </div>
                    </div>
                )}
          </div>
      </div>
  );

  const renderAnalyzer = () => {
      const isLoading = appState === 'analyzing';
      const showResults = (appState === 'analyzing' && analysisResult) || appState === 'displaying_analysis';

      // Back Button Navigation Header
      const navHeader = (
        <div className="mb-6 flex items-center justify-between">
            <button 
                onClick={handleHome}
                disabled={isLoading}
                className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
            >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Home
            </button>
            <h2 className="text-xl font-semibold text-gray-300 hidden sm:block">GPO Analyzer</h2>
        </div>
      );

      if (error) {
         return (
            <div className="max-w-4xl mx-auto">
                {navHeader}
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-6 rounded-lg shadow-lg animate-fade-in">
                    <h3 className="font-bold text-xl mb-2">Analysis Failed</h3>
                    <p className="mb-4">{error}</p>
                    <div className="flex space-x-4">
                        <button onClick={handleReset} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors">
                            Try Again
                        </button>
                        <button onClick={() => setIsSettingsModalOpen(true)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-colors">
                            Check Settings (API Key)
                        </button>
                    </div>
                </div>
            </div>
         );
      }

      if (showResults && analysisResult) {
         return (
            <div className="w-full max-w-[98%] mx-auto animate-fade-in">
                 {navHeader}
                 
                 {appState === 'analyzing' && (
                    <AnalysisProgress 
                        progress={progress} 
                        title="Analyzing Batch..." 
                        logs={logs}
                        compact={true}
                    />
                 )}
                 
                 <ReportToolbar 
                        analysis={analysisResult.analysis}
                        script={analysisResult.script}
                        onClearSession={handleClearSession}
                        onSaveSession={() => {
                            try {
                                localStorage.setItem(SAVE_KEY, JSON.stringify(analysisResult));
                                setIsSessionAvailable(true);
                            } catch (e) {
                                alert("Failed to save session (data too large).");
                            }
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
                 
                 {appState === 'displaying_analysis' && (
                     <div className="flex justify-center space-x-4 mt-8 mb-8">
                        <button onClick={handleReset} className="inline-flex justify-center items-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-colors">
                            Start New Analysis
                        </button>
                     </div>
                 )}
            </div>
         )
      }

      if (appState === 'analyzing' && !analysisResult) {
         return (
            <div className="max-w-4xl mx-auto">
                 {navHeader}
                 <AnalysisProgress 
                    progress={progress} 
                    title="Initializing Analysis..." 
                    logs={logs} 
                />
            </div>
         );
      }

      // Default Input State
      return (
          <div className="max-w-4xl mx-auto animate-fade-in">
            {navHeader}
            <div className="text-center mb-8">
                <p className="text-gray-400">
                    Paste or upload GPO reports to detect conflicts, security issues, and optimization opportunities.
                </p>
            </div>
            
            <div className="mb-4 flex space-x-2 p-1 bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 self-start inline-block">
                <TabButton tabId="paste">All-vs-All Paste</TabButton>
                <TabButton tabId="one-to-all">1-to-All Paste</TabButton>
                <TabButton tabId="folder">File Upload</TabButton>
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

       const navHeader = (
        <div className="mb-6 flex items-center justify-between">
            <button 
                onClick={handleHome}
                disabled={isLoading}
                className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
            >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Home
            </button>
            <h2 className="text-xl font-semibold text-gray-300 hidden sm:block">GPO Consolidator</h2>
        </div>
      );

      if (error) {
         return (
            <div className="max-w-4xl mx-auto">
                {navHeader}
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-6 rounded-lg shadow-lg animate-fade-in">
                    <h3 className="font-bold text-xl mb-2">Consolidation Failed</h3>
                    <p className="mb-4">{error}</p>
                    <div className="flex space-x-4">
                        <button onClick={handleReset} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors">
                            Try Again
                        </button>
                        <button onClick={() => setIsSettingsModalOpen(true)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-colors">
                            Check Settings (API Key)
                        </button>
                    </div>
                </div>
            </div>
         );
      }

      if ((appState === 'consolidating' || appState === 'displaying_consolidation') && consolidationResult) {
          return (
              <div className="w-full max-w-[98%] mx-auto animate-fade-in">
                  {navHeader}
                  {appState === 'consolidating' && (
                        <div className="mb-8">
                             <AnalysisProgress 
                                progress={progress} 
                                title="Consolidating Policies..." 
                                logs={logs} 
                                compact={true}
                            />
                        </div>
                  )}
                  
                  <ConsolidationDisplay result={consolidationResult} />
                  
                  <div className="flex justify-center space-x-4 mt-12 mb-12">
                     <button onClick={handleReset} className="inline-flex justify-center items-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-colors">
                        Consolidate More GPOs
                     </button>
                  </div>
              </div>
          )
      }

      if (appState === 'consolidating' && !consolidationResult) {
         return (
            <div className="max-w-4xl mx-auto">
                 {navHeader}
                 <AnalysisProgress 
                    progress={progress} 
                    title="Analyzing Structure..." 
                    logs={logs} 
                />
            </div>
         );
      }

      return (
          <div className="max-w-4xl mx-auto animate-fade-in">
              {navHeader}
              <div className="text-center mb-8">
                <p className="text-gray-400">
                    Merge multiple fragmented GPOs into a single, high-performance policy to reduce login times.
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
          <p title="Created by Damien M. Gibson" className="cursor-help">GPO Patrol &copy; {new Date().getFullYear()} - Advanced Group Policy Analysis Tool</p>
          <p className="mt-2 text-xs text-gray-600">
            Secure client-side analysis. No data is stored on external servers. 
            <button onClick={() => setIsSettingsModalOpen(true)} className="ml-1 text-cyan-500 hover:underline">Privacy Settings</button>
          </p>
        </div>
      </footer>
      
      <ScriptsModal 
        isOpen={isScriptsModalOpen} 
        onClose={() => setIsScriptsModalOpen(false)} 
        generatedScript={analysisResult?.script}
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default App;
