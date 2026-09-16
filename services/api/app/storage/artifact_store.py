"""Storage layer for reading committed ML artifacts and building relationship indices."""

import json
from collections import defaultdict
from pathlib import Path
from typing import Any

import pandas as pd
from app.core.config import RUN_DIR


class ArtifactStore:
    """In-memory store reading approved ML run artifacts."""

    def __init__(self, run_dir: str | Path | None = None):
        self.run_dir = Path(run_dir or RUN_DIR)
        self.is_loaded = False
        self.alerts_by_id: dict[str, dict[str, Any]] = {}
        self.alerts_list: list[dict[str, Any]] = []
        self.evidence_by_alert_id: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self.event_wallet_map: dict[str, tuple[str, str]] = {}  # event_id -> (input_wallet, output_wallet)
        self.wallet_adjacency: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self.wallet_risk_map: dict[str, int] = {}
        self.wallet_to_entity_map: dict[str, str] = {}
        self.entities_by_id: dict[str, dict[str, Any]] = {}
        self.entities_list: list[dict[str, Any]] = []
        self.model_card: dict[str, Any] = {}
        self.metrics_test: dict[str, Any] = {}

    def load(self) -> None:
        """Load artifacts from run_dir into memory idempotently."""
        if self.is_loaded:
            return

        if not self.run_dir.exists():
            raise RuntimeError(f"ML run directory does not exist: {self.run_dir}")

        # Clear existing collections before loading
        self.alerts_by_id.clear()
        self.alerts_list.clear()
        self.evidence_by_alert_id.clear()
        self.event_wallet_map.clear()
        self.wallet_adjacency.clear()
        self.wallet_risk_map.clear()
        self.wallet_to_entity_map.clear()
        self.entities_by_id.clear()
        self.entities_list.clear()
        self.model_card.clear()
        self.metrics_test.clear()

        alerts_path = self.run_dir / "alerts.json"
        evidence_path = self.run_dir / "evidence.json"
        features_path = self.run_dir / "features.parquet"
        model_card_path = self.run_dir / "model_card.json"
        metrics_test_path = self.run_dir / "metrics_test.json"

        # Load alerts.json
        if alerts_path.is_file():
            raw_alerts = json.loads(alerts_path.read_text(encoding="utf-8"))
            self.alerts_list = raw_alerts
            for alert in raw_alerts:
                aid = alert["alert_id"]
                self.alerts_by_id[aid] = alert

        # Load evidence.json
        if evidence_path.is_file():
            raw_evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
            for ev in raw_evidence:
                aid = ev["alert_id"]
                self.evidence_by_alert_id[aid].append(ev)

        # Load model_card.json
        if model_card_path.is_file():
            self.model_card = json.loads(model_card_path.read_text(encoding="utf-8"))

        # Load metrics_test.json
        if metrics_test_path.is_file():
            self.metrics_test = json.loads(metrics_test_path.read_text(encoding="utf-8"))

        # Load features.parquet for wallet mapping and graph adjacency
        if features_path.is_file():
            df = pd.read_parquet(
                features_path,
                columns=["event_id", "input_wallet", "output_wallet", "observed_at"]
            )
            for row in df.itertuples(index=False):
                self.event_wallet_map[row.event_id] = (row.input_wallet, row.output_wallet)
                
                # Build directed adjacency list
                obs_at = row.observed_at
                if isinstance(obs_at, pd.Timestamp):
                    obs_str = obs_at.isoformat()
                else:
                    obs_str = str(obs_at)

                edge_info = {
                    "source": row.input_wallet,
                    "target": row.output_wallet,
                    "event_id": row.event_id,
                    "observed_at": obs_str,
                }
                self.wallet_adjacency[row.input_wallet].append(edge_info)
                self.wallet_adjacency[row.output_wallet].append(edge_info)

        # Build wallet risk score map from alerts
        for alert in self.alerts_list:
            event_id = alert.get("event_id")
            risk = alert.get("risk_score", 0)
            if event_id in self.event_wallet_map:
                src, tgt = self.event_wallet_map[event_id]
                self.wallet_risk_map[src] = max(self.wallet_risk_map.get(src, 0), risk)
                self.wallet_risk_map[tgt] = max(self.wallet_risk_map.get(tgt, 0), risk)
            entity_id = alert.get("entity_id")
            if entity_id:
                self.wallet_risk_map[entity_id] = max(self.wallet_risk_map.get(entity_id, 0), risk)

        # Perform entity address clustering using Union-Find engine
        cluster_events = [
            {"event_id": eid, "input_wallet": src, "output_wallet": tgt}
            for eid, (src, tgt) in self.event_wallet_map.items()
        ]
        try:
            from tracegraph.cluster import EntityClusterer
            clusterer = EntityClusterer()
            raw_clusters = clusterer.fit_events(cluster_events)

            self.wallet_to_entity_map = clusterer.wallet_to_entity
            self.entities_by_id = raw_clusters

            for ent_id, ent_info in raw_clusters.items():
                wallets = ent_info["wallets"]
                max_risk = max((self.wallet_risk_map.get(w, 0) for w in wallets), default=0)
                tx_count = sum(len(self.wallet_adjacency.get(w, [])) for w in wallets) // 2
                ent_record = {
                    "entity_id": ent_id,
                    "root_wallet": ent_info["root_wallet"],
                    "wallet_count": len(wallets),
                    "wallets": wallets,
                    "risk_score": max_risk,
                    "transaction_count": max(1, tx_count),
                    "status": "Flagged" if max_risk >= 75 else "Monitored" if max_risk >= 50 else "Normal",
                }
                self.entities_list.append(ent_record)

            self.entities_list.sort(key=lambda e: (e["risk_score"], e["wallet_count"]), reverse=True)
        except Exception as err:
            print(f"[ArtifactStore] Entity clustering skipped/warning: {err}")

        self.is_loaded = True



# Global artifact store singleton
store = ArtifactStore()
