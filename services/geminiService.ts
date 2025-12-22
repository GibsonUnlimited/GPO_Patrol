
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResponse, Analysis, ProgressState, ConsolidationResult, OrganizationAnalysis, AnalysisStats } from '../types';

/**
 * STRATEGY FOR QUOTA MANAGEMENT & ERROR RESILIENCE
 */
let apiRequestQueue = Promise.resolve();
let lastRequestEndTime = 0;
const FREE_TIER_GAP_MS = 65000; 
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 70000; 
const BATCH_SIZE = 25; 

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const stripGpoContent = (content: string): string => {
    if (!content) return '';
    if (content.includes('<html') || content.includes('<BODY')) {
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        let text = bodyMatch ? bodyMatch[1] : content;
        text = text.replace(/<script[^>]*>([\s\S]*)<\/script>/gi, '');
        text = text.replace(/<style[^>]*>([\s\S]*)<\/style>/gi, '');
        text = text.replace(/<[^>]+>/g, ' ');
        return text.replace(/\s+/g, ' ').trim().substring(0, 15000);
    }
    if (content.includes('<?xml')) {
        return content.replace(/xmlns(:\w+)?="[^"]*"/g, '').replace(/xsi(:\w+)?="[^"]*"/g, '').replace(/\s+/g, ' ').trim().substring(0, 15000);
    }
    return content.substring(0, 15000);
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
                            delegation: { type: Type.ARRAY, items: { type: Type.STRING } },
                            configuredSettings: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        value: { type: Type.STRING },
                                        policyType: { type: Type.STRING }
                                    }
                                }
                            }
                        },
                        required: ["name", "linkedOUs"]
                    }
                }
            },
            required: ["summary", "stats", "findings", "gpoDetails"],
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
                entropyScore: { type: Type.INTEGER, description: "Scale 1-100 of how messy the organization is." },
                remediationScript: { type: Type.STRING, description: "PS Script to fix organization issues." },
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
                },
                gpoDetails: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            linkedOUs: { type: Type.ARRAY, items: { type: Type.STRING } },
                            configuredSettings: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        value: { type: Type.STRING },
                                        policyType: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            required: ["summary", "classifications", "recommendations", "gpoDetails"]
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
            config: { responseMimeType: "application/json", responseSchema: schema, ...configOverrides },
        });
        const text = response.text;
        if (!text) throw new Error("Empty intelligence response.");
        return JSON.parse(text.trim());
    } catch (error: any) {
        console.error(`[API ERROR]`, error);
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
    data: { baseGpo?: string; comparisonGpos: string[] },
    setProgress: (p: ProgressState) => void,
    onPartialResult: (p: Analysis) => void
): Promise<AnalysisResponse> => {
    const totalBatches = Math.ceil(data.comparisonGpos.length / BATCH_SIZE);
    let combinedAnalysis: Analysis | null = null;
    for (let i = 0; i < totalBatches; i++) {
        setProgress({ stage: `Segment ${i + 1}/${totalBatches}`, current: i + 1, total: totalBatches });
        const prompt = `Batch Analysis: ${data.comparisonGpos.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE).map(stripGpoContent).join('\n')}`;
        const res = await callApi(prompt, analysisSchema);
        onPartialResult(res.analysis);
        combinedAnalysis = combinedAnalysis ? res.analysis : res.analysis; 
    }
    return { analysis: combinedAnalysis!, script: "Get-GPO -All" };
};

export const generateConsolidatedGpo = async (gpoContents: string[], newGpoName: string): Promise<ConsolidationResult> => {
    const prompt = `Consolidate ${gpoContents.length} GPOs.`;
    return await callApi(prompt, analysisSchema as any); 
};

export const generateOrganizationAnalysis = async (gpoContents: string[], setProgress: (p: ProgressState) => void): Promise<OrganizationAnalysis> => {
    setProgress({ stage: 'Logical Mapping', current: 0, total: 1 });
    const prompt = `Perform deep organization and classification analysis on these GPOs. Identify User vs Computer vs Mixed. DATA:\n${gpoContents.map((c, i) => `GPO ${i+1}:\n${stripGpoContent(c)}`).join('\n')}`;
    const result = await callApi(prompt, orgSchema);
    return result.organization;
};
