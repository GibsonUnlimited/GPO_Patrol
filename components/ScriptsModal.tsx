import React, { useState } from 'react';

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

const CodeBlockWithCopy: React.FC<{ script: string }> = ({ script }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-gray-900/70 p-3 rounded-md text-sm overflow-x-auto whitespace-pre-wrap font-mono border border-gray-700">
        <code className="language-powershell text-gray-200">
          {script}
        </code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 flex items-center px-2 py-1 bg-gray-700/80 hover:bg-gray-600 rounded-md text-xs font-medium transition-all duration-200 text-gray-300 opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Copy script"
      >
        {copied ? (
          <>
            <CheckCircleIcon className="w-4 h-4 mr-1.5 text-green-400" />
            Copied
          </>
        ) : (
          <>
            <ClipboardIcon className="w-4 h-4 mr-1.5" />
            Copy
          </>
        )}
      </button>
    </div>
  );
};


const scripts = [
    {
        title: 'Export a Single GPO Report',
        description: 'Use this script to export a single GPO by its display name to an XML file. You can then paste the content of the file or upload it.',
        code: `# Exports a single GPO report to an XML file.
param(
    [Parameter(Mandatory=$true)]
    [string]$GpoName,

    [Parameter(Mandatory=$true)]
    [string]$Path # Example: "C:\\GPOReports\\MyGPO.xml"
)
Import-Module GroupPolicy
try {
    Get-GPOReport -Name $GpoName -ReportType Xml -Path $Path
    Write-Host "Report for GPO '$GpoName' saved to '$Path'" -ForegroundColor Green
} catch {
    Write-Host "Error exporting GPO '$GpoName'. Verify the GPO name and path." -ForegroundColor Red
}`
    },
    {
        title: 'Export All GPOs in Domain',
        description: 'This script finds all GPOs in the current domain and exports each one as a separate XML file into a specified folder.',
        code: `# Exports all GPOs in the current domain to a specified folder.
param(
    [Parameter(Mandatory=$true)]
    [string]$FolderPath # Example: "C:\\GPOReports"
)
Import-Module GroupPolicy
if (-not (Test-Path -Path $FolderPath)) {
    New-Item -ItemType Directory -Path $FolderPath
}
$gpos = Get-GPO -All
foreach ($gpo in $gpos) {
    # Sanitize file name
    $fileName = ($gpo.DisplayName -replace '[^a-zA-Z0-9\\s_-]', '') + '.xml'
    $filePath = Join-Path -Path $FolderPath -ChildPath $fileName
    try {
        Get-GPOReport -Guid $gpo.Id -ReportType Xml -Path $filePath
        Write-Host "Exported report for '$($gpo.DisplayName)'"
    } catch {
        Write-Host "Failed to export report for '$($gpo.DisplayName)'" -ForegroundColor Yellow
    }
}
Write-Host "All GPO reports exported to '$FolderPath'" -ForegroundColor Green`
    },
    {
        title: 'Export GPOs from a Specific OU',
        description: 'This script exports reports for all GPOs that are directly linked to a specific Organizational Unit (OU).',
        code: `# Exports reports for all GPOs linked to a specific OU.
param(
    [Parameter(Mandatory=$true)]
    [string]$OUPath, # Example: "OU=Users,DC=corp,DC=domain,DC=com"

    [Parameter(Mandatory=$true)]
    [string]$FolderPath # Example: "C:\\GPOReports\\OU_Exports"
)
Import-Module GroupPolicy
if (-not (Test-Path -Path $FolderPath)) {
    New-Item -ItemType Directory -Path $FolderPath
}
try {
    $gpos = Get-GPInheritance -Target $OUPath | Select-Object -ExpandProperty GpoLinks
    foreach ($gpoLink in $gpos) {
        # Sanitize file name
        $fileName = ($gpoLink.DisplayName -replace '[^a-zA-Z0-9\\s_-]', '') + '.xml'
        $filePath = Join-Path -Path $FolderPath -ChildPath $fileName
        Get-GPOReport -Guid $gpoLink.Id -ReportType Xml -Path $filePath
        Write-Host "Exported report for '$($gpoLink.DisplayName)'"
    }
    Write-Host "All linked GPO reports for '$OUPath' exported to '$FolderPath'" -ForegroundColor Green
} catch {
     Write-Host "Error exporting GPOs for OU '$OUPath'. Verify the OU path." -ForegroundColor Red
}`
    }
];

interface ScriptsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ScriptsModal: React.FC<ScriptsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="scripts-modal-title"
        >
            <div 
                className="bg-gray-900/50 backdrop-filter backdrop-blur-2xl rounded-xl border border-white/10 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-white/10 sticky top-0 bg-gray-900/50">
                    <h2 id="scripts-modal-title" className="text-xl font-bold text-cyan-300">GPO Export Helper Scripts</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white p-1 rounded-full"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-8">
                    {scripts.map((script, index) => (
                        <div key={index}>
                            <h3 className="text-lg font-semibold text-gray-100">{script.title}</h3>
                            <p className="text-sm text-gray-400 mt-1 mb-3">{script.description}</p>
                            <CodeBlockWithCopy script={script.code} />
                        </div>
                    ))}
                </div>
                 <div className="p-4 border-t border-white/10 sticky bottom-0 bg-gray-900/50 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-md transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};