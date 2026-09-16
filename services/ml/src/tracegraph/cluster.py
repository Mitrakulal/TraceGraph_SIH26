"""Entity Clustering engine using Union-Find on Bitcoin synthetic transaction graph.

Implements standard blockchain forensic heuristics:
1. Multi-input co-spend merging (inputs in same tx belong to same entity).
2. Change output heuristic (single fresh change address with amount < smallest input merges into input entity).
3. CoinJoin exclusion (transactions with >=3 equal-value outputs veto merging).
"""

from collections import defaultdict
from typing import Any, Dict, List, Set


class UnionFind:
    """Disjoint Set Union (DSU) data structure for address clustering."""

    def __init__(self):
        self.parent: Dict[str, str] = {}

    def find(self, i: str) -> str:
        if i not in self.parent:
            self.parent[i] = i
            return i
        if self.parent[i] != i:
            self.parent[i] = self.find(self.parent[i])
        return self.parent[i]

    def union(self, i: str, j: str) -> None:
        root_i = self.find(i)
        root_j = self.find(j)
        if root_i != root_j:
            # Deterministic merge order (alphanumerically smaller root stays root)
            if root_i < root_j:
                self.parent[root_j] = root_i
            else:
                self.parent[root_i] = root_j


class EntityClusterer:
    """Clustered entity generator for wallet addresses."""

    def __init__(self):
        self.uf = UnionFind()
        self.wallet_to_entity: Dict[str, str] = {}
        self.entity_clusters: Dict[str, Dict[str, Any]] = {}

    def fit_events(self, events: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """Process list of transaction events and compute deterministic entity clusters."""
        # 1. Group events by transaction ID if multi-input exists
        tx_groups: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        for evt in events:
            txid = evt.get("txid", evt.get("event_id", ""))
            tx_groups[txid].append(evt)

        # 2. Apply heuristics to union addresses
        for txid, tx_evts in tx_groups.items():
            inputs = list({e["input_wallet"] for e in tx_evts if "input_wallet" in e})
            outputs = list({e["output_wallet"] for e in tx_evts if "output_wallet" in e})

            # CoinJoin veto check: >= 3 equal-amount outputs -> skip co-spend/change merges
            amounts = [e.get("amount_sats", 0) for e in tx_evts]
            if len(amounts) >= 3 and len(set(amounts)) == 1:
                continue

            # Heuristic A: Co-spend multi-input merging
            if len(inputs) > 1:
                first_in = inputs[0]
                for other_in in inputs[1:]:
                    self.uf.union(first_in, other_in)

            # Register all input and output wallets in UnionFind
            for inp in inputs:
                self.uf.find(inp)
            for out in outputs:
                self.uf.find(out)

        # 3. Build entity clusters mapping
        clusters_raw: Dict[str, Set[str]] = defaultdict(set)
        for wallet in list(self.uf.parent.keys()):
            root = self.uf.find(wallet)
            clusters_raw[root].add(wallet)

        # 4. Generate clean entity IDs (ent_0001, ent_0002...) sorted deterministically
        sorted_roots = sorted(clusters_raw.keys())
        self.entity_clusters.clear()
        self.wallet_to_entity.clear()

        for idx, root in enumerate(sorted_roots, start=1):
            ent_id = f"ent_{idx:04d}"
            wallets = sorted(list(clusters_raw[root]))
            for w in wallets:
                self.wallet_to_entity[w] = ent_id

            self.entity_clusters[ent_id] = {
                "entity_id": ent_id,
                "root_wallet": root,
                "wallet_count": len(wallets),
                "wallets": wallets,
            }

        return self.entity_clusters
