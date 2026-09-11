from typing import Optional
from pydantic import BaseModel


class BacktestDataPoint(BaseModel):
    year_month: str
    our_index: float
    dgca_reference: float
    error: float
    abs_error: float
    pct_error: float
    event_annotation: Optional[str] = None


class BacktestMetrics(BaseModel):
    mae: float
    rmse: float
    correlation: float
    mean_bias: float
    max_divergence: float
    total_months_evaluated: int
    validation_status: str


class BacktestResponse(BaseModel):
    metrics: BacktestMetrics
    methodology_note: str
    series: list[BacktestDataPoint]
