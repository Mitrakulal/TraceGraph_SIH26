# TraceGraph AI Frontend-Safe Fixtures

This folder contains API-shaped static JSON only. The backend data owner creates it from approved synthetic artifacts; the frontend team may use it until the local API is ready.

Every fixture must match a V1 schema in `../contracts/v1/`. Never place `truth/labels.csv`, `is_anomalous`, `scenario_id`, `severity_truth`, model binaries, or real data in this directory.
