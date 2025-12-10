
import React, { useState } from 'react';
import type { Analysis, GpoFinding, GpoSecurityRecommendation } from '../types';

interface ReportToolbarProps {
    analysis: Analysis;
    script?: string;
    onSaveSession: () => void;
    onClearSession: () => void;
}

// Fix: Add type declarations for jsPDF on the window object to resolve TypeScript error.
declare global {
    interface Window {
        jspdf: any;
    }
}

// --- Icons ---
const SaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);
const CsvIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125H20.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h-1.5m1.5 0h1.5m-1.5 0v-1.5m17.25 0v-1.5m0 0h1.5m-1.5 0h-1.5m-17.25 0v-1.5a1.125 1.125 0 011.125-1.125h1.5m14.25 0h1.5a1.125 1.125 0 011.125 1.125v1.5m-17.25 0h1.5m14.25 0h-1.5m0 0v1.5m0-1.5v-1.5m0 0a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H6.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.5m9.75 0a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-1.5a1.125 1.125 0 01-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.5m-9.75 0h1.5" />
    </svg>
);
const PdfIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);
const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);
const CodeBracketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
);



export const ReportToolbar: React.FC<ReportToolbarProps> = ({ analysis, script, onSaveSession, onClearSession }) => {
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const hasConsolidation = analysis.consolidation && analysis.consolidation.length > 0;
    const hasSecurity = analysis.securityRecommendations && analysis.securityRecommendations.length > 0;

    const handleSave = () => {
        onSaveSession();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    };

    const handleExportSessionJson = () => {
        const sessionData = {
            analysis: analysis,
            script: script || ''
        };
        const jsonString = JSON.stringify(sessionData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `GPO_Patrol_Session_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportDetailedFindingsCsv = () => {
        const csvHeader = [
            "Finding ID", "Type", "Severity", "Setting", "Recommendation", 
            "Resolution Script", "Involved GPO", "Policy State", 
            "Configured Value", "Is Winning Policy", "Linked OUs"
        ].join(',');
    
        let csvContent = "data:text/csv;charset=utf-8," + csvHeader + "\r\n";
    
        analysis.findings.forEach((finding, index) => {
            const findingId = index + 1;
            finding.policies.forEach(policy => {
                const gpoDetails = analysis.gpoDetails.find(d => d.name === policy.name);
                const linkedOUs = gpoDetails ? gpoDetails.linkedOUs.join('; ') : '';

                const escapeCsvField = (field: any) => `"${String(field || '').replace(/"/g, '""')}"`;
    
                const row = [
                    findingId,
                    finding.type,
                    finding.severity || 'N/A',
                    finding.setting,
                    finding.recommendation,
                    finding.resolutionScript,
                    policy.name,
                    policy.policyState,
                    policy.value,
                    policy.isWinningPolicy ? 'Yes' : 'No',
                    linkedOUs
                ].map(escapeCsvField).join(',');
                csvContent += row + "\r\n";
            });
        });
        
        // Append Security Recommendations
        if (hasSecurity) {
            analysis.securityRecommendations?.forEach((rec, index) => {
                 const row = [
                    `SEC-${index + 1}`,
                    "Security Recommendation",
                    rec.severity,
                    rec.setting,
                    rec.rationale,
                    "", // No script in this CSV format usually
                    rec.gpoName,
                    "Current: " + rec.currentConfiguration,
                    "Recommended: " + rec.recommendedConfiguration,
                    "N/A",
                    ""
                 ].map(f => `"${String(f || '').replace(/"/g, '""')}"`).join(',');
                 csvContent += row + "\r\n";
            });
        }
    
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "gpo_detailed_findings.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportConsolidationCsv = () => {
        if (!hasConsolidation) {
            alert("No consolidation recommendations to export.");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Recommendation,Merge Candidates,Reason\r\n";

        analysis.consolidation?.forEach(item => {
            const candidates = `"${item.mergeCandidates.join(', ')}"`;
            const row = [
                `"${item.recommendation.replace(/"/g, '""')}"`,
                candidates,
                `"${item.reason.replace(/"/g, '""')}"`
            ].join(',');
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "gpo_consolidation_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportFullReportCsv = () => {
        handleExportDetailedFindingsCsv();
        if (hasConsolidation) {
            handleExportConsolidationCsv();
        }
    };


    const handleExportPdf = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            alert("The PDF export library has not loaded yet. Please wait a moment and try again.");
            console.error("jsPDF not found on window object.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

        if (typeof (doc as any).autoTable !== 'function') {
            alert("The PDF table plugin has not loaded yet. Please wait a moment and try again.");
            console.error("jsPDF autoTable plugin not found.");
            return;
        }

        const pageMargin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const contentWidth = pageWidth - (pageMargin * 2);
        let yPos = pageMargin;

        const addPageHeaderAndFooter = (docInstance: any) => {
            const pageCount = docInstance.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                docInstance.setPage(i);
                docInstance.setFontSize(9);
                docInstance.setTextColor(150);
                docInstance.text('GPO Patrol - Analysis Report', pageMargin, 10);
                docInstance.text(`Page ${i} of ${pageCount}`, pageWidth - pageMargin, 10, { align: 'right' });
                doc.setFont('helvetica', 'normal'); // Reset font for content
            }
        };

        const checkPageBreak = (spaceNeeded: number) => {
            if (yPos + spaceNeeded > pageHeight - pageMargin) {
                doc.addPage();
                yPos = pageMargin;
            }
        };

        // --- TITLE PAGE ---
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text("GPO Analysis Report", pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });

        // --- SUMMARY SECTION ---
        doc.addPage();
        yPos = pageMargin;
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text("Executive Summary", pageMargin, yPos);
        yPos += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const summaryLines = doc.splitTextToSize(analysis.summary, contentWidth);
        doc.text(summaryLines, pageMargin, yPos);
        yPos += summaryLines.length * 5 + 10;
        
        // --- AT-A-GLANCE STATS ---
        checkPageBreak(60);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text("Analysis Statistics", pageMargin, yPos);
        yPos += 10;
        const statsData = [
            ['Total GPOs Analyzed', analysis.stats.totalGpos],
            ['Security Recommendations', analysis.stats.securityAlerts || 0],
            ['High-Severity Conflicts', analysis.stats.highSeverityConflicts],
            ['Medium-Severity Conflicts', analysis.stats.mediumSeverityConflicts],
            ['Overlaps Identified', analysis.stats.overlaps],
            ['Consolidation Opportunities', analysis.stats.consolidationOpportunities]
        ];
        (doc as any).autoTable({
            startY: yPos,
            head: [['Metric', 'Count']],
            body: statsData,
            theme: 'grid',
            headStyles: { fillColor: [74, 85, 104] },
            didParseCell: (data: any) => {
                if (data.section === 'body' && data.column.index === 0) {
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;

        // --- SECURITY RECOMMENDATIONS ---
        if (hasSecurity) {
            doc.addPage();
            yPos = pageMargin;
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(220, 38, 38); // Red
            doc.text("Security Posture Recommendations", pageMargin, yPos);
            yPos += 12;

            analysis.securityRecommendations!.forEach(rec => {
                const settingLines = doc.splitTextToSize(rec.setting, contentWidth);
                const rationaleLines = doc.splitTextToSize(`Rationale: ${rec.rationale}`, contentWidth);
                const spaceNeeded = settingLines.length * 5 + rationaleLines.length * 5 + 40;
                
                checkPageBreak(spaceNeeded);

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(40);
                doc.text(settingLines, pageMargin, yPos);
                yPos += settingLines.length * 5 + 2;

                const severityColor = rec.severity === 'Critical' ? [220, 38, 38] : rec.severity === 'High' ? [234, 88, 12] : [202, 138, 4];
                doc.setFontSize(10);
                doc.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
                doc.text(`Severity: ${rec.severity} | Found in: ${rec.gpoName}`, pageMargin, yPos);
                yPos += 5;

                doc.setTextColor(80);
                doc.setFont('helvetica', 'normal');
                doc.text(rationaleLines, pageMargin, yPos);
                yPos += rationaleLines.length * 5 + 3;

                // Comparison Table
                (doc as any).autoTable({
                    startY: yPos,
                    head: [['Current Configuration', 'Recommended Baseline']],
                    body: [[rec.currentConfiguration, rec.recommendedConfiguration]],
                    theme: 'grid',
                    headStyles: { fillColor: [74, 85, 104] },
                    styles: { textColor: [200, 0, 0] }, // Default red for bad config
                    columnStyles: { 1: { textColor: [0, 150, 0] } }, // Green for good config
                    margin: { left: pageMargin, right: pageMargin },
                });
                yPos = (doc as any).lastAutoTable.finalY + 10;
            });
        }

        // --- DETAILED GPO INVENTORY (Data Friendly) ---
        doc.addPage();
        yPos = pageMargin;
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text("Detailed GPO Inventory", pageMargin, yPos);
        yPos += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text("This section provides critical data for every analyzed GPO, including links, security, and delegation.", pageMargin, yPos);
        yPos += 10;

        analysis.gpoDetails.forEach((gpo) => {
            checkPageBreak(60);
            
            // Title Background
            doc.setFillColor(240, 240, 240);
            doc.rect(pageMargin, yPos - 6, contentWidth, 10, 'F');
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(gpo.name, pageMargin + 2, yPos);
            yPos += 8;

            // Determine status (Conflicts/Overlaps)
            const conflicts = analysis.findings.filter(f => f.type === 'Conflict' && f.policies.some(p => p.name === gpo.name));
            const overlaps = analysis.findings.filter(f => f.type === 'Overlap' && f.policies.some(p => p.name === gpo.name));
            const mergeCandidate = analysis.consolidation?.some(c => c.mergeCandidates.includes(gpo.name));
            
            const statusLines = [];
            if (conflicts.length) statusLines.push(`CONFLICTS: ${conflicts.length} settings`);
            if (overlaps.length) statusLines.push(`OVERLAPS: ${overlaps.length} settings`);
            if (mergeCandidate) statusLines.push("MERGE CANDIDATE");
            if (statusLines.length === 0) statusLines.push("Clean (No issues found)");

            // Metadata Table
            const metaBody = [
                ['Status', statusLines.join(' | ')],
                ['Linked OUs', gpo.linkedOUs.length ? gpo.linkedOUs.join('\n') : 'Not Linked'],
                ['Security Filtering', gpo.securityFiltering && gpo.securityFiltering.length ? gpo.securityFiltering.join(', ') : 'Authenticated Users'],
                ['Delegation', gpo.delegation && gpo.delegation.length ? gpo.delegation.join('\n') : 'Default']
            ];

            (doc as any).autoTable({
                startY: yPos,
                body: metaBody,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 1.5 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 40 },
                    1: { cellWidth: 'auto' }
                },
                didParseCell: (data: any) => {
                    // Highlight Conflict status row
                    if (data.row.index === 0 && data.column.index === 1) {
                        if (conflicts.length > 0) data.cell.styles.textColor = [220, 38, 38]; // Red
                        else if (overlaps.length > 0) data.cell.styles.textColor = [217, 119, 6]; // Orange
                    }
                }
            });
            yPos = (doc as any).lastAutoTable.finalY + 8;
        });


        // --- CONSOLIDATION SECTION ---
        if (hasConsolidation) {
            doc.addPage();
            yPos = pageMargin;
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(22, 163, 74); // Green
            doc.text("Consolidation Recommendations", pageMargin, yPos);
            yPos += 12;

            analysis.consolidation!.forEach(item => {
                const recLines = doc.splitTextToSize(`Recommendation: ${item.recommendation}`, contentWidth);
                const reasonLines = doc.splitTextToSize(`Reason: ${item.reason}`, contentWidth);
                const tableBody = item.mergeCandidates.map(name => [name]);
                const spaceNeeded = (recLines.length + reasonLines.length) * 5 + (tableBody.length + 1) * 8 + 15;
                checkPageBreak(spaceNeeded);
                
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(40);
                doc.text(recLines, pageMargin, yPos);
                yPos += (recLines.length * 5) + 2;

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(80);
                doc.text(reasonLines, pageMargin, yPos);
                yPos += (reasonLines.length * 5) + 3;

                (doc as any).autoTable({
                    startY: yPos,
                    head: [['Merge Candidate Policies']],
                    body: tableBody,
                    theme: 'striped',
                    headStyles: { fillColor: [74, 85, 104] },
                    margin: { left: pageMargin, right: pageMargin },
                });
                yPos = (doc as any).lastAutoTable.finalY + 15;
            });
        }
        
        // --- FINDINGS SECTIONS ---
        const renderFindings = (title: string, findings: GpoFinding[], color: [number, number, number]) => {
            if (findings.length === 0) return;
        
            doc.addPage();
            yPos = pageMargin;
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(title, pageMargin, yPos);
            yPos += 12;
        
            findings.forEach((finding, index) => {
                const tableBodyData = finding.policies.map(p => {
                    const gpoDetails = analysis.gpoDetails.find(d => d.name === p.name);
                    const linkedOUsText = gpoDetails?.linkedOUs.length ? 'Links:\n' + gpoDetails.linkedOUs.join('\n') : '';
                    return {
                        name: `${p.name}\n${linkedOUsText}`,
                        state: p.policyState,
                        value: p.value,
                        status: p.isWinningPolicy ? 'Winning' : '',
                        isWinning: p.isWinningPolicy
                    };
                });
                const tableBody = tableBodyData.map(row => [row.name, row.state, row.value, row.status]);

                const settingLines = doc.splitTextToSize(finding.setting, contentWidth);
                const recLines = doc.splitTextToSize(finding.recommendation, contentWidth);
                const scriptLines = finding.resolutionScript ? doc.splitTextToSize(finding.resolutionScript, contentWidth - 4) : [];
                
                const spaceNeeded = 50 + (settingLines.length + recLines.length) * 5 + (scriptLines.length * 5) + (tableBody.length * 15);
                checkPageBreak(spaceNeeded);
        
                if (index > 0) {
                    doc.setDrawColor(224, 224, 224);
                    doc.setLineWidth(0.3);
                    doc.line(pageMargin, yPos - 5, pageWidth - pageMargin, yPos - 5);
                }
        
                const findingTitle = `${finding.type} #${index + 1}` + (finding.severity ? ` (${finding.severity} Severity)` : '');
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(40, 40, 40);
                doc.text(findingTitle, pageMargin, yPos);
                yPos += 8;
                
                doc.setFontSize(12);
                doc.text("Setting", pageMargin, yPos);
                yPos += 5;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(80, 80, 80);
                doc.text(settingLines, pageMargin, yPos, { maxWidth: contentWidth });
                yPos += (settingLines.length * 5) + 6;
                
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(40, 40, 40);
                doc.text("Recommendation", pageMargin, yPos);
                yPos += 5;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(80, 80, 80);
                doc.text(recLines, pageMargin, yPos, { maxWidth: contentWidth });
                yPos += (recLines.length * 5) + 6;
        
                (doc as any).autoTable({
                    startY: yPos,
                    head: [['Policy & Links', 'Policy State', 'Configured Value', 'Precedence']],
                    body: tableBody,
                    theme: 'grid',
                    headStyles: { fillColor: color },
                    margin: { left: pageMargin, right: pageMargin },
                    didDrawCell: (data: any) => {
                        if (data.section === 'body' && tableBodyData[data.row.index]?.isWinning) {
                            doc.setFillColor(220, 255, 220); // light green
                            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                            doc.setTextColor(0);
                            doc.text(data.cell.text, data.cell.x + data.cell.padding('left'), data.cell.y + data.cell.height / 2, {
                                baseline: 'middle'
                            });
                        }
                    },
                });
                yPos = (doc as any).lastAutoTable.finalY + 8;

                if (finding.resolutionScript) {
                    checkPageBreak(30);
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(40, 40, 40);
                    doc.text("Suggested PowerShell Fix", pageMargin, yPos);
                    yPos += 6;
                    
                    const scriptHeight = scriptLines.length * 4.5 + 4;
                    checkPageBreak(scriptHeight);

                    doc.setFillColor(243, 244, 246);
                    doc.rect(pageMargin, yPos, contentWidth, scriptHeight, 'F');
                    
                    doc.setFontSize(10);
                    doc.setFont('courier', 'normal');
                    doc.setTextColor(55, 65, 81);
                    doc.text(scriptLines, pageMargin + 2, yPos + 4);
                    
                    yPos += scriptHeight + 15;
                }
            });
        };

        const conflicts = analysis.findings.filter(f => f.type === 'Conflict');
        const overlaps = analysis.findings.filter(f => f.type === 'Overlap');

        renderFindings("Detailed Findings: Conflicts", conflicts, [220, 38, 38]); // Red
        renderFindings("Detailed Findings: Overlaps", overlaps, [217, 119, 6]); // Orange

        addPageHeaderAndFooter(doc);
        doc.save("gpo_analysis_report.pdf");
    };


    return (
        <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-3 flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-gray-200">Analysis Report & Actions</h2>
            <div className="flex items-center space-x-2 flex-wrap gap-2">
                 <button onClick={onClearSession} title="Clear saved session data from Browser Storage" className="p-2 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-700 transition-colors">
                    <TrashIcon className="w-5 h-5" />
                 </button>
                <button 
                    onClick={handleSave} 
                    disabled={saveStatus === 'saved'}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        saveStatus === 'saved'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    }`}
                >
                    {saveStatus === 'saved' ? (
                        <><CheckIcon className="w-5 h-5 mr-2" /> Quick Saved!</>
                    ) : (
                        <><SaveIcon className="w-5 h-5 mr-2" /> Quick Save</>
                    )}
                </button>
                
                {/* Export Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setShowExportDropdown(!showExportDropdown)} 
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-cyan-600 hover:bg-cyan-700 text-white transition-colors"
                    >
                        <CsvIcon className="w-5 h-5 mr-2" /> 
                        Export Data 
                        <ChevronDownIcon className="w-4 h-4 ml-1" />
                    </button>
                    
                    {showExportDropdown && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setShowExportDropdown(false)}></div>
                            <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-40 border border-gray-700 overflow-hidden">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900/50">
                                        Session Backup
                                    </div>
                                    <button
                                        onClick={() => { handleExportSessionJson(); setShowExportDropdown(false); }}
                                        className="block w-full text-left px-4 py-2 text-sm text-cyan-300 hover:bg-gray-700 hover:text-cyan-200 transition-colors"
                                    >
                                        <div className="flex items-center">
                                            <CodeBracketIcon className="w-4 h-4 mr-2" />
                                            Export Session (.json)
                                        </div>
                                    </button>

                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900/50 mt-1">
                                        CSV Reports
                                    </div>
                                    <button
                                        onClick={() => { handleExportFullReportCsv(); setShowExportDropdown(false); }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                    >
                                        Full Report (All Findings)
                                    </button>
                                    <button
                                        onClick={() => { handleExportDetailedFindingsCsv(); setShowExportDropdown(false); }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                    >
                                        Detailed Findings Only
                                    </button>
                                    {hasConsolidation && (
                                        <button
                                            onClick={() => { handleExportConsolidationCsv(); setShowExportDropdown(false); }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                        >
                                            Consolidation Report Only
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                 <button onClick={handleExportPdf} className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors">
                    <PdfIcon className="w-5 h-5 mr-2" /> Export PDF
                </button>
            </div>
        </div>
    );
};
