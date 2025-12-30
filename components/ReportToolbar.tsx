
import React from 'react';
import type { Analysis } from '../types';

interface ReportToolbarProps {
    analysis: Analysis;
    onClearSession: () => void;
}

declare global {
    interface Window {
        jspdf: any;
    }
}

const ArchiveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
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
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

export const ReportToolbar: React.FC<ReportToolbarProps> = ({ analysis, onClearSession }) => {
    
    const handleExportArchive = () => {
        const payload = {
            analysis: analysis,
            script: analysis.powershellScript,
            exportedAt: Date.now(),
            version: '4.2.0-PRO'
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `GPO_Sentry_Archive_${new Date().getTime()}.gposentry`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportDetailedFindingsCsv = () => {
        const csvHeader = ["Finding ID", "Type", "Severity", "Setting", "Recommendation", "Involved GPO", "Policy State", "Configured Value"].join(',');
        const rows: string[] = [csvHeader];
        
        analysis.findings.forEach((finding, index) => {
            finding.policies.forEach(policy => {
                const row = [
                    index + 1, 
                    finding.type, 
                    finding.severity || 'N/A', 
                    finding.setting, 
                    finding.recommendation, 
                    policy.name, 
                    policy.policyState, 
                    policy.value
                ].map(f => `"${String(f).replace(/"/g, '""')}"`).join(',');
                rows.push(row);
            });
        });

        const csvString = rows.join("\r\n");
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `GPO_Forensic_Data_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportPdf = () => {
        if (typeof window.jspdf === 'undefined') {
            alert("Forensic PDF Engine is initializing. Please retry in 2 seconds.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(34, 211, 238); // cyan-400
        doc.setFontSize(22);
        doc.text("GPO SENTRY FORENSIC REPORT", 15, 25);
        doc.setFontSize(10);
        doc.setTextColor(156, 163, 175);
        doc.text(`FOREST INTELLIGENCE SCAN: ${new Date().toLocaleString()}`, 15, 33);
        doc.text(`CREATED BY: DAMIEN GIBSON`, 150, 33);

        // Summary
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text("EXECUTIVE SUMMARY", 15, 55);
        doc.setFontSize(10);
        const splitSummary = doc.splitTextToSize(analysis.summary, 180);
        doc.text(splitSummary, 15, 65);

        // Findings Table
        const tableBody = analysis.findings.flatMap((f, i) => 
            f.policies.map(p => [
                i + 1,
                f.type,
                f.severity || 'N/A',
                f.setting,
                p.name,
                p.value
            ])
        );

        if (window.jspdf.jsPDF.API.autoTable) {
            doc.autoTable({
                startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 120,
                head: [['ID', 'Type', 'Severity', 'Setting', 'GPO Source', 'Value']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillStyle: [34, 211, 238], textColor: [0, 0, 0] },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: {
                    3: { cellWidth: 50 },
                    5: { cellWidth: 30 }
                }
            });
        }

        doc.save(`GPO_Forensic_Report_${new Date().getTime()}.pdf`);
    };

    return (
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 flex items-center justify-between shadow-2xl">
            <div className="flex items-center px-4">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse mr-2.5" />
                <div className="flex flex-col">
                    <h2 className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">Intelligence Hub</h2>
                    <span className="text-[8px] text-cyan-500/60 font-mono mt-1">SESSION_ACTIVE: FORENSIC_SCAN_01</span>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                 <button 
                    onClick={handleExportArchive}
                    className="flex items-center px-4 py-2 bg-indigo-900/40 hover:bg-indigo-600 group text-[10px] font-black text-indigo-300 hover:text-white uppercase tracking-widest rounded-xl transition-all border border-indigo-500/30"
                    title="Export Portable Forensic Project"
                >
                    <ArchiveIcon className="w-3.5 h-3.5 mr-2" />
                    Save Archive
                </button>
                <button 
                    onClick={handleExportDetailedFindingsCsv}
                    className="flex items-center px-4 py-2 bg-slate-800 hover:bg-cyan-600 group text-[10px] font-black text-gray-300 hover:text-white uppercase tracking-widest rounded-xl transition-all border border-white/5"
                >
                    <CsvIcon className="w-3.5 h-3.5 mr-2 text-cyan-400 group-hover:text-white" />
                    Export CSV
                </button>
                <button 
                    onClick={handleExportPdf}
                    className="flex items-center px-4 py-2 bg-slate-800 hover:bg-red-600 group text-[10px] font-black text-gray-300 hover:text-white uppercase tracking-widest rounded-xl transition-all border border-white/5"
                >
                    <PdfIcon className="w-3.5 h-3.5 mr-2 text-red-400 group-hover:text-white" />
                    Forensic PDF
                </button>
                <div className="w-px h-8 bg-white/10 mx-2" />
                <button 
                    onClick={onClearSession}
                    className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
                    title="Terminate Session"
                >
                    <TrashIcon className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                </button>
            </div>
        </div>
    );
};
