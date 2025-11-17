import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { GpoInputForm } from './components/GpoInputForm';
import { GpoFolderInput } from './components/GpoFolderInput';
import { GpoOneToAllInputForm } from './components/GpoOneToAllInputForm';
import { GpoConsolidatorForm } from './components/GpoConsolidatorForm';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { ScriptDisplay } from './components/ScriptDisplay';
import { ConsolidationDisplay } from './components/ConsolidationDisplay';
import { AnalysisProgress } from './components/AnalysisProgress';
import { generateGpoScriptAndAnalysis, generateConsolidatedGpo } from './services/geminiService';
import { ReportToolbar } from './components/ReportToolbar';
import { AnalyzedGpoList } from './components/AnalyzedGpoList';
import { ScriptsModal } from './components/ScriptsModal';
import type { Analysis, AnalysisResponse, ProgressState, ConsolidationResult } from './types';

type ActiveTab = 'paste' | 'folder' | 'one-to-all' | 'consolidate';
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

interface GpoData {
    baseGpo?: string;
    comparisonGpos: string[];
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [consolidationResult, setConsolidationResult] = useState<ConsolidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('paste');
  const [isSessionAvailable, setIsSessionAvailable] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [isScriptsModalOpen, setIsScriptsModalOpen] = useState(false);
  
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
        setAppState('displaying_analysis');
      }
    } catch (e) {
      console.error("Failed to load session:", e);
      setError("Could not load the saved session. The data might be corrupted.");
      localStorage.removeItem(SAVE_KEY);
      setIsSessionAvailable(false);
    }
  };

  const handleClearSession = () => {
    localStorage.removeItem(SAVE_KEY);
    setIsSessionAvailable(false);
    alert("Saved session data has been cleared.");
  };

  const handleGenerate = useCallback(async (gpoData: GpoData) => {
    setAppState('analyzing');
    setError(null);
    setAnalysisResult(null);
    setConsolidationResult(null);
    setProgress(null);

    const onPartialResultCallback = (partialAnalysis: Analysis) => {
        setAnalysisResult(prev => {
            if (!prev) {
                // First batch, create the initial structure
                return { analysis: partialAnalysis, script: '' };
            } else {
                // Subsequent batches, aggregate the data
                const newAnalysis: Analysis = {
                    summary: prev.analysis.summary, // Keep old summary until final one arrives
                    stats: {
                        totalGpos: prev.analysis.stats.totalGpos + partialAnalysis.stats.totalGpos,
                        highSeverityConflicts: prev.analysis.stats.highSeverityConflicts + partialAnalysis.stats.highSeverityConflicts,
                        mediumSeverityConflicts: prev.analysis.stats.mediumSeverityConflicts + partialAnalysis.stats.mediumSeverityConflicts,
                        overlaps: prev.analysis.stats.overlaps + partialAnalysis.stats.overlaps,
                        consolidationOpportunities: prev.analysis.stats.consolidationOpportunities + partialAnalysis.stats.consolidationOpportunities,
                    },
                    findings: [...prev.analysis.findings, ...partialAnalysis.findings],
                    consolidation: [...(prev.analysis.consolidation || []), ...(partialAnalysis.consolidation || [])],
                    gpoDetails: [...prev.analysis.gpoDetails, ...partialAnalysis.gpoDetails],
                };
                 // De-duplicate GPO details to keep the list clean
                newAnalysis.gpoDetails = newAnalysis.gpoDetails.filter((gpo, index, self) =>
                    index === self.findIndex((t) => (t.name === gpo.name))
                );
                return { analysis: newAnalysis, script: '' };
            }
        });
    };

    try {
      const totalGpos = (gpoData.baseGpo ? 1 : 0) + gpoData.comparisonGpos.length;
      if (totalGpos < 2) {
        throw new Error("At least two GPO reports are required for analysis.");
      }
      const result = await generateGpoScriptAndAnalysis(gpoData, setProgress, onPartialResultCallback);
      setAnalysisResult(result);
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
    
    try {
        const result = await generateConsolidatedGpo(gpoContents, newGpoName, setProgress);
        setConsolidationResult(result);
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
  
  const TabButton: React.FC<{tabId: ActiveTab; children: React.ReactNode}> = ({ tabId, children }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        activeTab === tabId
          ? 'bg-cyan-600 text-white shadow-md'
          : 'text-gray-300 hover:bg-gray-700/80'
      }`}
      aria-pressed={activeTab === tabId}
    >
      {children}
    </button>
  );

  const renderInputComponent = () => {
      const isLoading = appState === 'analyzing' || appState === 'consolidating';
      switch (activeTab) {
        case 'paste':
            return <GpoInputForm onGenerate={(gpos) => handleGenerate({ comparisonGpos: gpos })} isLoading={isLoading} />;
        case 'one-to-all':
            return <GpoOneToAllInputForm onGenerate={handleGenerate} isLoading={isLoading} />;
        case 'folder':
            return <GpoFolderInput onGenerate={(gpos) => handleGenerate({ comparisonGpos: gpos })} isLoading={isLoading} />;
        case 'consolidate':
            return <GpoConsolidatorForm onGenerate={handleConsolidate} isLoading={isLoading} />;
        default:
            return null;
      }
  };
  
  const handleReset = () => {
      setError(null);
      setAnalysisResult(null);
      setConsolidationResult(null);
      setAppState('idle');
  };

  const renderContent = () => {
    if (appState === 'idle') {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <p className="text-gray-400">
                        Analyze GPO reports to find conflicts, identify overlaps, and get consolidation recommendations. 
                        Provide your GPO data below to receive a detailed analysis and a powerful, reusable PowerShell script for automation.
                    </p>
                </div>
                <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex space-x-2 p-1 bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 self-start">
                        <TabButton tabId="paste">All-vs-All Paste</TabButton>
                        <TabButton tabId="one-to-all">1-to-All Paste</TabButton>
                        <TabButton tabId="folder">File Upload</TabButton>
                        <TabButton tabId="consolidate">Consolidator</TabButton>
                    </div>
                    <button 
                        onClick={() => setIsScriptsModalOpen(true)} 
                        className="inline-flex items-center px-4 py-2 border border-cyan-600/50 text-sm font-medium rounded-md text-cyan-300 bg-cyan-900/30 hover:bg-cyan-900/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-colors"
                    >
                        <BookOpenIcon className="w-5 h-5 mr-2" />
                        GPO Export Scripts
                    </button>
                </div>
                {renderInputComponent()}

                {isSessionAvailable && (
                    <div className="mt-8 bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 p-6 text-center">
                        <h3 className="text-lg font-medium text-gray-200 mb-2">Resume Previous Session?</h3>
                        <p className="text-gray-400 mb-4">You have a previously saved analysis. Would you like to load it?</p>
                        <div className="flex justify-center items-center space-x-4">
                            <button onClick={handleLoadSession} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-colors">
                                <LoadIcon className="w-5 h-5 mr-2" /> Load Saved Results
                            </button>
                            <button onClick={handleClearSession} className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-colors">
                                <TrashIcon className="w-5 h-5 mr-2" /> Clear Saved Data
                            </button>
                        </div>
                    </div>
                )}
             </div>
        );
    }

    if (error) {
         return (
            <div className="max-w-4xl mx-auto bg-red-900/50 border border-red-700 text-red-300 p-6 rounded-lg shadow-lg">
                <h3 className="font-bold text-xl mb-2">Process Failed</h3>
                <p className="mb-4">{error}</p>
                <button onClick={handleReset} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors">
                    Start Over
                </button>
            </div>
         );
    }
    
    return (
        <div className="flex flex-col space-y-8">
            {appState === 'analyzing' && <AnalysisProgress progress={progress} title="Analysis In Progress..." />}
            {appState === 'consolidating' && <AnalysisProgress progress={progress} title="Consolidation In Progress..." />}
            
            {appState === 'displaying_analysis' && analysisResult && (
               <>
                    <ReportToolbar 
                        analysis={analysisResult.analysis} 
                        onClearSession={handleClearSession}
                        onSaveSession={() => {
                            localStorage.setItem(SAVE_KEY, JSON.stringify(analysisResult));
                            setIsSessionAvailable(true);
                        }}
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-3">
                            <AnalysisDisplay analysis={analysisResult.analysis} />
                        </div>
                        <div className="lg:col-span-2 flex flex-col space-y-8">
                            <AnalyzedGpoList analysis={analysisResult.analysis} />
                            {analysisResult.script && (
                                <ScriptDisplay script={analysisResult.script} />
                            )}
                        </div>
                    </div>
                </>
            )}

            {appState === 'displaying_consolidation' && consolidationResult && (
                <ConsolidationDisplay result={consolidationResult} />
            )}

            {(appState === 'displaying_analysis' || appState === 'displaying_consolidation') && (
                 <button onClick={handleReset} className="max-w-xs mx-auto mt-4 w-full inline-flex justify-center items-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-colors">
                    Start New Process
                </button>
            )}
        </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-200 flex flex-col">
      <Header />
      <ScriptsModal isOpen={isScriptsModalOpen} onClose={() => setIsScriptsModalOpen(false)} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8 flex-grow">
        {renderContent()}
      </main>
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Created by DMG for Carlisle, Security Adminstrative purposes.</p>
      </footer>
    </div>
  );
};

export default App;