// Centralized environment-aware API configuration for development and cloud deployments
export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? "/api/v1" : "http://localhost:8000/api/v1");

export const DOCS_URL =
  import.meta.env.VITE_DOCS_URL ||
  (import.meta.env.PROD ? "/docs" : "http://localhost:8000/docs");
