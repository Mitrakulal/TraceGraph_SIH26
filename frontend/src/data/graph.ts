// Synthetic relationship graph data for the investigation view.
// Not a real blockchain graph — all IDs are synthetic.

export type NodeType = 'entity' | 'transaction' | 'network';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  riskScore?: number;
  suspicious?: boolean;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight?: number;
}

export interface AlertGraph {
  alertId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const alertGraphs: AlertGraph[] = [
  {
    alertId: 'alt_00001_syn_evt_004201',
    nodes: [
      { id: 'n1', label: 'SYN-WAL-0042', type: 'entity', riskScore: 96, suspicious: true, x: 300, y: 40 },
      { id: 'n2', label: 'SYN-TX-8F21', type: 'transaction', riskScore: 94, suspicious: true, x: 300, y: 150 },
      { id: 'n3', label: 'SYN-WAL-0119', type: 'entity', riskScore: 61, suspicious: false, x: 130, y: 270 },
      { id: 'n4', label: 'SYN-WAL-0204', type: 'entity', riskScore: 58, suspicious: false, x: 470, y: 270 },
      { id: 'n5', label: 'SYN-TX-91A2', type: 'transaction', riskScore: 77, suspicious: true, x: 470, y: 390 },
      { id: 'n6', label: 'SYN-IP-182.3', type: 'network', riskScore: 83, suspicious: true, x: 130, y: 390 },
      { id: 'n7', label: 'SYN-WAL-0391', type: 'entity', riskScore: 45, suspicious: false, x: 470, y: 510 },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', label: 'sent' },
      { id: 'e2', source: 'n2', target: 'n3', label: 'received by' },
      { id: 'e3', source: 'n2', target: 'n4', label: 'received by' },
      { id: 'e4', source: 'n4', target: 'n5', label: 'sent' },
      { id: 'e5', source: 'n1', target: 'n6', label: 'network obs' },
      { id: 'e6', source: 'n5', target: 'n7', label: 'received by' },
    ],
  },
  {
    alertId: 'alt_00002_syn_evt_004202',
    nodes: [
      { id: 'n1', label: 'SYN-WAL-0019', type: 'entity', riskScore: 93, suspicious: true, x: 300, y: 40 },
      { id: 'n2', label: 'SYN-TX-4D11', type: 'transaction', riskScore: 91, suspicious: true, x: 300, y: 150 },
      { id: 'n3', label: 'SYN-WAL-0231', type: 'entity', riskScore: 32, suspicious: false, x: 60, y: 270 },
      { id: 'n4', label: 'SYN-WAL-0388', type: 'entity', riskScore: 28, suspicious: false, x: 160, y: 270 },
      { id: 'n5', label: 'SYN-WAL-0412', type: 'entity', riskScore: 41, suspicious: false, x: 260, y: 270 },
      { id: 'n6', label: 'SYN-WAL-0519', type: 'entity', riskScore: 35, suspicious: false, x: 360, y: 270 },
      { id: 'n7', label: 'SYN-WAL-0621', type: 'entity', riskScore: 29, suspicious: false, x: 460, y: 270 },
      { id: 'n8', label: 'SYN-WAL-0703', type: 'entity', riskScore: 37, suspicious: false, x: 560, y: 270 },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', label: 'sent' },
      { id: 'e2', source: 'n2', target: 'n3', label: 'fan-out' },
      { id: 'e3', source: 'n2', target: 'n4', label: 'fan-out' },
      { id: 'e4', source: 'n2', target: 'n5', label: 'fan-out' },
      { id: 'e5', source: 'n2', target: 'n6', label: 'fan-out' },
      { id: 'e6', source: 'n2', target: 'n7', label: 'fan-out' },
      { id: 'e7', source: 'n2', target: 'n8', label: 'fan-out' },
    ],
  },
];

const defaultGraph: AlertGraph = {
  alertId: 'default',
  nodes: [
    { id: 'n1', label: 'SYN-ENTITY-A', type: 'entity', riskScore: 75, suspicious: true, x: 300, y: 40 },
    { id: 'n2', label: 'SYN-TX-C3D1', type: 'transaction', riskScore: 70, suspicious: true, x: 300, y: 160 },
    { id: 'n3', label: 'SYN-ENTITY-B', type: 'entity', riskScore: 42, suspicious: false, x: 140, y: 280 },
    { id: 'n4', label: 'SYN-ENTITY-C', type: 'entity', riskScore: 55, suspicious: false, x: 460, y: 280 },
    { id: 'n5', label: 'SYN-IP-10.1.2', type: 'network', riskScore: 67, suspicious: true, x: 300, y: 400 },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', label: 'sent' },
    { id: 'e2', source: 'n2', target: 'n3', label: 'received by' },
    { id: 'e3', source: 'n2', target: 'n4', label: 'received by' },
    { id: 'e4', source: 'n1', target: 'n5', label: 'network obs' },
  ],
};

export function getAlertGraph(alertId: string): AlertGraph {
  return alertGraphs.find((g) => g.alertId === alertId) ?? {
    ...defaultGraph,
    alertId,
  };
}
