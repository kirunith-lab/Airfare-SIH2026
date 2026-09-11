import math
import random
from datetime import date, datetime
from app.scrapers.base import RawQuote, ScraperAdapter

AIRLINE_FLEET = [
    {"code": "6E", "name": "IndiGo", "prefix": "6E-"},
    {"code": "AI", "name": "Air India", "prefix": "AI-"},
    {"code": "QP", "name": "Akasa Air", "prefix": "QP-"},
    {"code": "SG", "name": "SpiceJet", "prefix": "SG-"},
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

SCHEDULES = [
    ("06:00", "08:10", 130, 0),
    ("08:30", "10:35", 125, 0),
    ("11:15", "13:25", 130, 0),
    ("14:40", "16:50", 130, 0),
    ("17:20", "19:30", 130, 0),
    ("20:10", "22:20", 130, 0),
    ("21:45", "00:15", 150, 0),
    ("13:00", "17:30", 270, 1),
]


class AirlineDirectAdapter(ScraperAdapter):
    @property
    def source_name(self) -> str:
        return "Airline_Direct"

    def search_flights(self, origin: str, destination: str, travel_date: date) -> list[RawQuote]:
        route = f"{origin.upper()}-{destination.upper()}"
        base_anchor = BASE_FARE_MAP.get(route, 4500.0)

        today = date.today()
        advance_days = max(0, (travel_date - today).days)

        # Dynamic lead-time elasticity: U-curve
        # 0-6 days: +35%
        # 7-14 days: +18%
        # 15-29 days: 0%
        # 30-44 days: -12% (Sweet spot)
        # 45-59 days: -5%
        # 60+ days: +5%
        if advance_days <= 6:
            elasticity = 1.35
        elif advance_days <= 14:
            elasticity = 1.18
        elif advance_days <= 29:
            elasticity = 1.02
        elif advance_days <= 44:
            elasticity = 0.88  # Sweet spot
        elif advance_days <= 59:
            elasticity = 0.94
        else:
            elasticity = 1.05

        now_iso = datetime.now().isoformat()
        results: list[RawQuote] = []

        # Seed pseudo-random deterministically per date + route so user searches on the same day are consistent
        seed_int = int(travel_date.strftime("%Y%m%d")) + hash(route) % 10000
        rng = random.Random(seed_int)

        for i, schedule in enumerate(SCHEDULES):
            airline = AIRLINE_FLEET[i % len(AIRLINE_FLEET)]
            dep_time, arr_time, duration, stops = schedule

            # Airline quote variation
            airline_skew = 1.0
            if airline["code"] == "6E":
                airline_skew = 0.98
            elif airline["code"] == "AI":
                airline_skew = 1.04
            elif airline["code"] == "QP":
                airline_skew = 0.95
            elif airline["code"] == "SG":
                airline_skew = 0.93

            # Time of day premium for morning/evening corporate peak
            hour = int(dep_time.split(":")[0])
            peak_multiplier = 1.08 if (7 <= hour <= 9 or 17 <= hour <= 19) else 0.96
            stop_discount = 0.82 if stops > 0 else 1.0

            fare_fluctuation = rng.uniform(0.96, 1.05)
            calculated_total = round(base_anchor * elasticity * airline_skew * peak_multiplier * stop_discount * fare_fluctuation, -1)
            
            # Decompose into base fare (~82%) and mandatory taxes/UDF (~18%)
            base_part = round(calculated_total * 0.82, 2)
            tax_part = round(calculated_total - base_part, 2)

            flight_no = f"{airline['prefix']}{100 + (i * 37) % 899}"

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
                    total_fare=calculated_total,
                    collection_timestamp=now_iso,
                )
            )

        return results
