export type TransactionStatus =
  | 'Normal'
  | 'Flagged'
  | 'Under Review';

export interface Transaction {
  id: string;
  hash: string;
  amount: number;
  inputs: number;
  outputs: number;
  fee: number;
  entity: string;
  riskScore: number;
  status: TransactionStatus;
  timestamp: string;
}

export const transactions: Transaction[] = [
  {
    id: 'TX-8A91C2',
    hash: 'a91c2e7f4b8d...',
    amount: 4.82,
    inputs: 7,
    outputs: 12,
    fee: 0.014,
    entity: 'Entity-7F3A',
    riskScore: 94,
    status: 'Flagged',
    timestamp: '2026-08-28 14:32:18',
  },
  {
    id: 'TX-41D7A9',
    hash: '41d7a9c2e1f0...',
    amount: 2.41,
    inputs: 5,
    outputs: 8,
    fee: 0.009,
    entity: 'Entity-19BC',
    riskScore: 87,
    status: 'Under Review',
    timestamp: '2026-08-28 13:47:02',
  },
  {
    id: 'TX-73BC11',
    hash: '73bc11fa02d9...',
    amount: 1.73,
    inputs: 4,
    outputs: 6,
    fee: 0.006,
    entity: 'Entity-A52D',
    riskScore: 82,
    status: 'Flagged',
    timestamp: '2026-08-28 12:21:45',
  },
  {
    id: 'TX-92FA10',
    hash: '92fa10bd73c1...',
    amount: 0.94,
    inputs: 3,
    outputs: 4,
    fee: 0.004,
    entity: 'Entity-4C82',
    riskScore: 71,
    status: 'Under Review',
    timestamp: '2026-08-28 11:08:31',
  },
  {
    id: 'TX-51AC83',
    hash: '51ac83de91f4...',
    amount: 0.62,
    inputs: 2,
    outputs: 3,
    fee: 0.002,
    entity: 'Entity-B814',
    riskScore: 66,
    status: 'Normal',
    timestamp: '2026-08-28 09:54:16',
  },
  {
    id: 'TX-30DE74',
    hash: '30de74a81c92...',
    amount: 0.31,
    inputs: 1,
    outputs: 2,
    fee: 0.001,
    entity: 'Entity-2D91',
    riskScore: 42,
    status: 'Normal',
    timestamp: '2026-08-28 08:42:09',
  },
];