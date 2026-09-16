"""Service layer for Alert List and Alert Detail queries."""

from app.core.config import RULE_CODE_MAP, derive_typology, plain_reason
from app.core.errors import APIException
from app.schemas.alerts import (
    AlertDetailItem,
    AlertDetailPayload,
    AlertListItem,
    AlertListPayload,
    EvidenceItem,
    PriorityBand,
    ReviewState,
    SortOption,
)
from app.storage.artifact_store import store




class AlertService:
    """Business logic for serving alert queue and detail views."""

    @staticmethod
    def list_alerts(
        page: int = 1,
        page_size: int = 25,
        min_risk: float | None = None,
        review_state: str | None = None,
        scenario_key: str | None = None,
        sort: str = "RISK_DESC",
    ) -> AlertListPayload:
        """Fetch paginated, filtered, and sorted alert items."""

        if not store.is_loaded:
            store.load()

        filtered = list(store.alerts_list)

        # Filter by min_risk
        if min_risk is not None:
            filtered = [a for a in filtered if a.get("risk_score", 0) >= min_risk]

        # Filter by review_state
        if review_state is not None:
            # In current prototype, all alerts default to UNREVIEWED
            if review_state.upper() != "UNREVIEWED":
                filtered = []
            else:
                filtered = [a for a in filtered]

        # Sorting logic
        if sort == "TIME_DESC":
            filtered.sort(key=lambda a: a.get("observed_at", ""), reverse=True)
        else:  # RISK_DESC default
            filtered.sort(
                key=lambda a: (a.get("risk_score", 0), a.get("ml_probability", 0.0)),
                reverse=True,
            )

        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size
        paginated_raw = filtered[start:end]

        items: list[AlertListItem] = []
        for raw in paginated_raw:
            aid = raw["alert_id"]
            eid = raw["event_id"]
            wallets = store.event_wallet_map.get(eid, (raw.get("entity_id", "syn_w_0000"), "syn_w_0000"))
            
            # Find top evidence reason
            ev_list = store.evidence_by_alert_id.get(aid, [])
            if ev_list:
                # Top evidence is the first one or the one with highest |shap_value|
                top_ev = max(ev_list, key=lambda e: abs(e.get("shap_value", 0)))
                top_reason = top_ev.get("message", "Synthetic model risk score elevated.")
            else:
                top_reason = "Synthetic model risk score elevated."

            risk_score = raw.get("risk_score", 0)
            priority_band: PriorityBand = (
                "REVIEW_PRIORITY" if risk_score >= 65 else "LOW_PRIORITY"
            )
            review_st: ReviewState = "UNREVIEWED"
            raw_rules = raw.get("rule_hits", [])
            shap_feats = [e.get("feature", "") for e in ev_list if e.get("feature")]
            typ_name, typ_conf = derive_typology(raw_rules, risk_score, shap_feats)


            item = AlertListItem(
                alert_id=aid,
                event_id=eid,
                observed_at=raw["observed_at"],
                source_wallet=wallets[0],
                target_wallet=wallets[1],
                risk_score=risk_score,
                ml_probability=raw.get("ml_probability", 0.0),
                novelty_score=raw.get("novelty_score", 0.0),
                graph_risk_score=raw.get("graph_risk_score", 0.0),
                baseline_score=raw.get("baseline_score", 0),
                priority_band=priority_band,
                review_state=review_st,
                top_reason=top_reason,
                typology=typ_name,
                typology_confidence=typ_conf,
                synthetic_notice="Synthetic evidence only. Human review required.",
            )
            items.append(item)

        return AlertListPayload(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
        )

    @staticmethod
    def get_alert_detail(alert_id: str) -> AlertDetailPayload:
        """Fetch comprehensive detail for a single alert."""

        if not store.is_loaded:
            store.load()

        raw = store.alerts_by_id.get(alert_id)
        if not raw:
            raise APIException(
                status_code=404,
                code="ALERT_NOT_FOUND",
                message=f"No alert with ID '{alert_id}' exists in the current run.",
            )

        eid = raw["event_id"]
        wallets = store.event_wallet_map.get(eid, (raw.get("entity_id", "syn_w_0000"), "syn_w_0000"))
        risk_score = raw.get("risk_score", 0)
        priority_band: PriorityBand = (
            "REVIEW_PRIORITY" if risk_score >= 65 else "LOW_PRIORITY"
        )
        review_st: ReviewState = "UNREVIEWED"

        raw_rules = raw.get("rule_hits", [])
        raw_evidences = store.evidence_by_alert_id.get(alert_id, [])
        shap_feats = [e.get("feature", "") for e in raw_evidences if e.get("feature")]
        typ_name, typ_conf = derive_typology(raw_rules, risk_score, shap_feats)

        alert_sub = AlertDetailItem(
            alert_id=alert_id,
            event_id=eid,
            observed_at=raw["observed_at"],
            source_wallet=wallets[0],
            target_wallet=wallets[1],
            risk_score=risk_score,
            ml_probability=raw.get("ml_probability", 0.0),
            novelty_score=raw.get("novelty_score", 0.0),
            graph_risk_score=raw.get("graph_risk_score", 0.0),
            baseline_score=raw.get("baseline_score", 0),
            priority_band=priority_band,
            review_state=review_st,
            typology=typ_name,
            typology_confidence=typ_conf,
            synthetic_notice="Synthetic evidence only. Human review required.",
        )


        # Map rule hits
        raw_rules = raw.get("rule_hits", [])
        mapped_rules = [RULE_CODE_MAP.get(r, r) for r in raw_rules]

        # Build evidence items
        raw_evidences = store.evidence_by_alert_id.get(alert_id, [])
        evidence_items: list[EvidenceItem] = []
        for idx, ev in enumerate(raw_evidences, start=1):
            feature_name = ev.get("feature", "unknown_feature")
            direction_val = "INCREASED_RISK" if ev.get("direction") == "INCREASED_RISK" or ev.get("shap_value", 0) >= 0 else "DECREASED_RISK"
            pr = plain_reason(feature_name, direction_val)
            ev_item = EvidenceItem(
                evidence_id=f"evd_{alert_id}_{feature_name}",
                feature=feature_name,
                feature_value=float(ev.get("feature_value", 0.0)),
                shap_value=float(ev.get("shap_value", 0.0)),
                direction=direction_val,
                message=ev.get("message", f"Synthetic feature {feature_name} affected risk score."),
                plain_reason=pr,
            )
            evidence_items.append(ev_item)


        # Linked entity IDs (unique source wallet, target wallet, entity_id)
        linked_set = {wallets[0], wallets[1]}
        if raw.get("entity_id"):
            linked_set.add(raw["entity_id"])
        linked_entity_ids = sorted(list(linked_set))

        return AlertDetailPayload(
            alert=alert_sub,
            rule_hits=mapped_rules,
            evidence=evidence_items,
            linked_entity_ids=linked_entity_ids,
            review_history=[],
        )
