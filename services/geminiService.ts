
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResponse, Analysis, ProgressState, ConsolidationResult, LogEntry, PerformanceConfig } from '../types';

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

const callApiWithRetry = async (prompt: string, schema: any, retries = 5): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    for (let i = 0; i < retries; i++) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    temperature: 0.1,
                    systemInstruction: `You are an Enterprise GPO Architect. Your mission is a 3-Phase Domain Modernization:
                    PHASE 1: CONSOLIDATION & SHRINKAGE. Drastically reduce GPO count. Group policies by technology/purpose.
                    PHASE 2: STRUCTURAL CLEANUP. Eliminate every single conflict and overlap.
                    PHASE 3: INTUNE MODERNIZATION. Optimize the clean baseline for Intune migration.
                    Action types must be: 'Merge/Consolidate', 'Migrate', 'Evaluate', or 'Retire'.`
                },
            });

            const text = response.text;
            if (!text) throw new Error("Empty response");
            return JSON.parse(text.trim());
        } catch (error: any) {
            const errorStr = JSON.stringify(error).toLowerCase();
            const isRetryable = errorStr.includes('429') || errorStr.includes('500') || errorStr.includes('quota') || errorStr.includes('rate limit');
            
            if (isRetryable && i < retries - 1) {
                const backoff = Math.pow(2, i) * 5000 + (Math.random() * 1000);
                await wait(backoff);
                continue;
            }
            throw error;
        }
    }
};

const roadmapActionSchema = {
    type: Type.OBJECT,
    properties: {
        actionType: { type: Type.STRING, enum: ['Merge/Consolidate', 'Migrate', 'Evaluate', 'Retire'] },
        primaryGpo: { type: Type.STRING, description: "Primary GPO or Master Target Name" },
        secondaryGpos: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Involved Source GPOs" },
        targetName: { type: Type.STRING, description: "Proposed consolidated name for Phase 1" },
        details: { type: Type.STRING, description: "Functional rationale" }
    },
    required: ["actionType", "primaryGpo", "details"]
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        analysis: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                roadmap: {
                    type: Type.OBJECT,
                    properties: {
                        phase1: { type: Type.ARRAY, items: roadmapActionSchema },
                        phase2: { type: Type.ARRAY, items: roadmapActionSchema },
                        phase3: { type: Type.ARRAY, items: roadmapActionSchema }
                    },
                    required: ["phase1", "phase2", "phase3"]
                },
                stats: {
                    type: Type.OBJECT,
                    properties: {
                        totalGpos: { type: Type.INTEGER },
                        highSeverityConflicts: { type: Type.INTEGER },
                        mediumSeverityConflicts: { type: Type.INTEGER },
                        overlaps: { type: Type.INTEGER },
                        consolidationOpportunities: { type: Type.INTEGER },
                        securityAlerts: { type: Type.INTEGER },
                        intuneReadyCount: { type: Type.INTEGER },
                    },
                    required: ["totalGpos", "highSeverityConflicts", "mediumSeverityConflicts", "overlaps", "consolidationOpportunities", "securityAlerts", "intuneReadyCount"]
                },
                findings: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING },
                            setting: { type: Type.STRING },
                            recommendation: { type: Type.STRING },
                            severity: { type: Type.STRING },
                            policies: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        value: { type: Type.STRING },
                                        policyState: { type: Type.STRING },
                                        isWinningPolicy: { type: Type.BOOLEAN }
                                    },
                                    required: ["name", "value", "policyState", "isWinningPolicy"],
                                }
                            }
                        },
                        required: ["type", "setting", "recommendation", "policies"],
                    }
                },
                gpoDetails: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            linkedOUs: { type: Type.ARRAY, items: { type: Type.STRING } },
                            intuneReady: { type: Type.BOOLEAN },
                            performanceImpact: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                            configuredSettings: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        value: { type: Type.STRING },
                                        policyType: { type: Type.STRING, enum: ['User', 'Computer'] }
                                    }
                                }
                            }
                        },
                        required: ["name", "linkedOUs"]
                    }
                }
            },
            required: ["summary", "roadmap", "stats", "findings", "gpoDetails"],
        },
    },
    required: ["analysis"],
};

export const generateGpoScriptAndAnalysis = async (
    gpoData: { baseGpo?: string; comparisonGpos: string[] },
    onProgress: (progress: ProgressState) => void,
    onPartialResult: (partialAnalysis: Analysis) => void,
    onLog?: (log: LogEntry) => void
): Promise<AnalysisResponse> => {
    const timestamp = () => new Date().toLocaleTimeString([], { hour12: false });
    const log = (message: string, type: LogEntry['type'] = 'info') => {
        if (onLog) onLog({ timestamp: timestamp(), message, type });
    };

    const perfStr = localStorage.getItem('gpo_perf_config');
    const perfConfig: PerformanceConfig = perfStr ? JSON.parse(perfStr) : { highMemoryMode: false };
    
    // Turbo Mode Tuning
    const CHUNK_SIZE = perfConfig.highMemoryMode ? 8 : 3; 
    const CONCURRENCY_LIMIT = perfConfig.highMemoryMode ? 3 : 1;

    onProgress({ stage: 'Forensic Initialization...', current: 0, total: 3 });
    log(`Initializing Multi-Threaded Forensic Scan [Capacity: ${perfConfig.highMemoryMode ? '64GB' : '8GB'}]...`);
    
    const gpoChunks: string[][] = [];
    for (let i = 0; i < gpoData.comparisonGpos.length; i += CHUNK_SIZE) {
        gpoChunks.push(gpoData.comparisonGpos.slice(i, i + CHUNK_SIZE));
    }

    const aggregatedDetails: any[] = [];
    const aggregatedFindings: any[] = [];
    const aggregatedRoadmap = { phase1: [] as any[], phase2: [] as any[], phase3: [] as any[] };
    const intermediateSummaries: string[] = [];
    let processedChunks = 0;
    let finalStats = { totalGpos: 0, highSeverityConflicts: 0, mediumSeverityConflicts: 0, overlaps: 0, consolidationOpportunities: 0, securityAlerts: 0, intuneReadyCount: 0 };

    // Process chunks in groups to manage concurrency
    for (let i = 0; i < gpoChunks.length; i += CONCURRENCY_LIMIT) {
        const batch = gpoChunks.slice(i, i + CONCURRENCY_LIMIT);
        log(`Firing Forensic Threads ${i + 1} through ${Math.min(i + CONCURRENCY_LIMIT, gpoChunks.length)}...`, 'info');
        
        const batchPromises = batch.map(async (chunk, batchIdx) => {
            const chunkId = i + batchIdx + 1;
            const chunkPrompt = `
                Perform Deep Phase-Aware Analysis on these policies:
                ${chunk.join('\n\n--- NEXT ---\n\n')}
            `;

            try {
                const result = await callApiWithRetry(chunkPrompt, analysisSchema);
                const subAnalysis = result.analysis;

                // Sync critical data
                aggregatedDetails.push(...subAnalysis.gpoDetails);
                aggregatedFindings.push(...subAnalysis.findings);
                aggregatedRoadmap.phase1.push(...subAnalysis.roadmap.phase1);
                aggregatedRoadmap.phase2.push(...subAnalysis.roadmap.phase2);
                aggregatedRoadmap.phase3.push(...subAnalysis.roadmap.phase3);
                intermediateSummaries.push(subAnalysis.summary);
                
                finalStats.totalGpos += subAnalysis.stats.totalGpos;
                finalStats.highSeverityConflicts += subAnalysis.stats.highSeverityConflicts;
                finalStats.mediumSeverityConflicts += subAnalysis.stats.mediumSeverityConflicts;
                finalStats.overlaps += subAnalysis.stats.overlaps;
                finalStats.securityAlerts += subAnalysis.stats.securityAlerts;
                finalStats.intuneReadyCount += subAnalysis.stats.intuneReadyCount;
                finalStats.consolidationOpportunities += subAnalysis.roadmap.phase1.filter((a: any) => a.actionType === 'Merge/Consolidate').length;

                processedChunks++;
                log(`Thread ${chunkId} finalized: ${chunk.length} policies ingested.`, 'success');
                onProgress({ stage: `Payload Group ${processedChunks}/${gpoChunks.length} Locked`, current: processedChunks, total: gpoChunks.length + 1 });
            } catch (e: any) {
                log(`Thread ${chunkId} CRITICAL FAILURE`, 'error');
                throw e;
            }
        });

        await Promise.all(batchPromises);
        // Minimal cooldown to prevent API flooding even in Turbo
        if (i + CONCURRENCY_LIMIT < gpoChunks.length) await wait(perfConfig.highMemoryMode ? 500 : 2000);
    }

    onProgress({ stage: 'Synthesizing Strategic Summary...', current: gpoChunks.length, total: gpoChunks.length + 1 });
    log("Synthesizing coherent executive roadmap from all threads...");
    
    const synthesisPrompt = `
        You are an Enterprise GPO Architect. Synthesis these partial summaries into one final, professional, cohesive executive summary for a GPO modernization project. 
        Focus on the project deadline (end of February) and the 3-phase plan. 
        Summaries to synthesize:
        ${intermediateSummaries.join('\n\n')}
    `;
    
    const synthesisResult = await callApiWithRetry(synthesisPrompt, {
        type: Type.OBJECT,
        properties: { summary: { type: Type.STRING } },
        required: ["summary"]
    });

    onProgress({ stage: 'Compiling Global Script...', current: gpoChunks.length + 0.5, total: gpoChunks.length + 1 });
    const scriptResult = await callApiWithRetry(`Generate a powershell script to audit and export these GPOs: ${aggregatedDetails.map(d => d.name).join(', ')}`, {
        type: Type.OBJECT,
        properties: { script: { type: Type.STRING } },
        required: ["script"]
    });

    return {
        analysis: {
            summary: synthesisResult.summary,
            roadmap: aggregatedRoadmap,
            stats: finalStats,
            findings: aggregatedFindings,
            gpoDetails: aggregatedDetails
        },
        script: scriptResult.script.replace(/^```powershell\n/i, '').replace(/\n```$/, '')
    };
};

export const generateConsolidatedGpo = async (
    gpoReports: string[],
    newGpoName: string,
    onProgress: (progress: ProgressState) => void,
    onLog?: (log: LogEntry) => void
): Promise<ConsolidationResult> => {
    const timestamp = () => new Date().toLocaleTimeString([], { hour12: false });
    const log = (message: string, type: LogEntry['type'] = 'info') => {
        if (onLog) onLog({ timestamp: timestamp(), message, type });
    };

    onProgress({ stage: 'Frontline Synthesis...', current: 1, total: 1 });
    log(`Synthesizing Technology Master: "${newGpoName}"`);

    const result = await callApiWithRetry(`Merge these GPOs into a clean functional master: ${gpoReports.join('\n\n--- NEXT ---\n\n')}`, {
        type: Type.OBJECT,
        properties: {
            gpoXml: { type: Type.STRING },
            script: { type: Type.STRING },
            mergeReport: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    overwrittenSettings: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { settingName: { type: Type.STRING }, winningGpoName: { type: Type.STRING }, winningValue: { type: Type.STRING }, overwrittenGpoName: { type: Type.STRING }, overwrittenValue: { type: Type.STRING } } } },
                    sourceMap: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { settingName: { type: Type.STRING }, sourceGpoName: { type: Type.STRING } } } },
                    securityAnalysis: { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, securityFiltering: { type: Type.OBJECT, properties: { final: { type: Type.ARRAY, items: { type: Type.STRING } }, sourceDetails: { type: Type.ARRAY, items: { type: Type.STRING } } } }, delegation: { type: Type.OBJECT, properties: { final: { type: Type.ARRAY, items: { type: Type.STRING } }, sourceDetails: { type: Type.ARRAY, items: { type: Type.STRING } } } } } }
                },
                required: ["summary", "overwrittenSettings", "sourceMap", "securityAnalysis"]
            }
        },
        required: ["gpoXml", "script", "mergeReport"]
    });

    return {
        gpoXml: result.gpoXml,
        script: result.script,
        mergeReport: result.mergeReport
    };
};
