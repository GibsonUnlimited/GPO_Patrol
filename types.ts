export interface GpoFinding {
  type: 'Conflict' | 'Overlap';
  setting: string;
  recommendation: string;
  severity?: 'High' | 'Medium';
  resolutionScript?: string;
  policies: Array<{
    name: string;
    value: string;
    policyState: 'Enabled' | 'Disabled' | 'Value';
    isWinningPolicy: boolean;
  }>;
}

export interface GpoConsolidation {
  recommendation: string;
  mergeCandidates: string[];
  reason: string;
}

export interface GpoDetails {
  name: string;
  linkedOUs: string[];
  securityFiltering?: string[];
  delegation?: string[];
}

export interface AnalysisStats {
    totalGpos: number;
    highSeverityConflicts: number;
    mediumSeverityConflicts: number;
    overlaps: number;
    consolidationOpportunities: number;
}

export interface Analysis {
  summary: string;
  stats: AnalysisStats;
  findings: GpoFinding[];
  consolidation?: GpoConsolidation[];
  gpoDetails: GpoDetails[];
}

export interface AnalysisResponse {
  analysis: Analysis;
  script: string;
}

export interface ProgressState {
    stage: string;
    current: number;
    total: number;
}

export interface OverwrittenSetting {
  settingName: string;
  winningGpoName: string;
  winningValue: string;
  overwrittenGpoName: string;
  overwrittenValue: string;
}

export interface SourceMapEntry {
  settingName: string;
  sourceGpoName: string;
}

export interface MergeReport {
  summary: string;
  overwrittenSettings: OverwrittenSetting[];
  sourceMap: SourceMapEntry[];
}

export interface ConsolidationResult {
  gpoXml: string;
  script: string;
  mergeReport: MergeReport;
}