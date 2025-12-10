
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResponse, Analysis, ProgressState, ConsolidationResult } from '../types';

// Helper to get the best available API Key
const getApiKey = (): string => {
    const userKey = localStorage.getItem('user_gemini_api_key');
    if (userKey && userKey.trim().length > 0) {
        return userKey;
    }
    // Fallback to env variable if no user key is set
    return process.env.API_KEY || '';
};

const BATCH_SIZE = 10; // Process 10 GPOs per API call to stay within limits

interface GpoData {
    baseGpo?: string;
    comparisonGpos: string[];
}

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
                        securityAlerts: { type: Type.INTEGER, description: "Total number of security recommendations found." },
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
                            severity: { type: Type.STRING, description: 'Either "High" or "Medium", null for overlaps.' },
                            resolutionScript: { type: Type.STRING, description: 'An actionable PowerShell snippet to resolve the finding.' },
                            manualSteps: { type: Type.STRING, description: 'Step-by-step instructions for manually resolving the issue using GPMC/GPA GUI. Include specific navigation paths and dialog options.' },
                            policies: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        value: { type: Type.STRING, description: 'The actual configured value of the setting (e.g., "8", "domain.com"). If no specific value applies (e.g., for a simple Enabled/Disabled toggle), use "Not Applicable". Do not repeat the policyState here.' },
                                        policyState: { type: Type.STRING, description: 'Either "Enabled", "Disabled", or "Value".' },
                                        isWinningPolicy: { type: Type.BOOLEAN, description: 'Indicates if this policy setting is the one that will be applied.' }
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
                            manualSteps: { type: Type.STRING, description: "Step-by-step guide to manually perform this consolidation in GPMC." },
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
                            securityFiltering: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of groups in security filtering (e.g., 'Authenticated Users', 'Domain Admins')." },
                            delegation: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List ALL delegation permissions found. CRITICAL: Include specific Users, Groups, and Computers. Format: 'Principal: Permission'." },
                            configuredSettings: {
                                type: Type.ARRAY,
                                description: "A list of ALL settings in this GPO that have a configured value (are not null/empty/not defined).",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        value: { type: Type.STRING }
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

const callApi = async (prompt: string, schema: any): Promise<any> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Missing API Key. Please click the Settings (Gear) icon to configure your Google Gemini API Key.");
    }
    
    // Create instance here to ensure we pick up the latest key
    const ai = new GoogleGenAI({ apiKey: apiKey });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('403')) {
             throw new Error("Invalid API Key. Please check your settings.");
        }
        if (errorMessage.includes('token count exceeds')) {
            throw new Error("The provided GPO reports are too large for the model to process. Please reduce the number of reports or use simpler GPOs and try again.");
        }
        if (errorMessage.includes('JSON')) {
            throw new Error("The API returned an invalid format. This can happen with very complex GPO data. Please try simplifying the input or try again.");
        }
        throw new Error("An API call failed. Please check the GPO data format or try again later.");
    }
}

const generateAnalysisForBatch = async (batchData: GpoData, isBatched: boolean): Promise<Analysis> => {
    const analysisPrompt = `
      You are a world-class PowerShell and Active Directory engineer performing part of a larger analysis.
      Your task is to analyze ONLY the provided batch of Group Policy Object (GPO) reports with extreme precision.

      **CORE PHILOSOPHY: PERFORMANCE & SECURITY HARDENING**
      1.  **Security Posture (NEW CATEGORY)**:
          - **Goal**: Identify settings that weaken the environment's security posture, regardless of conflicts.
          - **Action**: Scan each GPO for "Weak Configurations" relative to Microsoft Security Baselines or CIS Benchmarks.
          - **Examples**: Enabled legacy protocols (SMBv1, NTLMv1, WDigest), weak password policies (short length, no complexity), unrestricted administrative rights (User Rights Assignment), disabled auditing, insecure registry keys.
          - **Output**: Populate the \`securityRecommendations\` array. This is separate from conflicts/overlaps.

      2.  **Optimization (Consolidation)**:
          - **Goal**: Minimize the number of GPOs processed by the client.
          - **Action**: Identify "Consolidation Opportunities" based primarily on **identical scope**.
          - **Criteria**: If multiple GPOs have the **same Linked OUs**, **same Security Filtering**, and **same Delegation**, they are prime candidates for merging. Identify these clusters.
          - **Secondary Criteria**: "Sparse GPOs" (policies with < 5 settings) that are linked to the same location.

      3.  **Conflict & Overlap Analysis**:
          - **Conflict**: Policies that define **different values** for the **same setting**.
          - **Overlap**: Policies that define the **same value** for the **same setting** (Redundant).
          - **Link Target Logic**: A setting is only a true conflict or overlap if the GPOs are linked to the same OU, or if one is linked to a parent OU and another to a child OU within the same lineage. If GPOs are linked to completely separate, unrelated OU branches, their identical settings are NOT a conflict or overlap.
          - **Empty/Null Value Logic**: When comparing settings, if a GPO's value for a setting is empty, null, "Not Configured", or "Not Defined", it MUST be completely ignored for conflict/overlap purposes. A conflict/overlap only exists if two or more GPOs have explicitly set, non-empty values for the same setting.

      **Analysis Type & Context:**
      ${batchData.baseGpo 
          ? `A "Base GPO" and a batch of "Comparison GPOs" are provided. Perform a "1-to-All" comparison for this batch. Compare each "Comparison GPO" ONLY against the "Base GPO".`
          : `A batch of GPO reports is provided as part of a larger "All-to-All" comparison. Find conflicts and overlaps AMONG THE GPOS IN THIS BATCH ONLY.`
      }
      ${isBatched 
          ? `IMPORTANT: Your results will be merged with other batches. Generate a brief summary relevant ONLY to this batch.`
          : `This is the only batch; generate a complete summary for the entire analysis.`
      }

      **Provided GPO Reports for this Batch:**
      ---
      ${batchData.baseGpo ? `--- BASE GPO REPORT ---\n${batchData.baseGpo}` : ''}
      ${batchData.comparisonGpos.map((report, index) => `--- COMPARISON GPO REPORT ${index + 1} ---\n${report}`).join('\n')}
      ---
      
      **Your Detailed Task for this Batch:**
      1.  **Parse & Metadata**: Extract GPO name, Links, Security Filtering, and Delegation.
          - CRITICAL: When extracting Delegation, capture EVERY User, Group, or Computer entry (e.g., 'Domain Admins', 'John Doe'). Don't skip users.
          - CRITICAL: For \`configuredSettings\` in \`gpoDetails\`, list EVERY setting in the GPO that has a real value (not "Not Defined"). Include its name and value. This list is for display purposes so the user can see everything the GPO does.
      2.  **Find Conflicts & Overlaps**: Populate \`findings\`.
          - Determine winning policy based on LSDOU.
          - Assign severity (High/Medium).
          - Generate resolution scripts.
      3.  **Find Security Weaknesses**: Populate \`securityRecommendations\`.
          - Look for specific hardening failures (e.g., "Store passwords using reversible encryption" = Enabled).
          - Provide rationale and manual fix steps.
      4.  **Find Consolidation Opportunities**: Populate \`consolidation\`.
          - Focus on GPOs with IDENTICAL Links and Delegation.
          - Explain the benefit (e.g., "Reduces Client-Side Extension processing overhead").

      Provide your response in a single JSON object with the specified schema. Do not include any text outside this JSON object.
    `;
    const result = await callApi(analysisPrompt, analysisSchema);
    return result.analysis;
};

export const generateGpoScriptAndAnalysis = async (
    gpoData: GpoData,
    onProgress: (progress: ProgressState) => void,
    onPartialResult: (partialAnalysis: Analysis) => void
): Promise<AnalysisResponse> => {
    if (gpoData.comparisonGpos.some(r => !r.trim()) || (gpoData.baseGpo !== undefined && !gpoData.baseGpo.trim())) {
        throw new Error("One or more GPO report fields are empty.");
    }

    const allGpos = gpoData.baseGpo 
        ? [gpoData.baseGpo, ...gpoData.comparisonGpos] 
        : gpoData.comparisonGpos;

    if (allGpos.length <= BATCH_SIZE) {
        // Process as a single batch if small enough
        onProgress({ stage: 'Analyzing GPOs...', current: 1, total: 1 });
        const analysis = await generateAnalysisForBatch(gpoData, false);
        onPartialResult(analysis); // Stream the result back to the UI

        onProgress({ stage: 'Generating PowerShell Script...', current: 1, total: 1 });
        const script = await generateFinalScript(gpoData, analysis.gpoDetails.map(g => g.name));

        return { analysis, script };
    }

    // --- BATCH PROCESSING LOGIC ---
    const isBatched = true;
    const aggregatedAnalysis: Analysis = {
        summary: '', // Will be generated at the end
        stats: { totalGpos: 0, highSeverityConflicts: 0, mediumSeverityConflicts: 0, overlaps: 0, consolidationOpportunities: 0, securityAlerts: 0 },
        findings: [],
        consolidation: [],
        securityRecommendations: [],
        gpoDetails: [],
    };
    
    const chunks: string[][] = [];
    for (let i = 0; i < gpoData.comparisonGpos.length; i += BATCH_SIZE) {
        chunks.push(gpoData.comparisonGpos.slice(i, i + BATCH_SIZE));
    }

    for (let i = 0; i < chunks.length; i++) {
        onProgress({ stage: 'Analyzing GPO Batch', current: i + 1, total: chunks.length });
        const batchGpoData: GpoData = {
            baseGpo: gpoData.baseGpo,
            comparisonGpos: chunks[i],
        };
        const batchAnalysis = await generateAnalysisForBatch(batchGpoData, isBatched);
        
        onPartialResult(batchAnalysis); // Stream the batch result back to the UI
        
        // Aggregate results for final summary
        aggregatedAnalysis.stats.totalGpos += batchAnalysis.stats.totalGpos;
        aggregatedAnalysis.stats.highSeverityConflicts += batchAnalysis.stats.highSeverityConflicts;
        aggregatedAnalysis.stats.mediumSeverityConflicts += batchAnalysis.stats.mediumSeverityConflicts;
        aggregatedAnalysis.stats.overlaps += batchAnalysis.stats.overlaps;
        aggregatedAnalysis.stats.consolidationOpportunities += batchAnalysis.stats.consolidationOpportunities;
        aggregatedAnalysis.stats.securityAlerts += (batchAnalysis.stats.securityAlerts || 0);
        
        aggregatedAnalysis.findings.push(...batchAnalysis.findings);
        if (batchAnalysis.consolidation) {
            aggregatedAnalysis.consolidation?.push(...batchAnalysis.consolidation);
        }
        if (batchAnalysis.securityRecommendations) {
            aggregatedAnalysis.securityRecommendations?.push(...batchAnalysis.securityRecommendations);
        }
        aggregatedAnalysis.gpoDetails.push(...batchAnalysis.gpoDetails);
    }

    // De-duplicate GPO details
    aggregatedAnalysis.gpoDetails = aggregatedAnalysis.gpoDetails.filter((gpo, index, self) =>
        index === self.findIndex((t) => (t.name === gpo.name))
    );
    
    onProgress({ stage: 'Generating Final Summary...', current: 1, total: 1 });
    aggregatedAnalysis.summary = await generateFinalSummary(aggregatedAnalysis, isBatched, !!gpoData.baseGpo);

    onProgress({ stage: 'Generating PowerShell Script...', current: 1, total: 1 });
    const finalScript = await generateFinalScript(gpoData, aggregatedAnalysis.gpoDetails.map(g => g.name));

    return { analysis: aggregatedAnalysis, script: finalScript };
};

const generateFinalSummary = async (analysis: Analysis, wasBatched: boolean, isOneToAll: boolean): Promise<string> => {
    const summaryPrompt = `
        Based on the following aggregated statistics and a sample of findings from a GPO analysis, write a professional executive summary.
        
        **Aggregated Statistics:**
        - Total GPOs Analyzed: ${analysis.stats.totalGpos}
        - Security Alerts (Hardening Needed): ${analysis.stats.securityAlerts}
        - High-Severity Conflicts: ${analysis.stats.highSeverityConflicts}
        - Consolidation Opportunities (Performance Wins): ${analysis.stats.consolidationOpportunities}

        **Context:**
        - Goal: Optimize Login Performance and Harden Security.
        - Analysis Type: ${isOneToAll ? '"1-to-All" (Baseline Check)' : '"All-to-All" (Conflict Check)'}.
        - Batched: ${wasBatched}.

        **Task:**
        Write the summary focusing on:
        1. **Security Posture**: Highlight critical security gaps found in the Security Recommendations.
        2. **Performance**: Opportunities to reduce GPO count (consolidation) to speed up logins.
        3. **Stability**: Conflicts that might cause unpredictable behavior.
    `;

    const result = await callApi(summaryPrompt, { properties: { summary: { type: Type.STRING } }, required: ["summary"], type: Type.OBJECT });
    return result.summary;
};

const generateFinalScript = async (gpoData: GpoData, gpoNames: string[]): Promise<string> => {
    const scriptTaskDescription = gpoData.baseGpo
        ? `Write a robust, advanced PowerShell script for a "1-to-All" comparison across MULTIPLE DOMAINS.
           **Focus**: This script helps enforce a "Security Hardening" baseline across the forest.`
        : `Write a robust, advanced PowerShell script for an "All-to-All" comparison.
           **Focus**: Identify redundancy and conflicts to assist in performance tuning.`;
    
    const scriptPrompt = `
      You are a world-class PowerShell and Active Directory engineer. Your task is to create an advanced PowerShell script for GPO analysis.
      
      **Script Type:**
      ${scriptTaskDescription}
      
      **Identified GPO Names from Analysis (for reference/defaults):**
      ${gpoNames.map(name => `- ${name}`).join('\n')}
      
      **Task:**
      1.  **Generate Advanced PowerShell Script**:
          *   The script must be production-quality, heavily commented, and include a detailed synopsis.
          *   Include advanced parameters: \`-Domain\`, \`-SearchBase\`, \`-IncludeSetting\`, \`-RecurseForest\`.
          *   **Hardening Checks**: If applicable, add comments in the script about checking for standard hardening keys (e.g. SMBv1, NTLM).
          *   Use \`Get-GPOReport\` and output PowerShell objects.
      
      Provide your complete response in a single JSON object with the specified schema. Do not include any text outside this JSON object.
    `;

    const result = await callApi(scriptPrompt, { properties: { script: { type: Type.STRING } }, required: ["script"], type: Type.OBJECT });
    return result.script.replace(/^```powershell\n/i, '').replace(/\n```$/, '');
};

export const generateConsolidatedGpo = async (
    gpoReports: string[],
    newGpoName: string,
    onProgress: (progress: ProgressState) => void
): Promise<ConsolidationResult> => {
    if (gpoReports.some(r => !r.trim())) {
        throw new Error("One or more GPO report fields are empty.");
    }
    if (gpoReports.length < 2) {
        throw new Error("At least two GPO reports are required for consolidation.");
    }

    onProgress({ stage: 'Consolidating GPOs and generating script...', current: 1, total: 1 });

    const consolidationPrompt = `
      You are a world-class Active Directory engineer specializing in GPO Optimization.
      Your task is to consolidate multiple GPO reports into a single **High-Performance Baseline GPO**.

      **Optimization Goal:**
      - **Login Speed**: Merging these GPOs reduces the number of Group Policy objects the client must process, directly improving login performance.
      - **Hardening**: Ensure the resulting settings create a secure, consistent configuration.

      **Input:**
      - An array of GPO reports in XML format.
      - The desired name for the new GPO: "${newGpoName}"

      **TASK 1: GPO Consolidation (Settings)**
      1.  **Create Final GPO XML**:
          *   Create a new, valid GPO XML structure.
          *   Process the provided GPO reports sequentially.
          *   **Conflict Resolution**: Last one wins (LSDOU logic simulation).
          *   **Cleanup**: Do not include empty sections. Keep the XML lean.

      **TASK 2: Security & Delegation Consolidation**
      1.  **Security Filtering**: Merge all target groups.
      2.  **Delegation**: Merge permissions. Include specific users if present.
      3.  **Strict Security Check**: If you detect any "Authenticated Users" with "Read/Apply" permissions in the source GPOs, ensure this is intentional in the final GPO, or note it in the security analysis.

      **TASK 3: Detailed Merge Report**
      1.  **Generate Summary**: Explicitly state how many GPOs were merged and the estimated reduction in policy processing overhead.
      2.  **Identify Overwritten Settings**: List settings where a value was replaced.
      3.  **Security Analysis**: Detail the merged security posture.

      **TASK 4: PowerShell Script Generation**
      1.  **Generate Creation Script**:
          *   Create a new, empty GPO.
          *   Import the generated settings.
          *   Apply the merged Security Filtering and Delegation.
          *   **Performance Note**: Add a comment in the script explaining that this consolidation improves performance by reducing GPO calls.

      **Provided GPO Reports:**
      ---
      ${gpoReports.map((report, index) => `--- GPO REPORT ${index + 1} ---\n${report}`).join('\n')}
      ---

      Provide your complete response in a single JSON object with the specified schema. Do not include any text outside this JSON object.
    `;

    const consolidationSchema = {
        type: Type.OBJECT,
        properties: {
            gpoXml: {
                type: Type.STRING,
                description: "The full XML content of the new, consolidated GPO report."
            },
            script: {
                type: Type.STRING,
                description: "The full PowerShell script to create the new GPO and apply settings AND security/delegation."
            },
            mergeReport: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    overwrittenSettings: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                settingName: { type: Type.STRING },
                                winningGpoName: { type: Type.STRING },
                                winningValue: { type: Type.STRING },
                                overwrittenGpoName: { type: Type.STRING },
                                overwrittenValue: { type: Type.STRING }
                            },
                            required: ["settingName", "winningGpoName", "winningValue", "overwrittenGpoName", "overwrittenValue"]
                        }
                    },
                    sourceMap: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                settingName: { type: Type.STRING },
                                sourceGpoName: { type: Type.STRING }
                            },
                            required: ["settingName", "sourceGpoName"]
                        }
                    },
                    securityAnalysis: {
                        type: Type.OBJECT,
                        properties: {
                            summary: { type: Type.STRING, description: "Summary of how security/delegation was merged." },
                            securityFiltering: {
                                type: Type.OBJECT,
                                properties: {
                                    final: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    sourceDetails: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strings describing which source GPO had which filter." }
                                },
                                required: ["final", "sourceDetails"]
                            },
                            delegation: {
                                type: Type.OBJECT,
                                properties: {
                                    final: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    sourceDetails: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["final", "sourceDetails"]
                            }
                        },
                        required: ["summary", "securityFiltering", "delegation"]
                    }
                },
                required: ["summary", "overwrittenSettings", "sourceMap", "securityAnalysis"]
            }
        },
        required: ["gpoXml", "script", "mergeReport"]
    };

    const result = await callApi(consolidationPrompt, consolidationSchema);
    
    // Clean up script from markdown code block markers
    const cleanedScript = result.script.replace(/^```powershell\n/i, '').replace(/\n```$/, '');
    // Clean up XML from markdown code block markers
    const cleanedGpoXml = result.gpoXml.replace(/^```xml\n/i, '').replace(/\n```$/, '');

    return {
        gpoXml: cleanedGpoXml,
        script: cleanedScript,
        mergeReport: result.mergeReport
    };
};
