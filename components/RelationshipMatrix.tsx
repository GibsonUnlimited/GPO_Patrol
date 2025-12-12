
import React, { useMemo, useState } from 'react';
import type { GpoFinding } from '../types';

interface RelationshipMatrixProps {
    findings: GpoFinding[];
    gpoNames: string[];
    isOpen: boolean;
    onClose: () => void;
}

interface Node {
    id: string;
    x: number;
    y: number;
    angle: number; // radians
    connectionCount: number;
}

interface LinkDetail {
    setting: string;
    type: 'Conflict' | 'Overlap';
    severity?: 'High' | 'Medium';
}

interface Link {
    source: string;
    target: string;
    highConflicts: number;
    mediumConflicts: number;
    overlaps: number;
    details: LinkDetail[];
}

// --- ICONS ---
const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const RelationshipMatrix: React.FC<RelationshipMatrixProps> = ({ findings, gpoNames, isOpen, onClose }) => {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [hoveredLink, setHoveredLink] = useState<Link | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    
    // Dimensions for the graph
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 100; // Padding for text

    // 1. Process Data into Nodes and Links
    const { nodes, links } = useMemo(() => {
        const linkMap = new Map<string, Link>();
        const connectedGpos = new Set<string>();

        // Create Links
        findings.forEach(finding => {
            const involved = finding.policies.map(p => p.name);
            // Create pairs
            for (let i = 0; i < involved.length; i++) {
                for (let j = i + 1; j < involved.length; j++) {
                    const gpo1 = involved[i];
                    const gpo2 = involved[j];
                    
                    if (gpoNames.includes(gpo1) && gpoNames.includes(gpo2)) {
                        connectedGpos.add(gpo1);
                        connectedGpos.add(gpo2);

                        // Sort keys to ensure uniqueness regardless of direction
                        const [source, target] = [gpo1, gpo2].sort();
                        const key = `${source}|||${target}`;

                        if (!linkMap.has(key)) {
                            linkMap.set(key, { source, target, highConflicts: 0, mediumConflicts: 0, overlaps: 0, details: [] });
                        }
                        const link = linkMap.get(key)!;
                        
                        if (finding.type === 'Conflict') {
                            if (finding.severity === 'High') link.highConflicts++;
                            else link.mediumConflicts++;
                        } else {
                            link.overlaps++;
                        }
                        
                        // Store detailed finding info
                        if (!link.details.some(d => d.setting === finding.setting)) {
                             link.details.push({
                                 setting: finding.setting,
                                 type: finding.type,
                                 severity: finding.severity
                             });
                        }
                    }
                }
            }
        });

        // Create Nodes (Only for GPOs that have connections)
        const activeGpos = Array.from(connectedGpos).sort();
        const totalNodes = activeGpos.length;
        const angleStep = (2 * Math.PI) / totalNodes;

        const calculatedNodes: Node[] = activeGpos.map((gpo, index) => {
            // Start from -90deg (top)
            const angle = index * angleStep - Math.PI / 2; 
            return {
                id: gpo,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
                angle: angle,
                connectionCount: 0 // Calculated below if needed
            };
        });

        const calculatedLinks = Array.from(linkMap.values());

        return { nodes: calculatedNodes, links: calculatedLinks };
    }, [findings, gpoNames]);

    const handleMouseMove = (e: React.MouseEvent) => {
        // Update mouse pos for tooltip
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    if (!isOpen) return null;

    // Helper to get node by ID
    const getNode = (id: string) => nodes.find(n => n.id === id);

    // Sort details for tooltip
    const getSortedDetails = (link: Link) => {
        return [...link.details].sort((a, b) => {
             const score = (d: LinkDetail) => {
                 if (d.type === 'Conflict' && d.severity === 'High') return 3;
                 if (d.type === 'Conflict') return 2;
                 return 1; // Overlap
             };
             return score(b) - score(a);
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div 
                className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
                onMouseMove={handleMouseMove}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-800/50 border-b border-gray-700 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-cyan-300">GPO Interaction Map</h2>
                        <p className="text-sm text-gray-400">Visualizing direct conflicts and overlaps. Hover over lines or nodes for details.</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Graph Canvas Area */}
                <div className="flex-grow relative bg-[#0f172a] cursor-move overflow-auto flex items-center justify-center">
                    {nodes.length < 2 ? (
                        <div className="text-center text-gray-400 p-8">
                            <p className="text-lg">No direct interactions found between the analyzed GPOs.</p>
                            <p className="text-sm mt-2">This is good news! Your GPOs are isolated cleanly.</p>
                        </div>
                    ) : (
                        <svg 
                            width={width} 
                            height={height} 
                            viewBox={`0 0 ${width} ${height}`}
                            className="max-w-full max-h-full"
                            style={{ minWidth: '600px', minHeight: '600px' }}
                        >
                            <defs>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>

                            {/* LINKS */}
                            {links.map((link, i) => {
                                const sourceNode = getNode(link.source);
                                const targetNode = getNode(link.target);
                                if (!sourceNode || !targetNode) return null;

                                // Interaction State
                                const isHovered = hoveredLink === link;
                                // Is this link connected to the currently hovered node?
                                const isNodeRelated = hoveredNode === link.source || hoveredNode === link.target;
                                
                                const isDimmed = (hoveredNode || hoveredLink) && !isHovered && !isNodeRelated;

                                // Determine Color
                                let strokeColor = "#4b5563"; // gray-600 (default)
                                if (link.highConflicts > 0) strokeColor = "#ef4444"; // red
                                else if (link.mediumConflicts > 0) strokeColor = "#f97316"; // orange
                                else if (link.overlaps > 0) strokeColor = "#eab308"; // yellow
                                
                                // Brighter color on active state
                                if (isHovered || isNodeRelated) {
                                    if (link.highConflicts > 0) strokeColor = "#f87171"; // red-400
                                    else if (link.mediumConflicts > 0) strokeColor = "#fb923c"; // orange-400
                                    else if (link.overlaps > 0) strokeColor = "#facc15"; // yellow-400
                                    else strokeColor = "#9ca3af"; // gray-400
                                }

                                // Determine Width based on interaction count
                                const totalInteractions = link.highConflicts + link.mediumConflicts + link.overlaps;
                                const strokeWidth = Math.max(1, Math.min(8, totalInteractions * 0.5));
                                
                                // Enhanced stroke width on hover
                                const activeStrokeWidth = isHovered || isNodeRelated ? Math.max(strokeWidth + 3, 4) : strokeWidth;

                                // Quadratic Bezier: Control point is the center (quadratic curve)
                                // M startX startY Q controlX controlY endX endY
                                const d = `M ${sourceNode.x} ${sourceNode.y} Q ${centerX} ${centerY} ${targetNode.x} ${targetNode.y}`;

                                return (
                                    <g key={`${link.source}-${link.target}`}>
                                        <path
                                            d={d}
                                            fill="none"
                                            stroke={strokeColor}
                                            strokeWidth={activeStrokeWidth}
                                            strokeOpacity={isDimmed ? 0.05 : (isHovered || isNodeRelated ? 1 : 0.3)}
                                            onMouseEnter={() => setHoveredLink(link)}
                                            onMouseLeave={() => setHoveredLink(null)}
                                            style={{ transition: 'stroke-opacity 0.2s, stroke-width 0.2s, stroke 0.2s' }}
                                            className="cursor-pointer"
                                            id={`link-path-${i}`}
                                        />
                                        {(isHovered || isNodeRelated) && (
                                            <circle r={4} fill={strokeColor} filter="url(#glow)">
                                                <animateMotion dur="1.5s" repeatCount="indefinite">
                                                    <mpath href={`#link-path-${i}`} />
                                                </animateMotion>
                                            </circle>
                                        )}
                                    </g>
                                );
                            })}

                            {/* NODES */}
                            {nodes.map((node) => {
                                const isHovered = hoveredNode === node.id;
                                // Is this node part of the hovered link?
                                const isLinkEndpoint = hoveredLink && (hoveredLink.source === node.id || hoveredLink.target === node.id);
                                // Is this node connected to the currently hovered node?
                                const isNeighbor = hoveredNode && links.some(l => 
                                    (l.source === hoveredNode && l.target === node.id) || 
                                    (l.target === hoveredNode && l.source === node.id)
                                );

                                const isHighlight = isHovered || isLinkEndpoint || isNeighbor;
                                const isDimmed = (hoveredNode || hoveredLink) && !isHighlight;

                                // Text Anchor Logic based on angle to prevent text overlapping the graph
                                let textAnchor: "start" | "end" | "middle" = "middle";
                                let dx = 0;
                                let dy = 0;
                                const degrees = (node.angle * 180) / Math.PI;
                                
                                // Simple quadrant check
                                if (degrees > -90 && degrees < 90) {
                                    textAnchor = "start";
                                    dx = 12;
                                } else {
                                    textAnchor = "end";
                                    dx = -12;
                                }
                                dy = 5; // slight vertical center correction

                                // Enhanced Visual Properties for Active Nodes
                                const radius = isHighlight ? 8 : 6;
                                const fill = isHighlight ? "#22d3ee" : "#06b6d4"; // lighter cyan on active
                                const strokeWidth = isHighlight ? 3 : 2;
                                const textFill = isHighlight ? "#fff" : "#94a3b8";
                                const textWeight = isHighlight ? "bold" : "normal";

                                return (
                                    <g 
                                        key={node.id} 
                                        style={{ opacity: isDimmed ? 0.1 : 1, transition: 'opacity 0.2s' }}
                                        onMouseEnter={() => setHoveredNode(node.id)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                        className="cursor-pointer"
                                    >
                                        {(isHighlight) && (
                                            <circle 
                                                cx={node.x} 
                                                cy={node.y} 
                                                r={radius * 2.5} 
                                                fill={fill} 
                                                opacity={0.2}
                                                className="animate-pulse"
                                            />
                                        )}
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r={radius}
                                            fill={fill}
                                            stroke="#fff"
                                            strokeWidth={strokeWidth}
                                            filter={isHighlight ? "url(#glow)" : ""}
                                            style={{ transition: 'r 0.2s, fill 0.2s, stroke-width 0.2s' }}
                                        />
                                        <text
                                            x={node.x}
                                            y={node.y}
                                            dx={dx}
                                            dy={dy}
                                            textAnchor={textAnchor}
                                            fill={textFill}
                                            fontSize={12}
                                            fontWeight={textWeight}
                                            className="pointer-events-none select-none font-mono"
                                            style={{ transition: 'fill 0.2s' }}
                                        >
                                            {node.id}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    )}
                </div>

                {/* --- TOOLTIP (High Contrast, Floating) --- */}
                {hoveredLink && (
                    <div 
                        className="fixed pointer-events-none z-[60] animate-fade-in"
                        style={{ 
                            left: Math.min(mousePos.x + 20, window.innerWidth - 340), // Prevent going off right screen
                            top: Math.min(mousePos.y + 20, window.innerHeight - 400), // Prevent going off bottom screen
                        }}
                    >
                        <div className="bg-gray-900 text-gray-100 rounded-lg border border-cyan-500 shadow-[0_0_30px_rgba(0,0,0,0.9)] p-4 w-80 max-h-[400px] overflow-hidden flex flex-col">
                            <div className="border-b border-gray-700 pb-2 mb-2 text-center">
                                <p className="text-cyan-400 font-bold font-mono text-sm break-words">{hoveredLink.source}</p>
                                <p className="text-xs text-gray-500 my-0.5">vs</p>
                                <p className="text-cyan-400 font-bold font-mono text-sm break-words">{hoveredLink.target}</p>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <div className="bg-red-900/30 border border-red-500/30 rounded p-1 text-center">
                                    <span className="block text-lg font-bold text-red-400 leading-none">{hoveredLink.highConflicts}</span>
                                    <span className="text-[9px] text-red-200 uppercase">High Conflict</span>
                                </div>
                                <div className="bg-orange-900/30 border border-orange-500/30 rounded p-1 text-center">
                                    <span className="block text-lg font-bold text-orange-400 leading-none">{hoveredLink.mediumConflicts}</span>
                                    <span className="text-[9px] text-orange-200 uppercase">Med Conflict</span>
                                </div>
                                <div className="bg-yellow-900/30 border border-yellow-500/30 rounded p-1 text-center">
                                    <span className="block text-lg font-bold text-yellow-400 leading-none">{hoveredLink.overlaps}</span>
                                    <span className="text-[9px] text-yellow-200 uppercase">Overlaps</span>
                                </div>
                            </div>

                            <div className="flex-grow overflow-y-auto custom-scrollbar">
                                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">Interaction Details:</p>
                                <ul className="space-y-1">
                                    {getSortedDetails(hoveredLink).map((detail, idx) => {
                                        let borderColor = "border-gray-500";
                                        let bgColor = "bg-gray-800/30";
                                        let textColor = "text-gray-300";
                                        let label = "";

                                        if (detail.type === 'Conflict') {
                                            if (detail.severity === 'High') {
                                                borderColor = "border-red-500";
                                                bgColor = "bg-red-900/20";
                                                textColor = "text-red-200";
                                                label = "CONFLICT (HIGH)";
                                            } else {
                                                borderColor = "border-orange-500";
                                                bgColor = "bg-orange-900/20";
                                                textColor = "text-orange-200";
                                                label = "CONFLICT (MED)";
                                            }
                                        } else {
                                            borderColor = "border-yellow-500";
                                            bgColor = "bg-yellow-900/20";
                                            textColor = "text-yellow-200";
                                            label = "OVERLAP";
                                        }

                                        return (
                                            <li key={idx} className={`text-xs font-mono p-2 rounded break-words border-l-2 mb-1 ${borderColor} ${bgColor}`}>
                                                <div className={`font-bold text-[10px] mb-0.5 opacity-80 ${textColor}`}>{label}</div>
                                                <div className="text-gray-300">{detail.setting}</div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
