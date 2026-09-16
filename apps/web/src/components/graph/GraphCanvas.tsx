'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  MarkerType,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Network,
  LayoutGrid,
  Radio,
  Maximize,
  Minimize,
  Building2,
} from 'lucide-react';


import {
  SuspiciousNodeCard,
  TransactionNodeCard,
  WalletNodeCard,
  IPNodeCard,
} from './CustomNodeCards';
import { Inspector, InspectorSelection } from './Inspector';

// Custom Node Types mapping
const nodeTypes = {
  suspicious: SuspiciousNodeCard,
  transaction: TransactionNodeCard,
  entity_wallet: WalletNodeCard,
  ip_observation: IPNodeCard,
};

// Custom Edge Component for White Pill Labels & Hover Effects
function CustomPillEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  style = {},
  markerEnd,
  animated,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path ${animated ? 'animate-dash' : ''}`}
        d={edgePath}
        style={{
          strokeWidth: 2,
          stroke: '#dc2626',
          ...style,
        }}
        markerEnd={markerEnd}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan rounded-full bg-white px-2.5 py-0.5 border border-slate-200 shadow-sm text-[11px] font-mono font-bold text-red-600 hover:border-red-400 hover:scale-105 transition-all"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = {
  customPill: CustomPillEdge,
};

// Raw Ground-Truth Nodes & Edges
const INITIAL_NODES: Node[] = [
  {
    id: '74',
    type: 'suspicious',
    data: { label: 'SYN-ENTITY', category: 'suspicious', numericId: '74' },
    position: { x: 0, y: 0 },
  },
  {
    id: '70',
    type: 'transaction',
    data: { label: 'SYN-TX-L2', category: 'transaction', numericId: '70' },
    position: { x: 0, y: 0 },
  },
  {
    id: '42',
    type: 'entity_wallet',
    data: { label: 'SYN-ENTITY', category: 'entity_wallet', numericId: '42' },
    position: { x: 0, y: 0 },
  },
  {
    id: '53',
    type: 'entity_wallet',
    data: { label: 'SYN-ENTITY', category: 'entity_wallet', numericId: '53' },
    position: { x: 0, y: 0 },
  },
  {
    id: '67',
    type: 'ip_observation',
    data: { label: 'SYN-IP-10', category: 'ip_observation', numericId: '67' },
    position: { x: 0, y: 0 },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: 'e74-70',
    source: '74',
    target: '70',
    label: 'sent',
    type: 'customPill',
    animated: true,
    style: { stroke: '#dc2626', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#dc2626' },
  },
  {
    id: 'e70-42',
    source: '70',
    target: '42',
    label: 'received by',
    type: 'customPill',
    style: { stroke: '#dc2626', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#dc2626' },
  },
  {
    id: 'e70-53',
    source: '70',
    target: '53',
    label: 'received by',
    type: 'customPill',
    style: { stroke: '#dc2626', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#dc2626' },
  },
  {
    id: 'e70-67',
    source: '70',
    target: '67',
    label: 'network obs',
    type: 'customPill',
    style: { stroke: '#dc2626', strokeWidth: 2, strokeDasharray: '4 4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#dc2626' },
  },
];

// Dagre Layout Algorithm Computation
const getDagreLayout = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 90 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 90,
        y: nodeWithPosition.y - 45,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// Force / Radial Layout Computation Centered on Node 70
const getForceRadialLayout = (nodes: Node[], edges: Edge[]) => {
  const centerId = '70';
  const radius = 180;
  const outerNodes = nodes.filter((n) => n.id !== centerId);
  const angleStep = (2 * Math.PI) / outerNodes.length;

  const layoutedNodes = nodes.map((node) => {
    if (node.id === centerId) {
      return { ...node, position: { x: 250, y: 220 } };
    }
    const index = outerNodes.findIndex((n) => n.id === node.id);
    const angle = index * angleStep - Math.PI / 2;
    return {
      ...node,
      position: {
        x: 250 + radius * Math.cos(angle),
        y: 220 + radius * Math.sin(angle),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

import { AlertGraph } from '@/data/graph';

// Helper to convert dynamic AlertGraph into React Flow Node & Edge objects
const convertAlertGraphToReactFlow = (alertGraph?: AlertGraph) => {
  if (!alertGraph || !alertGraph.nodes?.length) {
    return { nodes: INITIAL_NODES, edges: INITIAL_EDGES };
  }

  const nodes: Node[] = alertGraph.nodes.map((n) => {
    let category: 'suspicious' | 'transaction' | 'entity_wallet' | 'ip_observation' = 'entity_wallet';
    if (n.suspicious) {
      category = 'suspicious';
    } else if (n.type === 'transaction') {
      category = 'transaction';
    } else if (n.type === 'network' || n.label.includes('IP')) {
      category = 'ip_observation';
    } else {
      category = 'entity_wallet';
    }

    return {
      id: n.id,
      type: category,
      data: {
        label: n.label,
        category,
        numericId: n.id.replace(/^n/, ''),
      },
      position: { x: 0, y: 0 },
    };
  });

  const edges: Edge[] = alertGraph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: 'customPill',
    animated: e.label === 'sent',
    style: {
      stroke: '#dc2626',
      strokeWidth: 2,
      strokeDasharray: e.label.includes('network') ? '4 4' : undefined,
    },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#dc2626' },
  }));

  return { nodes, edges };
};

export interface GraphCanvasProps {
  graph?: AlertGraph;
}

// Inner Graph Canvas Component
function FlowCanvas({ graph }: GraphCanvasProps) {
  const { fitView, zoomIn, zoomOut, getZoom } = useReactFlow();

  const [layoutMode, setLayoutMode] = useState<'dagre' | 'radial'>('dagre');
  const [viewMode, setViewMode] = useState<'wallets' | 'entities'>('wallets');
  const [zoomPercent, setZoomPercent] = useState(100);

  const [selection, setSelection] = useState<InspectorSelection>(null);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Compute initial Dagre Tree layout from dynamic graph or benchmark fallback
  const initialLayout = useMemo(() => {
    const parsed = convertAlertGraphToReactFlow(graph);
    return getDagreLayout(parsed.nodes, parsed.edges);
  }, [graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialLayout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayout.edges);

  // Sync React Flow state when the external graph prop changes
  React.useEffect(() => {
    setNodes(initialLayout.nodes);
    setEdges(initialLayout.edges);
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
  }, [initialLayout, setNodes, setEdges, fitView]);

  // Apply Highlight Data to Nodes
  const updatedNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        highlighted: highlightedIds.includes(node.id),
      },
    }));
  }, [nodes, highlightedIds]);

  // Layout Mode Switcher
  const toggleLayout = useCallback(() => {
    const nextMode = layoutMode === 'dagre' ? 'radial' : 'dagre';
    setLayoutMode(nextMode);

    const layouted =
      nextMode === 'dagre'
        ? getDagreLayout(nodes, edges)
        : getForceRadialLayout(nodes, edges);

    setNodes(layouted.nodes);
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
  }, [layoutMode, nodes, edges, setNodes, fitView]);

  // Viewport Handlers
  const handleZoomIn = () => {
    zoomIn({ duration: 200 });
    setTimeout(() => setZoomPercent(Math.round(getZoom() * 100)), 220);
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 200 });
    setTimeout(() => setZoomPercent(Math.round(getZoom() * 100)), 220);
  };

  const handleResetView = () => {
    fitView({ padding: 0.2, duration: 300 });
    setZoomPercent(100);
    setSelection(null);
    setHighlightedIds([]);
  };

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
      return !prev;
    });
  }, [fitView]);

  // Node Click Inspector Handler
  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    const connectedEdges = edges.filter(
      (e) => e.source === node.id || e.target === node.id
    );

    const connections = connectedEdges.map((e) => {
      const otherId = e.source === node.id ? e.target : e.source;
      const otherNode = nodes.find((n) => n.id === otherId);
      return {
        nodeId: otherId,
        nodeLabel: (otherNode?.data?.label as string) || otherId,
        edgeLabel: (e.label as string) || 'connected',
      };
    });

    setSelection({
      type: 'node',
      id: node.id,
      label: (node.data.label as string) || node.id,
      category: (node.data.category as string) || 'entity_wallet',
      degree: connectedEdges.length,
      connections,
    });

    setHighlightedIds([node.id, ...connections.map((c) => c.nodeId)]);
  };

  // Edge Click Inspector Handler
  const handleEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    const srcNode = nodes.find((n) => n.id === edge.source);
    const tgtNode = nodes.find((n) => n.id === edge.target);

    setSelection({
      type: 'edge',
      id: edge.id,
      label: (edge.label as string) || 'relationship',
      sourceId: edge.source,
      sourceLabel: (srcNode?.data?.label as string) || edge.source,
      targetId: edge.target,
      targetLabel: (tgtNode?.data?.label as string) || edge.target,
    });

    setHighlightedIds([edge.source, edge.target]);
  };

  // Edge Mouse Enter Highlight
  const handleEdgeMouseEnter = (_: React.MouseEvent, edge: Edge) => {
    setHighlightedIds([edge.source, edge.target]);
  };

  const handleEdgeMouseLeave = () => {
    if (!selection) {
      setHighlightedIds([]);
    }
  };

  return (
    <div className={isFullscreen 
      ? "fixed inset-0 z-[100] bg-white p-4 sm:p-8 space-y-6 overflow-y-auto"
      : "w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-8"}>
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Synthetic Relationship Graph
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Time-safe topological graph proxy visualization (Synthetic entities, transactions & IP observations)
          </p>
        </div>

        {/* TOOLBAR */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-sm shrink-0">
          <button
            type="button"
            onClick={() => setViewMode((prev) => (prev === 'wallets' ? 'entities' : 'wallets'))}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
              viewMode === 'entities'
                ? 'bg-purple-900 text-white shadow-sm'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
            title="Toggle Raw Wallets vs Clustered Entity Supernodes"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>{viewMode === 'entities' ? 'Entity Supernodes' : 'Raw Wallets'}</span>
          </button>

          <button
            type="button"
            onClick={toggleLayout}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 transition-colors"
            title="Toggle Dagre Tree vs Radial Layout"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-blue-600" />
            <span className="capitalize">{layoutMode} Layout</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />


          <button
            type="button"
            onClick={handleZoomOut}
            className="rounded-xl p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <span className="font-mono text-xs font-bold text-slate-700 min-w-[42px] text-center">
            {zoomPercent}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            className="rounded-xl p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleResetView}
            className="rounded-xl p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Reset / Fit View"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          
          <div className="h-4 w-px bg-slate-200 mx-1" />

          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-xl p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* LEGEND PILLS ROW */}
      <div className="flex flex-wrap items-center gap-3 text-xs bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
          Legend:
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400 bg-rose-50 px-3 py-1 font-bold text-rose-700">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          Suspicious Node
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400 bg-emerald-50 px-3 py-1 font-bold text-emerald-700">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Transaction
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400 bg-sky-50 px-3 py-1 font-bold text-sky-700">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
          Entity Wallet
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-violet-400 bg-violet-50 px-3 py-1 font-bold text-violet-700">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
          IP Observation
        </span>
      </div>

      {/* GRAPH CANVAS & INSPECTOR SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REACT FLOW CANVAS */}
        <div className={`${isFullscreen ? 'lg:col-span-3 h-[85vh]' : 'lg:col-span-2 h-[480px]'} relative rounded-3xl border border-slate-200/90 bg-slate-50/60 overflow-hidden shadow-inner`}>
          <ReactFlow
            nodes={updatedNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onEdgeMouseEnter={handleEdgeMouseEnter}
            onEdgeMouseLeave={handleEdgeMouseLeave}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.5}
            maxZoom={2.0}
            defaultEdgeOptions={{ type: 'customPill' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#CBD5E1" />
          </ReactFlow>
        </div>

        {/* INSPECTOR PANEL */}
        {!isFullscreen && (
          <div className="lg:col-span-1 min-h-[480px]">
            <Inspector selection={selection} />
          </div>
        )}
      </div>
    </div>
  );
}

// Export Wrapper Component with ReactFlowProvider
export function GraphCanvas({ graph }: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvas graph={graph} />
    </ReactFlowProvider>
  );
}
