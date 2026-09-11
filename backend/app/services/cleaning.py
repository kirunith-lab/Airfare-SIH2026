import re
from typing import Any
from app.scrapers.base import RawQuote


def clean_currency_value(val: Any) -> float:
    if isinstance(val, (int, float)):
        return float(val)
    if not val:
        return 0.0
    # Remove currency symbols (₹, INR, Rs), commas and extra spaces
    cleaned = re.sub(r"[^\d.]", "", str(val))
    return float(cleaned) if cleaned else 0.0


def clean_airport_code(code: str) -> str:
    return code.strip().upper()[:3] if code else ""


def clean_raw_quote(quote: RawQuote) -> RawQuote:
    return RawQuote(
        source=quote.source.strip(),
        origin=clean_airport_code(quote.origin),
        destination=clean_airport_code(quote.destination),
        travel_date=quote.travel_date.strip(),
        airline_code=quote.airline_code.strip().upper(),
        airline_name=quote.airline_name.strip(),
        flight_number=quote.flight_number.strip().upper(),
        departure_time=quote.departure_time.strip(),
        arrival_time=quote.arrival_time.strip(),
        duration_minutes=int(quote.duration_minutes),
        stops=int(quote.stops),
        cabin_class=quote.cabin_class.strip().capitalize() if quote.cabin_class else "Economy",
        base_fare=clean_currency_value(quote.base_fare),
        taxes=clean_currency_value(quote.taxes),
        total_fare=clean_currency_value(quote.total_fare),
        collection_timestamp=quote.collection_timestamp,
    )
