from typing import Optional
from pydantic import BaseModel
from app.models.route import RouteMovement


class BookingBucket(BaseModel):
    bucket_label: str  # '0-6d', '7-14d', '15-29d', '30-44d', '45-59d', '60+d'
    advance_min: int
    advance_max: int
    mean_fare: float
    median_fare: float
    min_fare: float
    max_fare: float
    sample_count: int
    discount_vs_last_minute_pct: float
    is_sweet_spot: bool


class BookingWindowResponse(BaseModel):
    route_code: str
    corridor_name: str
    optimal_window: str
    optimal_savings_pct: float
    buckets: list[BookingBucket]
    recommendation: str


class SummaryMetrics(BaseModel):
    current_index: float
    mom_change_pct: float
    routes_tracked: int
    data_points_total: int
    data_quality_pct: float
    staleness_pct: float
    laspeyres_value: float
    jevons_value: float
    base_period: str
    ai_analyst_summary: str
    top_movements: list[RouteMovement]
