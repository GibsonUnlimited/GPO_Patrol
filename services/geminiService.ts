import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResponse, Analysis, ProgressState, ConsolidationResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
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
                    },
                    required: ["totalGpos", "highSeverityConflicts", "mediumSeverityConflicts", "overlaps", "consolidationOpportunities"]
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
                        },
                        required: ["recommendation", "mergeCandidates", "reason"],
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
                            delegation: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key delegation permissions, formatted as 'User/Group: Permission'." }
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
      1.  **Expert GPO Analysis**:
          *   **Parse GPO Reports**: For each report, identify the GPO's display name, its configured settings, and all crucial metadata.
          *   **Extract Core Details**:
                *   **Linked OUs**: Extract a list of all Organizational Unit paths where the GPO is linked.
                *   **Security Filtering**: Extract the list of security principals (users/groups) from the security filtering section.
                *   **Delegation**: Extract key delegation permissions, listing who has what rights (e.g., "Domain Admins: Edit settings, delete, modify security").
          *   **Determine Policy State and Value**: For each setting, analyze its configuration.
              *   The \`policyState\` property must be "Enabled", "Disabled", or "Value".
              *   **CRITICAL**: The \`value\` property must contain the specific configured value (e.g., "8", "domain.com"). If a setting is just a toggle (e.g., "Enabled" with no sub-properties), the value MUST be "Not Applicable". Do not simply repeat the state in the value field.
          *   **Identify Conflicts & Overlaps with Link Awareness**:
              *   Find settings configured in multiple GPOs within this batch.
              *   **Link Target Logic**: A setting is only a true conflict or overlap if the GPOs are linked to the same OU, or if one is linked to a parent OU and another to a child OU within the same lineage. If GPOs are linked to completely separate, unrelated OU branches, their identical settings are NOT a conflict or overlap.
              *   **Empty/Null Value Logic**: When comparing settings, if a GPO's value for a setting is empty, null, "Not Configured", or "Not Defined", it MUST be completely ignored for conflict/overlap purposes. A conflict/overlap only exists if two or more GPOs have explicitly set, non-empty values for the same setting.
          *   **Determine Winning Policy**: For each finding, determine the winning policy based on processing order (LSDOU - Local, Site, Domain, OU) and link order. Set \`isWinningPolicy\` to \`true\` for exactly one policy per finding.
          *   **Assign Conflict Severity**: \`High\` for Enabled vs. Disabled; \`Medium\` for differing values.
          *   **Generate Resolution Scripts**: For each finding, provide a concise, actionable PowerShell script snippet to resolve it.
      2.  **Analyze for Consolidation**: Identify consolidation opportunities within this batch based on similar settings and OU links.

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
        stats: { totalGpos: 0, highSeverityConflicts: 0, mediumSeverityConflicts: 0, overlaps: 0, consolidationOpportunities: 0 },
        findings: [],
        consolidation: [],
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
        aggregatedAnalysis.findings.push(...batchAnalysis.findings);
        if (batchAnalysis.consolidation) {
            aggregatedAnalysis.consolidation.push(...batchAnalysis.consolidation);
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
        Based on the following aggregated statistics and a sample of findings from a GPO analysis, write a brief, professional executive summary.
        
        **Aggregated Statistics:**
        - Total GPOs Analyzed: ${analysis.stats.totalGpos}
        - High-Severity Conflicts: ${analysis.stats.highSeverityConflicts}
        - Medium-Severity Conflicts: ${analysis.stats.mediumSeverityConflicts}
        - Overlaps: ${analysis.stats.overlaps}
        - Consolidation Opportunities: ${analysis.stats.consolidationOpportunities}

        **Sample of Findings:**
        ${analysis.findings.slice(0, 5).map(f => `- ${f.type} on setting '${f.setting}' involving GPOs: ${f.policies.map(p => p.name).join(', ')}`).join('\n')}

        **Context:**
        - The analysis type was ${isOneToAll ? '"1-to-All"' : '"All-to-All"'}.
        - The analysis ${wasBatched ? 'WAS performed in batches' : 'was NOT performed in batches'}.

        **Task:**
        Write the summary. ${wasBatched && !isOneToAll ? 'Crucially, you MUST include a sentence stating that because the analysis was run in batches on a large number of GPOs, the results show conflicts within batches, but might not show conflicts between GPOs from different batches.' : ''}
    `;

    const result = await callApi(summaryPrompt, { properties: { summary: { type: Type.STRING } }, required: ["summary"], type: Type.OBJECT });
    return result.summary;
};

const generateFinalScript = async (gpoData: GpoData, gpoNames: string[]): Promise<string> => {
    const scriptTaskDescription = gpoData.baseGpo
        ? `Write a robust, advanced PowerShell script for a "1-to-All" comparison. It must accept a single Base GPO name and an array of Comparison GPO names.`
        : `Write a robust, advanced PowerShell script for an "All-to-All" comparison. It must accept an array of GPO names to compare against each other.`;
    
    const scriptPrompt = `
      You are a world-class PowerShell and Active Directory engineer. Your task is to create an advanced PowerShell script for GPO analysis.
      
      **Script Type:**
      ${scriptTaskDescription}
      
      **Identified GPO Names from Analysis:**
      ${gpoNames.map(name => `- ${name}`).join('\n')}
      
      **Task:**
      1.  **Generate Advanced PowerShell Script**:
          *   The script must be production-quality, heavily commented, and include a detailed synopsis.
          *   The script string in the final JSON must be properly formatted with standard PowerShell indentation and contain newline characters (\\n) for line breaks.
          *   Include advanced parameters: \`-Domain\`, \`-SearchBase\`, \`-IncludeSetting\`, \`-ExcludeSetting\`, \`-ExcludeGpo\`.
          *   Use \`Get-GPOReport\` and output PowerShell objects.
      
      Provide your complete response in a single JSON object with the specified schema. Do not include any text outside this JSON object.
    `;

    const result = await callApi(scriptPrompt, { properties: { script: { type: Type.STRING } }, required: ["script"], type: Type.OBJECT });
    // Clean up script from markdown code block markers
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
      You are a world-class Active Directory and PowerShell engineer specializing in GPO management.
      Your task is to consolidate multiple GPO reports into a single new GPO, generate a PowerShell script to create it, and provide a detailed audit report of the consolidation.

      **Input:**
      - An array of GPO reports in XML format. The order of the reports is significant for conflict resolution.
      - The desired name for the new GPO: "${newGpoName}"

      **TASK 1: GPO Consolidation**
      1.  **Create Final GPO XML**:
          *   Create a new, valid GPO XML structure. Use the provided name "${newGpoName}" as the display name and generate a new, unique GUID for the GPO ID.
          *   Process the provided GPO reports sequentially, in the given order.
          *   For each setting from each report, add it to the new consolidated GPO.
          *   **Conflict Resolution**: If a setting already exists in the new consolidated GPO, the setting from the *current* report being processed MUST overwrite the existing one. This is a "last one wins" strategy.

      **TASK 2: Detailed Merge Report**
      1.  **Generate Summary**: Write a brief summary describing the consolidation (e.g., "Consolidated 4 GPOs into a single policy named '${newGpoName}'. This process resulted in 12 settings being overwritten...").
      2.  **Identify Overwritten Settings**: Create a list of all settings that were overwritten. For each, you MUST provide:
          *   \`settingName\`: The name of the setting.
          *   \`winningGpoName\`: The name of the GPO that provided the final, winning value.
          *   \`winningValue\`: The value of the setting from the winning GPO.
          *   \`overwrittenGpoName\`: The name of the GPO whose setting was replaced.
          *   \`overwrittenValue\`: The original value that was replaced.
      3.  **Create Source Map**: Create a comprehensive list mapping every single setting in the final consolidated GPO back to its original source GPO. For each entry, provide:
          *   \`settingName\`: The name of the setting in the final GPO.
          *   \`sourceGpoName\`: The name of the GPO where this setting originated.

      **TASK 3: PowerShell Script Generation**
      1.  **Generate Creation Script**: Based on the FINAL consolidated GPO XML you created, generate a complete, production-quality PowerShell script.
      2.  The script must:
          *   Have a parameter for the new GPO name (\`-NewGpoName\`) with a default value of "${newGpoName}".
          *   Create a new, empty GPO using this name.
          *   Save the generated XML content (from Task 1) to a temporary file.
          *   Use the \`Import-GPO\` cmdlet to apply the settings from the temporary file to the newly created GPO.
          *   Include robust error handling and clean up the temporary file.
          *   Be heavily commented and include a synopsis.

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
                description: "The full PowerShell script to create the new GPO and apply its settings from the XML report."
            },
            mergeReport: {
                type: Type.OBJECT,
                properties: {
                    summary: {
                        type: Type.STRING,
                        description: "A summary of the consolidation process."
                    },
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
                    }
                },
                required: ["summary", "overwrittenSettings", "sourceMap"]
            }
        },
        required: ["gpoXml", "script", "mergeReport"]
    };

    const result = await callApi(consolidationPrompt, consolidationSchema);
    
    // Clean up script from markdown code block markers
    const cleanedScript = result.script.replace(/^```powershell\n/i, '').replace(/\n```$/, '');

    return {
        gpoXml: result.gpoXml,
        script: cleanedScript,
        mergeReport: result.mergeReport
    };
};