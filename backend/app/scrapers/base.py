from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass
class RawQuote:
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
    collection_timestamp: Optional[str] = None


class ScraperAdapter(ABC):
    @property
    @abstractmethod
    def source_name(self) -> str:
        pass

    @abstractmethod
    def search_flights(self, origin: str, destination: str, travel_date: date) -> list[RawQuote]:
        pass
