export type EntityType =
  | 'Address'
  | 'Cluster'
  | 'IP';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  transactions: number;
  counterparties: number;
  riskScore: number;
  status: 'Normal' | 'Monitored' | 'Flagged';
  lastSeen: string;
}

export const entities: Entity[] = [
  {
    id: 'Entity-7F3A',
    name: 'Entity-7F3A',
    type: 'Cluster',
    transactions: 184,
    counterparties: 42,
    riskScore: 94,
    status: 'Flagged',
    lastSeen: '2026-08-28 14:32:18',
  },
  {
    id: 'Entity-19BC',
    name: 'Entity-19BC',
    type: 'Address',
    transactions: 127,
    counterparties: 31,
    riskScore: 87,
    status: 'Monitored',
    lastSeen: '2026-08-28 13:47:02',
  },
  {
    id: 'Entity-A52D',
    name: 'Entity-A52D',
    type: 'IP',
    transactions: 96,
    counterparties: 27,
    riskScore: 82,
    status: 'Flagged',
    lastSeen: '2026-08-28 12:21:45',
  },
  {
    id: 'Entity-4C82',
    name: 'Entity-4C82',
    type: 'Cluster',
    transactions: 83,
    counterparties: 19,
    riskScore: 71,
    status: 'Monitored',
    lastSeen: '2026-08-28 11:08:31',
  },
  {
    id: 'Entity-B814',
    name: 'Entity-B814',
    type: 'Address',
    transactions: 61,
    counterparties: 14,
    riskScore: 66,
    status: 'Normal',
    lastSeen: '2026-08-28 09:54:16',
  },
];