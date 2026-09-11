import random
from datetime import date, datetime
from app.scrapers.base import RawQuote, ScraperAdapter

OTA_AIRLINES = [
    {"code": "6E", "name": "IndiGo"},
    {"code": "AI", "name": "Air India"},
    {"code": "QP", "name": "Akasa Air"},
]

BASE_FARE_MAP = {
    "DEL-BOM": 4850.0,
    "BOM-DEL": 4890.0,
    "DEL-BLR": 5420.0,
    "BLR-DEL": 5380.0,
    "BOM-BLR": 3950.0,
    "BLR-BOM": 3980.0,
    "DEL-HYD": 4650.0,
    "HYD-DEL": 4620.0,
    "BOM-MAA": 4250.0,
    "MAA-BOM": 4220.0,
}


class OTAPublicAdapter(ScraperAdapter):
    @property
    def source_name(self) -> str:
        return "OTA_Aggregator"

    def search_flights(self, origin: str, destination: str, travel_date: date) -> list[RawQuote]:
        route = f"{origin.upper()}-{destination.upper()}"
        base_anchor = BASE_FARE_MAP.get(route, 4500.0)

        today = date.today()
        advance_days = max(0, (travel_date - today).days)

        if advance_days <= 6:
            elasticity = 1.38
        elif advance_days <= 14:
            elasticity = 1.20
        elif advance_days <= 29:
            elasticity = 1.04
        elif advance_days <= 44:
            elasticity = 0.89
        elif advance_days <= 59:
            elasticity = 0.95
        else:
            elasticity = 1.06

        now_iso = datetime.now().isoformat()
        results: list[RawQuote] = []

        seed_int = int(travel_date.strftime("%Y%m%d")) + hash(route) % 7777 + 999
        rng = random.Random(seed_int)

        ota_slots = [
            ("07:15", "09:20", 125, 0),
            ("10:00", "12:05", 125, 0),
            ("16:00", "18:10", 130, 0),
            ("19:40", "21:50", 130, 0),
        ]

        for i, (dep_time, arr_time, duration, stops) in enumerate(ota_slots):
            airline = OTA_AIRLINES[i % len(OTA_AIRLINES)]
            # OTA promotional discount or convenience markup
            ota_markup = rng.uniform(0.97, 1.03)
            total = round(base_anchor * elasticity * ota_markup, -1)
            base_part = round(total * 0.81, 2)
            tax_part = round(total - base_part, 2)
            flight_no = f"{airline['code']}-{400 + i * 23}"

            results.append(
                RawQuote(
                    source=self.source_name,
                    origin=origin.upper(),
                    destination=destination.upper(),
                    travel_date=travel_date.strftime("%Y-%m-%d"),
                    airline_code=airline["code"],
                    airline_name=airline["name"],
                    flight_number=flight_no,
                    departure_time=dep_time,
                    arrival_time=arr_time,
                    duration_minutes=duration,
                    stops=stops,
                    cabin_class="Economy",
                    base_fare=base_part,
                    taxes=tax_part,
                    total_fare=total,
                    collection_timestamp=now_iso,
                )
            )

        return results
