
export interface GpoDocumentation {
  rationale: string;
  painPoint: string;
  impact: string;
  technicalBrief: string;
  suggestedName?: string;
  classification?: string;
}

export interface GpoFinding {
  type: 'Conflict' | 'Overlap';
  setting: string;
  recommendation: string;
  severity?: 'High' | 'Medium';
  resolutionScript?: string;
  manualSteps?: string;
  documentation?: GpoDocumentation;
  policies: Array<{
    name: string;
    value: string;
    policyState: 'Enabled' | 'Disabled' | 'Value';
    isWinningPolicy: boolean;
  }>;
}

export interface IntuneMigrationInfo {
  isCompatible: boolean;
  confidence: number; // 0-100
  targetProfileType: string; // e.g., "Settings Catalog", "Administrative Template"
  notes: string;
}

export interface RoadmapAction {
  actionType: 'Merge/Consolidate' | 'Migrate' | 'Evaluate' | 'Retire';
  primaryGpo: string;
  secondaryGpos?: string[];
  targetName?: string;
  details: string;
}

export interface RoadmapPhases {
  phase1: RoadmapAction[]; // Consolidation & Shrinkage
  phase2: RoadmapAction[]; // Structural Integrity & Precedence
  phase3: RoadmapAction[]; // Intune Cloud Readiness
}

export interface GpoConsolidation {
  recommendation: string;
  mergeCandidates: string[];
  reason: string;
  manualSteps?: string;
  documentation?: GpoDocumentation;
  intuneMigration?: IntuneMigrationInfo;
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
  intuneReady?: boolean;
  performanceImpact?: 'High' | 'Medium' | 'Low';
  configuredSettings?: Array<{
      name: string;
      value: string;
      policyType?: 'User' | 'Computer';
  }>;
}

export interface AnalysisStats {
    totalGpos: number;
    highSeverityConflicts: number;
    mediumSeverityConflicts: number;
    overlaps: number;
    consolidationOpportunities: number;
    securityAlerts: number;
    intuneReadyCount: number;
}

export interface Analysis {
  summary: string;
  roadmap: RoadmapPhases;
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

export interface VaultEntry {
    id: string;
    timestamp: string;
    title: string;
    fingerprint: string;
    gpoCount: number;
    data: AnalysisResponse;
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

export interface PerformanceConfig {
    highMemoryMode: boolean;
}

export interface GpoClassification {
  gpoName: string;
  type: 'User' | 'Computer' | 'Mixed';
  primaryCategory: string;
}

export interface GpoRecommendation {
  groupName: string;
  type: string;
  description: string;
  reason: string;
  suggestedGpos: string[];
}

export interface OrganizationAnalysis {
  summary: string;
  classifications: GpoClassification[];
  recommendations: GpoRecommendation[];
  gpoDetails: GpoDetails[];
}
