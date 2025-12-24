
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResponse, Analysis, ProgressState, ConsolidationResult, OrganizationAnalysis, PriorityItem } from '../types';

/**
 * STRATEGY FOR QUOTA MANAGEMENT & ERROR RESILIENCE
 */
let apiRequestQueue = Promise.resolve();
let lastRequestEndTime = 0;
const FREE_TIER_GAP_MS = 65000; 
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 10000; 
const BATCH_SIZE = 5; 

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const stripGpoContent = (content: string): string => {
    if (!content) return '';
    if (content.includes('<html') || content.includes('<BODY')) {
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        let text = bodyMatch ? bodyMatch[1] : content;
        text = text.replace(/<script[^>]*>([\s\S]*)<\/script>/gi, '');
        text = text.replace(/<style[^>]*>([\s\S]*)<\/style>/gi, '');
        text = text.replace(/Explain\s+ID:[\s\S]*?(?=\s|$)/gi, '');
        text = text.replace(/ADMX\s+file:[\s\S]*?(?=\s|$)/gi, '');
        text = text.replace(/<[^>]+>/g, ' ');
        return text.replace(/\s+/g, ' ').trim().substring(0, 7000);
    }
    if (content.includes('<?xml')) {
        let xml = content.replace(/xmlns(:\w+)?="[^"]*"/g, '').replace(/xsi(:\w+)?="[^"]*"/g, '');
        xml = xml.replace(/[0-9a-fA-F]{64,}/g, '[DATA_BLOB]');
        return xml.replace(/\s+/g, ' ').trim().substring(0, 7000);
    }
    return content.substring(0, 7000);
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        analysis: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                stats: {
                    type: Type.OBJECT,
                    properties: {
                        totalGpos: { type: Type.INTEGER },
                        highSeverityConflicts: { type: Type.INTEGER },
                        mediumSeverityConflicts: { type: Type.INTEGER },
                        overlaps: { type: Type.INTEGER },
                        consolidationOpportunities: { type: Type.INTEGER },
                        securityAlerts: { type: Type.INTEGER },
                    },
                    required: ["totalGpos", "highSeverityConflicts", "mediumSeverityConflicts", "overlaps", "consolidationOpportunities", "securityAlerts"]
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
                            resolutionScript: { type: Type.STRING },
                            manualSteps: { type: Type.STRING },
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
                consolidation: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            recommendation: { type: Type.STRING },
                            mergeCandidates: { type: Type.ARRAY, items: { type: Type.STRING } },
                            reason: { type: Type.STRING },
                            manualSteps: { type: Type.STRING },
                        },
                        required: ["recommendation", "mergeCandidates", "reason"],
                    }
                },
                securityRecommendations: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            setting: { type: Type.STRING },
                            currentConfiguration: { type: Type.STRING },
                            recommendedConfiguration: { type: Type.STRING },
                            severity: { type: Type.STRING, enum: ["Critical", "High", "Medium", "Low"] },
                            rationale: { type: Type.STRING },
                            gpoName: { type: Type.STRING },
                            manualSteps: { type: Type.STRING }
                        },
                        required: ["setting", "currentConfiguration", "recommendedConfiguration", "severity", "rationale", "gpoName"]
                    }
                },
                gpoDetails: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            linkedOUs: { type: Type.ARRAY, items: { type: Type.STRING } },
                            securityFiltering: { type: Type.ARRAY, items: { type: Type.STRING } },
                            delegation: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["name", "linkedOUs"]
                    }
                },
                powershellScript: { type: Type.STRING }
            },
            required: ["summary", "stats", "findings", "gpoDetails", "powershellScript"],
        },
    },
    required: ["analysis"],
};

const orgSchema = {
    type: Type.OBJECT,
    properties: {
        organization: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                entropyScore: { type: Type.INTEGER },
                remediationScript: { type: Type.STRING },
                classifications: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            gpoName: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ["User", "Computer", "Mixed"] },
                            primaryCategory: { type: Type.STRING },
                            reason: { type: Type.STRING }
                        },
                        required: ["gpoName", "type", "primaryCategory"]
                    }
                },
                recommendations: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            groupName: { type: Type.STRING },
                            description: { type: Type.STRING },
                            suggestedGpos: { type: Type.ARRAY, items: { type: Type.STRING } },
                            reason: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ["User", "Computer", "Mixed"] }
                        },
                        required: ["groupName", "suggestedGpos", "type"]
                    }
                }
            },
            required: ["summary", "classifications", "recommendations"]
        }
    },
    required: ["organization"]
};

const performCall = async (prompt: string, schema: any, configOverrides: any = {}, retryCount = 0): Promise<any> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: schema,
                maxOutputTokens: 8192,
                thinkingConfig: { thinkingBudget: 2048 },
                ...configOverrides 
            },
        });

        const text = response.text;
        if (!text) {
            const reason = response.candidates?.[0]?.finishReason || 'Unknown';
            throw new Error(`Intelligence stream disconnected. Finish Reason: ${reason}`);
        }

        try {
            return JSON.parse(text.trim());
        } catch (jsonError) {
            throw new Error("Received malformed or truncated intelligence response.");
        }
    } catch (error: any) {
        if (retryCount < MAX_RETRIES && (error.message?.includes('429') || error.message?.includes('JSON'))) {
            await sleep(INITIAL_RETRY_DELAY * (retryCount + 1));
            return performCall(prompt, schema, configOverrides, retryCount + 1);
        }
        throw error;
    }
};

const callApi = async (prompt: string, schema: any, configOverrides: any = {}): Promise<any> => {
    const isPro = window.aistudio?.hasSelectedApiKey ? await window.aistudio.hasSelectedApiKey() : false;
    return new Promise((resolve, reject) => {
        apiRequestQueue = apiRequestQueue.then(async () => {
            const timeSinceLast = Date.now() - lastRequestEndTime;
            if (!isPro && timeSinceLast < FREE_TIER_GAP_MS) {
                await sleep(FREE_TIER_GAP_MS - timeSinceLast);
            }
            try {
                const result = await performCall(prompt, schema, configOverrides);
                lastRequestEndTime = Date.now();
                resolve(result);
            } catch (err) {
                lastRequestEndTime = Date.now();
                reject(err);
            }
        });
    });
};

export const generateGpoScriptAndAnalysis = async (
    data: { baseGpo?: string; comparisonGpos: string[]; priorities: PriorityItem[] },
    setProgress: (p: ProgressState) => void,
    onPartialResult: (p: Analysis) => void
): Promise<AnalysisResponse> => {
    const totalBatches = Math.ceil(data.comparisonGpos.length / BATCH_SIZE);
    let combinedAnalysis: Analysis | null = null;
    let finalScript = "";
    
    // Convert priorities to a descriptive string for the system prompt
    const priorityStrings = data.priorities.map((p, i) => `${i + 1}. ${p}`).join(', ');

    for (let i = 0; i < totalBatches; i++) {
        setProgress({ stage: `Analyzing Segment ${i + 1}/${totalBatches}`, current: i + 1, total: totalBatches });
        
        const isOneToAll = !!data.baseGpo;
        const systemInstruction = `You are a Tier-3 Active Directory Forensic Engineer. 
        MISSION: Optimize GPO count and identify baseline deviations.
        USER ANALYSIS PRIORITIES (Ordered by Weight): ${priorityStrings}.
        
        Regardless of priority, ALWAYS maintain Enterprise Security and Performance as the underlying foundation.
        
        1. IF Consolidation is priority: Look for 100% matches in Links/Filtering.
        2. IF Conflicts/Overlap is priority: Deep dive into precedence and overwritten settings.
        3. IF Similar Like-Minded Settings is priority: Focus on functional grouping and structural logic.
        
        GENERATE a robust PowerShell script that scans ALL domains in the forest, identifies GPOs, and exports reports.`;

        const batch = data.comparisonGpos.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        const prompt = `Batch ${i + 1}/${totalBatches}. ${isOneToAll ? '1-to-All Comparison vs Baseline.' : 'Cluster Audit.'}
        ${isOneToAll ? `BASELINE:\n${stripGpoContent(data.baseGpo!)}\n` : ''}
        COMPARISON DATA:\n${batch.map(stripGpoContent).join('\n')}`;
        
        const res = await callApi(prompt, analysisSchema, { systemInstruction });
        onPartialResult(res.analysis);
        
        if (!combinedAnalysis) {
            combinedAnalysis = res.analysis;
            finalScript = res.analysis.powershellScript;
        } else {
            // Aggregate Statistics
            combinedAnalysis.stats.totalGpos += res.analysis.stats.totalGpos;
            combinedAnalysis.stats.highSeverityConflicts += res.analysis.stats.highSeverityConflicts;
            combinedAnalysis.stats.mediumSeverityConflicts += res.analysis.stats.mediumSeverityConflicts;
            combinedAnalysis.stats.overlaps += res.analysis.stats.overlaps;
            combinedAnalysis.stats.consolidationOpportunities += res.analysis.stats.consolidationOpportunities;
            combinedAnalysis.stats.securityAlerts += (res.analysis.stats.securityAlerts || 0);

            // Merge findings and details
            combinedAnalysis.findings = [...combinedAnalysis.findings, ...res.analysis.findings];
            combinedAnalysis.gpoDetails = [...combinedAnalysis.gpoDetails, ...res.analysis.gpoDetails];
            
            if (res.analysis.consolidation) {
                combinedAnalysis.consolidation = [...(combinedAnalysis.consolidation || []), ...res.analysis.consolidation];
            }
            if (res.analysis.securityRecommendations) {
                combinedAnalysis.securityRecommendations = [...(combinedAnalysis.securityRecommendations || []), ...res.analysis.securityRecommendations];
            }
            combinedAnalysis.summary += ` | Batch ${i+1}: ${res.analysis.summary}`;
        }
    }
    
    // Final check: Use the actual data length for totalGpos to ensure accuracy if the LLM hallucinated its batch size
    if (combinedAnalysis) {
        const totalActualGpos = (data.baseGpo ? 1 : 0) + data.comparisonGpos.length;
        combinedAnalysis.stats.totalGpos = totalActualGpos;
    }
    
    return { analysis: combinedAnalysis!, script: finalScript };
};

export const generateConsolidatedGpo = async (gpoContents: string[], newGpoName: string): Promise<ConsolidationResult> => {
    const prompt = `Perform deep merge compatibility research for '${newGpoName}'. DATA:\n${gpoContents.map(stripGpoContent).join('\n')}`;
    return await callApi(prompt, analysisSchema as any); 
};

export const generateOrganizationAnalysis = async (gpoContents: string[], priorities: PriorityItem[], setProgress: (p: ProgressState) => void): Promise<OrganizationAnalysis> => {
    setProgress({ stage: 'Logical Structural Mapping', current: 1, total: 1 });
    const priorityStrings = priorities.map((p, i) => `${i + 1}. ${p}`).join(', ');
    
    const systemInstruction = `You are an AD Forest Architect. Map forest functional logic.
    USER PRIORITIES: ${priorityStrings}. 
    Focus on minimizing GPO count and strict User/Computer separation.`;

    const prompt = `Perform structural optimization. DATA:\n${gpoContents.map((c, i) => `GPO ${i+1}:\n${stripGpoContent(c)}`).join('\n')}`;
    const result = await callApi(prompt, orgSchema, { systemInstruction });
    return result.organization;
};
