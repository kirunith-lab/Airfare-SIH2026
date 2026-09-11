from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class FlightSearchRequest(BaseModel):
    origin: str = Field(..., min_length=3, max_length=3, description="Origin 3-letter IATA code, e.g. BOM")
    destination: str = Field(..., min_length=3, max_length=3, description="Destination 3-letter IATA code, e.g. MAA")
    travel_date: date = Field(..., description="Travel date in YYYY-MM-DD")
    cabin_class: Optional[str] = "Economy"


class FairFareScore(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Score 0-100 where higher means better value vs historical distribution")
    rating: str = Field(..., description="GOOD, FAIR, or HIGH")
    historical_median: float
    percentile: float
    advance_window_label: str
    explanation: str


class FlightQuote(BaseModel):
    id: str
    airline_code: str
    airline_name: str
    flight_number: str
    origin: str
    destination: str
    travel_date: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    duration_display: str
    stops: int
    base_fare: float
    taxes: float
    total_fare: float
    source: str
    fair_fare: Optional[FairFareScore] = None


class FlightSearchResponse(BaseModel):
    origin: str
    destination: str
    travel_date: str
    advance_days: int
    total_flights: int
    historical_median_fare: float
    recommended_window: str
    flights: list[FlightQuote]
