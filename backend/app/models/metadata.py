from pydantic import BaseModel


class BasketRouteMeta(BaseModel):
    route_code: str
    corridor_name: str
    weight: float
    weight_pct: float
    base_price: float


class MetadataResponse(BaseModel):
    title: str
    version: str
    base_period: str
    basket_routes: list[BasketRouteMeta]
    formulas: dict[str, str]
    data_sources: list[str]
    outlier_methodology: str
    lead_time_buckets: list[str]
    last_updated: str
