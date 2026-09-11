from dataclasses import dataclass
from typing import Optional


@dataclass
class ScrapedFlightItem:
    source: str
    origin: str
    destination: str
    travel_date: str
    airline_code: str
    airline_name: str
    flight_number: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    stops: int
    cabin_class: str
    base_fare: float
    taxes: float
    total_fare: float
    raw_fare_text: Optional[str] = None
    collection_timestamp: Optional[str] = None
