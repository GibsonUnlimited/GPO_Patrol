
export interface GpoFinding {
  type: 'Conflict' | 'Overlap';
  setting: string;
  recommendation: string;
  severity?: 'High' | 'Medium';
  resolutionScript?: string;
  manualSteps?: string;
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
  manualSteps?: string;
}

export interface GpoSecurityRecommendation {
  setting: string;
  currentConfiguration: string;
  recommendedConfiguration: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  rationale: string;
  gpoName: string;
  manualSteps?: string;
}

export interface GpoDetails {
  name: string;
  linkedOUs: string[];
  securityFiltering?: string[];
  delegation?: string[];
  configuredSettings?: Array<{
      name: string;
      value: string;
  }>;
}

export interface AnalysisStats {
    totalGpos: number;
    highSeverityConflicts: number;
    mediumSeverityConflicts: number;
    overlaps: number;
    consolidationOpportunities: number;
    securityAlerts: number;
}

export interface Analysis {
  summary: string;
  stats: AnalysisStats;
  findings: GpoFinding[];
  consolidation?: GpoConsolidation[];
  securityRecommendations?: GpoSecurityRecommendation[];
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

export interface SecurityAnalysis {
  summary: string;
  securityFiltering: {
    final: string[];
    sourceDetails: string[];
  };
  delegation: {
    final: string[];
    sourceDetails: string[];
  };
}

export interface MergeReport {
  summary: string;
  overwrittenSettings: OverwrittenSetting[];
  sourceMap: SourceMapEntry[];
  securityAnalysis: SecurityAnalysis;
}

export interface ConsolidationResult {
  gpoXml: string;
  script: string;
  mergeReport: MergeReport;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'detail';
}
