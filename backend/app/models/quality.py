from pydantic import BaseModel


class SourceReliability(BaseModel):
    source: str
    records_collected: int
    records_valid: int
    validity_pct: float
    status: str


class QualitySummaryResponse(BaseModel):
    records_collected: int
    records_valid: int
    records_rejected: int
    completeness_pct: float
    duplicate_rate_pct: float
    outlier_rate_pct: float
    staleness_pct: float
    last_ingestion: str
    sources: list[SourceReliability]
