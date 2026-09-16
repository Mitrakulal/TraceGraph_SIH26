"""Tests for Bulk File Ingestion endpoint."""

import io


def test_ingest_csv_upload_200(client):
    csv_data = "event_id,observed_at,input_wallet,output_wallet,amount_sats\nevt_001,2026-07-26,syn_w_1,syn_w_2,50000\n"
    file = ("events.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")
    response = client.post("/api/v1/ingest/upload", files={"file": file})
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["rows_ingested"] >= 1
    assert "links_built" in data
    assert "entities_clustered" in data


def test_ingest_empty_file_400(client):
    file = ("events.csv", io.BytesIO(b""), "text/csv")
    response = client.post("/api/v1/ingest/upload", files={"file": file})
    assert response.status_code == 400
