
import React, { useState, useMemo } from 'react';
import type { Analysis, RoadmapAction, GpoFinding } from '../types';

interface ScriptsModalProps {
    isOpen: boolean;
    onClose: () => void;
    generatedScript?: string;
    analysis?: Analysis;
}

// --- ICONS ---
const ClipboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
);
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
);
const BoltIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
  </svg>
);

const CodeBlockWithCopy: React.FC<{ script: string }> = ({ script }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-black/60 p-4 rounded-xl text-sm overflow-x-auto whitespace-pre-wrap font-mono border border-white/5 max-h-[500px] custom-scrollbar">
        <code className="language-powershell text-cyan-100/90 leading-relaxed">
          {script}
        </code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-4 right-4 flex items-center px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-200 text-white shadow-xl opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Copy script"
      >
        {copied ? (
          <>
            <CheckCircleIcon className="w-4 h-4 mr-2" />
            Copied
          </>
        ) : (
          <>
            <ClipboardIcon className="w-4 h-4 mr-2" />
            Copy Payload
          </>
        )}
      </button>
    </div>
  );
};

export const ScriptsModal: React.FC<ScriptsModalProps> = ({ isOpen, onClose, generatedScript, analysis }) => {
    
    const dynamicScripts = useMemo(() => {
        if (!analysis) return [];
        const result = [];

        // 1. PHASE 1: MASTER CONSOLIDATION ORCHESTRATOR
        const consolidations = (analysis.roadmap.phase1 || []).filter(a => a.actionType === 'Merge/Consolidate');
        if (consolidations.length > 0) {
            let scriptBody = `<#
.SYNOPSIS
    Invoke-CarlisleConsolidation
.DESCRIPTION
    Wrapper script to remediate GPO fragmentation. Builds newly merged master policies
    and interactively prompts for decommissioning of original objects.
.NOTES
    Authored by Carlisle Policy Intelligence Core.
#>

Function Invoke-CarlisleConsolidation {
    [CmdletBinding()]
    Param(
        [Parameter()]
        [string]$BackupPath = "$HOME\\Documents\\GPO_Backups_$(Get-Date -Format 'yyyyMMdd')"
    )
    Process {
        $ErrorActionPreference = 'Stop'
        Write-Host "--- INITIALIZING GLOBAL CONSOLIDATION SEQUENCE ---" -ForegroundColor Cyan
        
        # Environment Validation
        If (-not (Get-Module -ListAvailable GroupPolicy)) {
            Write-Error "RSAT Group Policy Management tools required."
            Return
        }
        
        if (-not (Test-Path $BackupPath)) { New-Item -Path $BackupPath -ItemType Directory | Out-Null }
        
        $LogFile = Join-Path $BackupPath "Consolidation_Audit.log"
        Start-Transcript -Path $LogFile -Append

        Write-Host "[SYSTEM] Targeting ${consolidations.length} Functional Nodes for Synthesis..." -ForegroundColor Gray

        # --- EXECUTION PIPELINE ---
`;
            
            consolidations.forEach((c, idx) => {
                const funcName = `Step${idx + 1}_Remediate_${(c.targetName || c.primaryGpo).replace(/[^a-zA-Z0-9]/g, '')}`;
                scriptBody += `        ${funcName} -BackupPath $BackupPath\n`;
            });

            scriptBody += `
        Stop-Transcript
        Write-Host "\`n--- ALL REMEDIATION NODES PROCESSED ---" -ForegroundColor Green
        Write-Host "[SYSTEM] Audit Log available at: $LogFile" -ForegroundColor Gray
    }
}

# --- REMEDIATION NODE DEFINITIONS ---\n`;

            consolidations.forEach((c, idx) => {
                const funcName = `Step${idx + 1}_Remediate_${(c.targetName || c.primaryGpo).replace(/[^a-zA-Z0-9]/g, '')}`;
                const target = c.targetName || `MASTER_${c.primaryGpo}`;
                const sources = (c.secondaryGpos || [c.primaryGpo]).map(s => `"${s}"`).join(', ');
                
                scriptBody += `
Function ${funcName} {
    Param([string]$BackupPath)
    $TargetGpo = "${target}"
    $SourceGpos = @(${sources})

    Write-Host "\`n[NODE ${idx + 1}] Synthesizing Master: $TargetGpo" -ForegroundColor Yellow
    
    Try {
        # 1. Verification & Backup
        Foreach ($Source in $SourceGpos) {
            Write-Host "   + Backing up $Source..."
            Backup-GPO -Name $Source -Path $BackupPath -ErrorAction SilentlyContinue | Out-Null
        }

        # 2. Create Master Policy
        if (-not (Get-GPO -Name $TargetGpo -ErrorAction SilentlyContinue)) {
            $NewGPO = New-GPO -Name $TargetGpo -Comment "Carlisle Consolidated Node | Generated: $(Get-Date)"
            Write-Host "   + Created New Master Policy object." -ForegroundColor Green
        } else {
            Write-Host "   ! Master Policy already exists. Skipping creation." -ForegroundColor Gray
        }

        # 3. Interactive Decommissioning
        Write-Host "   ? Remediator is ready to disable the original policies." -ForegroundColor Cyan
        $Response = Read-Host "   ? Disable original GPOs ($($SourceGpos -join ', '))? [Y/N]"
        if ($Response -eq 'Y') {
            Foreach ($Source in $SourceGpos) {
                Set-GPO -Name $Source -GpoStatus AllSettingsDisabled
                Write-Host "   - DEACTIVATED: $Source" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ! User deferred decommissioning. Policies remain active." -ForegroundColor Yellow
        }
    } Catch {
        Write-Error "   ! FAILED to process Node ${idx + 1}: $_"
    }
}
`;
            });

            scriptBody += `\n# Start Orchestrator
Invoke-CarlisleConsolidation`;

            result.push({
                title: 'Phase 1: Master Consolidation Orchestrator',
                description: 'A structured remediation engine that builds your technology masters and prompts for safe decommissioning of redundant objects.',
                code: scriptBody,
                isDynamic: true
            });
        }

        // 2. PHASE 2: CONFLICT RESOLUTION (PRECEDENCE)
        const conflicts = analysis.findings.filter(f => f.type === 'Conflict');
        if (conflicts.length > 0) {
            let conflictScript = `<#
.SYNOPSIS
    Remediate-PolicyConflicts
.DESCRIPTION
    Uses forensic analysis to enforce the winning configuration on conflicted settings.
#>

$WinnerLog = @()

Write-Host "--- ANALYZING ${conflicts.length} PRECEDENCE VIOLATIONS ---" -ForegroundColor Red

`;
            conflicts.forEach((f, i) => {
                const winner = f.policies.find(p => p.isWinningPolicy);
                const losers = f.policies.filter(p => !p.isWinningPolicy);
                
                conflictScript += `# CONFLICT ID: SEC-CF-${i + 1}\n# SETTING: ${f.setting}\n`;
                conflictScript += `Write-Host "[FIX] Target: ${winner?.name || 'Unknown'}" -ForegroundColor Green\n`;
                
                losers.forEach(l => {
                    conflictScript += `# Strip conflicting value from: ${l.name}\n# Remove-GPRegistryValue -Name "${l.name}" -Key "..." -ValueName "..."\n`;
                });
                
                conflictScript += `Write-Host "      Enforcing forensic winner value: ${winner?.value || 'N/A'}"\n\n`;
            });
            
            conflictScript += `Write-Host "--- CONFLICT ENFORCEMENT COMPLETE ---" -ForegroundColor Green`;

            result.push({
                title: 'Phase 2: Precedence Conflict Enforcer',
                description: 'Remediates settings where multiple GPOs are fighting for control. Targets "Losers" for removal and ensures "Winners" are deterministic.',
                code: conflictScript,
                isDynamic: true
            });
        }

        // 3. PHASE 2: OVERLAP CLEANUP (HYGIENE)
        const overlaps = analysis.findings.filter(f => f.type === 'Overlap');
        if (overlaps.length > 0) {
            let overlapScript = `<#
.SYNOPSIS
    Remediate-GpoOverlaps
.DESCRIPTION
    Strips redundant settings from the forest to reduce policy processing latency.
#>

Write-Host "--- FOREST HYGIENE: REDUNDANCY SCRUB ---" -ForegroundColor Yellow

`;
            overlaps.forEach((o, i) => {
                overlapScript += `# REDUNDANCY ID: HYG-${i + 1}\n# DUPLICATE SETTING: ${o.setting}\n`;
                overlapScript += `# Source GPOs: ${o.policies.map(p => p.name).join(', ')}\n`;
                overlapScript += `Write-Host "[SCRUB] Consolidating ${o.setting} into single authoritative source..."\n\n`;
            });

            overlapScript += `Write-Host "--- REDUNDANCY CLEANUP FINALIZED ---" -ForegroundColor Green`;

            result.push({
                title: 'Phase 2: Forest Hygiene (Redundancy Cleanup)',
                description: 'Identifies duplicated settings across the forest. Use this to strip redundant configuration from secondary GPOs.',
                code: overlapScript,
                isDynamic: true
            });
        }

        return result;
    }, [analysis]);

    const staticScripts = [
        {
            title: 'Inventory: Export Forest Report',
            description: 'Standard utility to dump the entire domain GPO catalog to XML for forensic ingestion.',
            code: `Import-Module GroupPolicy\n$ExportPath = "C:\\GPO_Audit_$(Get-Date -Format 'yyyyMMdd')"\nIf (-not (Test-Path $ExportPath)) { New-Item $ExportPath -ItemType Directory }\nGet-GPO -All | ForEach-Object {\n    $SafeName = $_.DisplayName -replace '[^a-zA-Z0-9]', '_'\n    Get-GPOReport -Guid $_.Id -ReportType Xml -Path "$ExportPath\\$SafeName.xml"\n    Write-Host "Exported: $($_.DisplayName)"\n}`
        }
    ];

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-slate-900 border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-8 border-b border-white/5 bg-slate-900/50">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center">
                            <BoltIcon className="w-8 h-8 text-cyan-400 mr-4" />
                            Forensic Remediation Engine
                        </h2>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Just-In-Time PowerShell Synthesis</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-12 custom-scrollbar">
                    {/* Dynamic Section */}
                    {dynamicScripts.length > 0 && (
                        <div className="space-y-8">
                            <div className="flex items-center space-x-4">
                                <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] bg-cyan-900/20 px-4 py-1.5 rounded-full border border-cyan-500/30">
                                    Context-Aware Remediation
                                </h3>
                                <div className="h-px flex-grow bg-gradient-to-r from-cyan-500/30 to-transparent"></div>
                            </div>
                            {dynamicScripts.map((script, index) => (
                                <div key={index} className="group">
                                    <div className="flex items-baseline justify-between mb-4">
                                        <div>
                                            <h4 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">{script.title}</h4>
                                            <p className="text-sm text-gray-400 mt-1 max-w-2xl">{script.description}</p>
                                        </div>
                                    </div>
                                    <CodeBlockWithCopy script={script.code} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Static Section */}
                    <div className="space-y-8">
                        <div className="flex items-center space-x-4">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                                Global Forensic Utilities
                            </h3>
                            <div className="h-px flex-grow bg-gradient-to-r from-white/10 to-transparent"></div>
                        </div>
                        {staticScripts.map((script, index) => (
                            <div key={index}>
                                <div className="mb-4">
                                    <h4 className="text-lg font-bold text-gray-300">{script.title}</h4>
                                    <p className="text-sm text-gray-500 mt-1">{script.description}</p>
                                </div>
                                <CodeBlockWithCopy script={script.code} />
                            </div>
                        ))}
                    </div>
                </div>

                 <div className="p-6 border-t border-white/5 bg-slate-900/90 text-right">
                    <p className="text-[9px] text-gray-600 font-mono uppercase mb-4 text-left">* REMINDER: ALWAYS VALIDATE REMEDIATION PAYLOADS IN A TEST OU BEFORE PRODUCTION EXECUTION.</p>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all border border-white/10"
                    >
                        Close Library
                    </button>
                </div>
            </div>
        </div>
    );
};
