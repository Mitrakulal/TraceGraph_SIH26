"""Tests for Clustered Entity Explorer endpoints."""

def test_list_entities_200(client):
    response = client.get("/api/v1/entities")
    assert response.status_code == 200
    data = response.json()["data"]
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


def test_entity_detail_valid(client):
    response = client.get("/api/v1/entities")
    assert response.status_code == 200
    items = response.json()["data"]["items"]
    if items:
        ent_id = items[0]["entity_id"]
        detail_res = client.get(f"/api/v1/entities/{ent_id}")
        assert detail_res.status_code == 200
        detail_data = detail_res.json()["data"]
        assert detail_data["entity_id"] == ent_id
        assert "wallets" in detail_data


def test_entity_detail_404(client):
    response = client.get("/api/v1/entities/ent_invalid_999999")
    assert response.status_code == 404
