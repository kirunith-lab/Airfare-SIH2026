# Architecture

Scrapers produce `Flight` records. Services normalize and deduplicate those records before the index engine computes route-level metrics. FastAPI exposes the metrics to the React client.
