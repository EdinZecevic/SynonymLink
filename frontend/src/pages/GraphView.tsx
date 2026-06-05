import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ArrowLeft, Search, ZoomIn, ZoomOut, RotateCcw, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import type { GraphResponse, GraphNode } from '../services/api';

interface GraphViewProps {
  onBackToDashboard: () => void;
}

// Extend D3 node types to include simulation properties
interface D3Node extends d3.SimulationNodeDatum, GraphNode {
  x: number;
  y: number;
  fx: number | null;
  fy: number | null;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: D3Node;
  target: D3Node;
}

export const GraphView: React.FC<GraphViewProps> = ({ onBackToDashboard }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Graph state variables
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, _setSelectedNode] = useState<D3Node | null>(null);

  const selectedNodeRef = useRef<D3Node | null>(null);
  const hoveredNodeRef = useRef<D3Node | null>(null);

  const setSelectedNode = (node: D3Node | null) => {
    selectedNodeRef.current = node;
    _setSelectedNode(node);
  };

  const setHoveredNode = (node: D3Node | null) => {
    hoveredNodeRef.current = node;
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 768);
  const [isLegendOpen, setIsLegendOpen] = useState(() => window.innerWidth > 768);

  // References to simulation and zoom objects to allow external control
  const simulationRef = useRef<d3.Simulation<D3Node, undefined> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const nodesRef = useRef<D3Node[]>([]);
  const linksRef = useRef<D3Link[]>([]);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);

  // Load Graph Data from API
  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const data = await api.getGraph();
        setGraphData(data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : t('graph.errorLoad');
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, [t]);

  // Main Canvas & D3 force simulation loop
  useEffect(() => {
    if (!graphData || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    canvas.width = width;
    canvas.height = height;

    // Convert raw API nodes/links to simulation nodes/links
    const nodes: D3Node[] = graphData.nodes.map(n => ({
      ...n,
      x: Math.random() * width,
      y: Math.random() * height,
      fx: null,
      fy: null
    }));

    // Create lookup map for fast link linking
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const links: D3Link[] = graphData.links
      .map(l => {
        const sourceNode = nodeMap.get(l.source);
        const targetNode = nodeMap.get(l.target);
        if (sourceNode && targetNode) {
          return { source: sourceNode, target: targetNode };
        }
        return null;
      })
      .filter((l): l is D3Link => l !== null);

    nodesRef.current = nodes;
    linksRef.current = links;

    // Build the D3-force simulation
    const simulation = d3.forceSimulation<D3Node>(nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(links).id(d => d.id).distance(45).strength(0.9))
      .force('charge', d3.forceManyBody<D3Node>().strength(() => -70)) // repulsion force
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<D3Node>().radius(12));

    simulationRef.current = simulation;

    // Render loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      // Apply current zoom/pan transform
      const transform = transformRef.current;
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.k, transform.k);

      // Determine active highlight path
      const activeComponentGroup = selectedNodeRef.current?.group ?? hoveredNodeRef.current?.group ?? null;

      // 1. Draw Links
      ctx.lineWidth = 1;
      links.forEach(link => {
        const isInActiveGroup = activeComponentGroup !== null && 
                               (link.source.group === activeComponentGroup);

        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        
        if (activeComponentGroup !== null) {
          ctx.strokeStyle = isInActiveGroup ? 'rgba(99, 102, 241, 0.7)' : 'rgba(100, 116, 139, 0.08)';
          ctx.lineWidth = isInActiveGroup ? 1.8 : 0.8;
        } else {
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      });

      // 2. Draw Nodes
      nodes.forEach(node => {
        const isHighlight = activeComponentGroup !== null && node.group === activeComponentGroup;
        const isSelected = selectedNodeRef.current?.id === node.id;
        const isHovered = hoveredNodeRef.current?.id === node.id;

        ctx.beginPath();
        // Adjust node size based on importance (degree) or selection
        const radius = isSelected ? 8 : (isHovered ? 7 : 5);
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

        // Map cluster groups to beautiful HSL colors
        const baseColor = `hsl(${(node.group * 137.5) % 360}, 70%, 55%)`;

        if (activeComponentGroup !== null) {
          ctx.fillStyle = isHighlight ? baseColor : 'rgba(100, 116, 139, 0.15)';
        } else {
          ctx.fillStyle = baseColor;
        }

        ctx.fill();

        // Node outline for selected/hovered nodes
        if (isSelected || isHovered) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }

        // Draw Labels: Show all labels if zoom is high, otherwise only show matching, hovered or highlighted ones
        const shouldShowLabel = transform.k > 1.2 || isSelected || isHovered || isHighlight || nodes.length < 50;

        if (shouldShowLabel) {
          ctx.font = isSelected || isHovered ? 'bold 11px Inter, sans-serif' : '9px Inter, sans-serif';
          
          if (activeComponentGroup !== null) {
            ctx.fillStyle = isHighlight ? 'var(--text-primary)' : 'rgba(100, 116, 139, 0.2)';
          } else {
            ctx.fillStyle = 'var(--text-primary)';
          }

          ctx.textAlign = 'center';
          ctx.fillText(node.id, node.x, node.y - (radius + 4));
        }
      });

      ctx.restore();
    };

    simulation.on('tick', draw);

    // D3 Zoom setup
    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        draw();
      });

    zoomBehaviorRef.current = zoom;
    d3.select(canvas).call(zoom);

    // DRAG AND DROP (physics interactions)
    // Find node closest to coordinates
    const findNode = (mx: number, my: number): D3Node | null => {
      const transform = transformRef.current;
      // Convert screen/canvas coordinates to simulation coordinates
      const sx = (mx - transform.x) / transform.k;
      const sy = (my - transform.y) / transform.k;

      let closest: D3Node | null = null;
      let minDistance = 20; // click threshold radius

      nodes.forEach(node => {
        const dx = node.x - sx;
        const dy = node.y - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          minDistance = dist;
          closest = node;
        }
      });
      return closest;
    };

    // Drag behavior implementation
    d3.select(canvas).call(
      d3.drag<HTMLCanvasElement, unknown>()
        .subject((event) => {
          const rect = canvas.getBoundingClientRect();
          const mx = event.x - rect.left;
          const my = event.y - rect.top;
          return findNode(mx, my);
        })
        .on('start', (event) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
          setSelectedNode(event.subject);
        })
        .on('drag', (event) => {
          const transform = transformRef.current;
          event.subject.fx = event.subject.x + event.dx / transform.k;
          event.subject.fy = event.subject.y + event.dy / transform.k;
        })
        .on('end', (event) => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        })
    );

    // Mouse Move Hover triggers
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const node = findNode(mx, my);
      if (node !== hoveredNodeRef.current) {
        setHoveredNode(node);
        draw();
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // Handle container resize
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      canvas.width = width;
      canvas.height = height;
      simulation.force('center', d3.forceCenter(width / 2, height / 2));
      simulation.alpha(0.3).restart();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      simulation.stop();
      resizeObserver.disconnect();
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [graphData]);

  // Zoom actions helpers
  const zoomIn = () => {
    if (!canvasRef.current || !zoomBehaviorRef.current) return;
    d3.select(canvasRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.3);
  };

  const zoomOut = () => {
    if (!canvasRef.current || !zoomBehaviorRef.current) return;
    d3.select(canvasRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.7);
  };

  const resetZoom = () => {
    if (!canvasRef.current || !zoomBehaviorRef.current) return;
    d3.select(canvasRef.current).transition().duration(250).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  // Search node & focus
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || nodesRef.current.length === 0 || !canvasRef.current || !zoomBehaviorRef.current) return;

    const term = searchTerm.trim().toLowerCase();
    const node = nodesRef.current.find(n => n.id.toLowerCase() === term);

    if (node) {
      setSelectedNode(node);

      // Center simulation view onto the targeted node
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      const targetTransform = d3.zoomIdentity
        .translate(width / 2 - node.x * 2, height / 2 - node.y * 2)
        .scale(2);

      d3.select(canvasRef.current)
        .transition()
        .duration(750)
        .call(zoomBehaviorRef.current.transform, targetTransform);
    } else {
      alert(t('graph.alertNotFound', { searchTerm }));
    }
  };

  return (
    <div className="graph-view-container animate-fade-in" ref={containerRef}>
      {/* Floating Toggle Button for Sidebar */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="btn btn-primary btn-floating-toggle-sidebar animate-fade-in"
          title={t('graph.searchAndStats')}
        >
          <Search size={16} />
          <span>{t('graph.searchAndStats')}</span>
        </button>
      )}

      {/* Floating Control overlay panels */}
      <div className={`graph-sidebar card-glass ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button onClick={onBackToDashboard} className="btn btn-secondary btn-sidebar-back">
            <ArrowLeft size={16} />
            {t('graph.dashboardBtn')}
          </button>
          <button onClick={() => setIsSidebarOpen(false)} className="btn-close-sidebar" title={t('graph.collapsePanel')}>
            ✕
          </button>
        </div>

        <div className="sidebar-divider"></div>

        <h3>{t('graph.searchGraph')}</h3>
        <form onSubmit={handleSearchSubmit} className="graph-search-form">
          <input
            type="text"
            className="input-field graph-search-input"
            placeholder={t('graph.placeholderSearchGraph')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-search-go" title={t('graph.findNode')}>
            <Search size={14} />
          </button>
        </form>

        <div className="sidebar-divider"></div>

        <h3>{t('graph.stats')}</h3>
        {graphData ? (
          <div className="graph-stats-list">
            <div className="stat-item">
              <span className="stat-lbl">{t('graph.uniqueWords')}</span>
              <span className="stat-val">{graphData.nodes.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-lbl">{t('graph.connectedPairs')}</span>
              <span className="stat-val">{graphData.links.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-lbl">{t('graph.synonymGroups')}</span>
              <span className="stat-val">
                {new Set(graphData.nodes.map(n => n.group)).size}
              </span>
            </div>
          </div>
        ) : (
          <div>{t('graph.calculating')}</div>
        )}

        <div className="sidebar-divider"></div>

        {selectedNode && (
          <div className="node-detail-panel animate-fade-in">
            <h4>{t('graph.selectedNode')}</h4>
            <div className="selected-badge">{selectedNode.id}</div>
            <p className="detail-help">
              {t('graph.highlightingHelp', { group: selectedNode.group })}
            </p>
            <button onClick={() => setSelectedNode(null)} className="btn btn-secondary btn-sm">
              {t('graph.clearSelection')}
            </button>
          </div>
        )}
      </div>

      {/* Floating Canvas Controls */}
      <div className="canvas-controls-overlay card-glass">
        <button onClick={zoomIn} className="btn-control" title={t('graph.zoomIn')}><ZoomIn size={16} /></button>
        <button onClick={zoomOut} className="btn-control" title={t('graph.zoomOut')}><ZoomOut size={16} /></button>
        <button onClick={resetZoom} className="btn-control" title={t('graph.resetView')}><RotateCcw size={16} /></button>
      </div>

      {/* Graph Legend Overlay */}
      <div className={`graph-legend-overlay card-glass ${isLegendOpen ? 'open' : 'collapsed'}`}>
        <div className="legend-header-toggle" onClick={() => setIsLegendOpen(!isLegendOpen)}>
          <HelpCircle size={16} />
          <span>{isLegendOpen ? t('graph.interactiveLegend') : t('graph.legend')}</span>
          <span className="legend-toggle-arrow">{isLegendOpen ? '▼' : '▲'}</span>
        </div>
        {isLegendOpen && (
          <ul className="animate-fade-in">
            <li>{t('graph.legendTip1')}</li>
            <li>{t('graph.legendTip2')}</li>
            <li>{t('graph.legendTip3')}</li>
          </ul>
        )}
      </div>

      {/* Render Canvas */}
      <canvas ref={canvasRef} className="graph-canvas" />

      {/* Fullscreen loaders */}
      {loading && (
        <div className="graph-loader-overlay card-glass">
          <span className="spinner"></span>
          <h2>{t('graph.constructingGraph')}</h2>
          <p>{t('graph.largeDatasetHelp')}</p>
        </div>
      )}

      {error && (
        <div className="graph-loader-overlay error-overlay card-glass">
          <h2>{t('graph.errorTitle')}</h2>
          <p>{error}</p>
          <button onClick={onBackToDashboard} className="btn btn-primary">{t('graph.goBack')}</button>
        </div>
      )}

      {/* Dedicated Graph CSS styles */}
      <style>{`
        .graph-view-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background-color: var(--bg-primary);
        }

        .graph-canvas {
          display: block;
          width: 100%;
          height: 100%;
          cursor: grab;
          touch-action: none;
        }

        .graph-canvas:active {
          cursor: grabbing;
        }

        /* Sidebar Panels */
        .graph-sidebar {
          position: absolute;
          top: 24px;
          left: 24px;
          width: 280px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          z-index: 15;
          text-align: left;
          padding: 20px;
          border-radius: var(--radius-md);
          transition: transform var(--transition-normal), opacity var(--transition-normal);
        }

        .graph-sidebar.closed {
          transform: translateX(-120%);
          opacity: 0;
          pointer-events: none;
        }

        .graph-sidebar.open {
          transform: translateX(0);
          opacity: 1;
          pointer-events: auto;
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .btn-sidebar-back {
          justify-content: flex-start;
          font-size: 14px;
          padding: 8px 12px;
        }

        .btn-close-sidebar {
          background: none;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
          transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
        }

        .btn-close-sidebar:hover {
          background-color: var(--accent-soft);
          color: var(--accent);
          border-color: var(--accent);
        }

        .btn-floating-toggle-sidebar {
          position: absolute;
          top: 24px;
          left: 24px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: var(--shadow-md);
        }

        .sidebar-divider {
          height: 1px;
          background-color: var(--border);
        }

        .graph-sidebar h3 {
          font-size: 13px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .graph-search-form {
          display: flex;
          gap: 6px;
        }

        .graph-search-input {
          padding: 8px 12px;
          font-size: 13px;
        }

        .btn-search-go {
          width: 38px;
          height: 38px;
          padding: 0;
          flex-shrink: 0;
        }

        .graph-stats-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .stat-lbl {
          color: var(--text-secondary);
        }

        .stat-val {
          font-weight: 600;
          color: var(--text-primary);
        }

        /* Node selection info */
        .node-detail-panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 14px;
          border-top: 1px dashed var(--border);
        }

        .node-detail-panel h4 {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .selected-badge {
          background-color: var(--accent);
          color: white;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-weight: bold;
          font-size: 14px;
          text-align: center;
          text-transform: capitalize;
        }

        .detail-help {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        /* Floating Overlays */
        .canvas-controls-overlay {
          position: absolute;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px;
          border-radius: var(--radius-full);
          z-index: 10;
        }

        .btn-control {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-primary);
          transition: background-color var(--transition-fast), border-color var(--transition-fast);
        }

        .btn-control:hover {
          background-color: var(--accent-soft);
          border-color: var(--accent);
          color: var(--accent);
        }

        .graph-legend-overlay {
          position: absolute;
          bottom: 24px;
          left: 24px;
          max-width: 320px;
          z-index: 10;
          padding: 16px;
          text-align: left;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .legend-header-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: bold;
          color: var(--text-secondary);
          text-transform: uppercase;
          user-select: none;
        }

        .legend-toggle-arrow {
          margin-left: auto;
          font-size: 10px;
          opacity: 0.7;
        }

        .graph-legend-overlay.collapsed {
          padding: 12px 16px;
        }

        .graph-legend-overlay ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 8px;
        }

        .graph-legend-overlay li {
          font-size: 11px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        /* Loading Overlays */
        .graph-loader-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 20;
          background: rgba(8, 13, 26, 0.7);
          backdrop-filter: blur(10px);
          gap: 16px;
          text-align: center;
          border: none;
          border-radius: 0;
        }

        .graph-loader-overlay h2 {
          font-size: 20px;
          font-weight: 600;
        }

        .graph-loader-overlay p {
          color: var(--text-secondary);
          font-size: 14px;
        }

        .error-overlay {
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        @media (max-width: 768px) {
          .graph-sidebar {
            top: 12px;
            left: 12px;
            bottom: 12px;
            height: auto;
            width: calc(100% - 24px);
            max-width: 320px;
          }
          .btn-floating-toggle-sidebar {
            top: 12px;
            left: 12px;
            font-size: 14px;
            padding: 10px 16px;
          }
          .canvas-controls-overlay {
            bottom: 12px;
            right: 12px;
          }
          .graph-legend-overlay {
            bottom: 12px;
            left: 12px;
            max-width: calc(100% - 80px);
          }
        }
      `}</style>
    </div>
  );
};
