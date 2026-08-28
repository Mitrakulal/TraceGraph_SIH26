"""Model & Run Evidence router endpoint."""

from fastapi import APIRouter

from app.core.config import RUN_ID
from app.core.errors import APIException
from app.schemas.common import DataEnvelope
from app.schemas.model import ModelCurrentPayload, ModelMetrics
from app.storage.artifact_store import store

router = APIRouter()

_LIMITATION = (
    "Held-out controlled synthetic benchmark only; not a real-world accuracy claim."
)


@router.get("/model/current", response_model=DataEnvelope[ModelCurrentPayload])
def get_model_current() -> DataEnvelope[ModelCurrentPayload]:
    """Return current model run metadata, metrics, and artifact status.

    Drives the Model & Run Evidence screen. All values are read from committed
    ML artifacts — no labels, model internals, or disk paths are exposed.
    """
    if not store.is_loaded:
        store.load()

    card = store.model_card
    if not card:
        raise APIException(
            status_code=503,
            code="ARTIFACTS_NOT_READY",
            message="Model artifacts are not loaded. Verify the run directory exists.",
        )

    # Read metrics from the committed metrics_test.json artifact
    raw_metrics = store.metrics_test
    try:
        metrics = ModelMetrics(
            test_pr_auc=raw_metrics.get("pr_auc", 0.0),
            test_f1=raw_metrics.get("f1_at_threshold", 0.0),
            test_false_positives_per_1000=raw_metrics.get("false_positives_per_1000", 0.0),
        )
    except Exception as exc:
        raise APIException(
            status_code=503,
            code="METRICS_UNAVAILABLE",
            message=f"Could not read test metrics from committed artifacts: {exc}",
        ) from exc

    dataset_info = card.get("dataset", {})
    dataset_id = dataset_info.get("dataset_id", "sih26146-synthetic-60000-v2")

    # Derive model names from model_card models block
    models_block = card.get("models", {})
    model_names = [k.replace("_", " ").title() for k in models_block.keys()] or [
        "IsolationForest",
        "XGBoost",
    ]

    payload = ModelCurrentPayload(
        run_id=RUN_ID,
        dataset_version=dataset_id,
        data_classification="SYNTHETIC_ONLY",
        models=model_names,
        feature_count=int(card.get("feature_count", 18)),
        risk_threshold=65,
        metrics=metrics,
        artifact_status="READY",
        limitation=_LIMITATION,
    )
    return DataEnvelope(data=payload)
