from pydantic import BaseModel


class Route(BaseModel):
    id: int
    origin: str
    destination: str
    route_code: str
    origin_name: str
    destination_name: str
    weight: float
    base_price: float
    active: bool


class RouteMovement(BaseModel):
    route_code: str
    corridor_name: str
    current_price: float
    base_price: float
    mom_change_pct: float
    weight_pct: float
    trend: str
