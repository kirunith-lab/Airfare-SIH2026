from typing import Optional
from pydantic import BaseModel


class IndexPoint(BaseModel):
    date: str
    laspeyres: float
    jevons: float
    weighted_price: float
    coverage_pct: float
    event_annotation: Optional[str] = None


class NationalIndexResponse(BaseModel):
    frequency: str  # daily or monthly
    base_period: str
    current_laspeyres: float
    current_jevons: float
    current_weighted_fare: float
    mom_change_pct: float
    yoy_change_pct: float
    coverage_pct: float
    routes_counted: int
    total_routes: int
    last_updated: str
    series: list[IndexPoint]


class RouteIndexPoint(BaseModel):
    date: str
    average_fare: float
    index_value: float


class RouteIndexResponse(BaseModel):
    route_code: str
    corridor_name: str
    base_price: float
    current_price: float
    change_from_base_pct: float
    mom_change_pct: float
    weight: float
    trend: str
    history: list[RouteIndexPoint]
