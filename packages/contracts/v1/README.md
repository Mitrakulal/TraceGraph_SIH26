# TraceGraph AI API Contracts — V1

Put cross-team request and response JSON schemas in this folder before implementing a new endpoint or UI feature. The field names and enum values in these schemas are the agreement between `apps/web` and `services/api`.

The first contract files to add are `status.response.json`, `dashboard-summary.response.json`, `alerts.response.json`, `alert-detail.response.json`, `graph.response.json`, `model-current.response.json`, and `review.request.json`.

Do not include model files, true labels, synthetic scenario truth, personal data, or UI components in this package.
