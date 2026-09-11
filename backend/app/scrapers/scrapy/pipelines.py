from datetime import datetime
from app.database.connection import get_db
from app.scrapers.base import RawQuote
from app.scrapers.scrapy.items import ScrapedFlightItem
from app.services.cleaning import clean_raw_quote
from app.services.deduplication import compute_quote_hash, is_duplicate_quote
from app.services.outlier import is_fare_outlier
from app.services.validation import validate_quote


class AirfareETLPipeline:
    def process_item(self, item: ScrapedFlightItem) -> dict:
        raw = RawQuote(
            source=item.source,
            origin=item.origin,
            destination=item.destination,
            travel_date=item.travel_date,
            airline_code=item.airline_code,
            airline_name=item.airline_name,
            flight_number=item.flight_number,
            departure_time=item.departure_time,
            arrival_time=item.arrival_time,
            duration_minutes=item.duration_minutes,
            stops=item.stops,
            cabin_class=item.cabin_class,
            base_fare=item.base_fare,
            taxes=item.taxes,
            total_fare=item.total_fare,
            collection_timestamp=datetime.now().isoformat(),
        )

        cleaned = clean_raw_quote(raw)
        val = validate_quote(cleaned)
        if not val.is_valid:
            return {"status": "REJECTED", "reason": val.error_message}

        route_code = f"{cleaned.origin}-{cleaned.destination}"
        today_str = datetime.now().strftime("%Y-%m-%d")

        with get_db() as conn:
            q_hash = compute_quote_hash(cleaned, today_str)
            if is_duplicate_quote(conn, q_hash):
                return {"status": "DUPLICATE_SKIPPED", "hash": q_hash}

            is_out, _ = is_fare_outlier(conn, route_code, cleaned.total_fare)

            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR IGNORE INTO fare_observations (
                    quote_hash, timestamp, source, origin, destination, route_code,
                    airline_code, airline_name, flight_number, travel_date,
                    departure_time, arrival_time, duration_minutes, stops, cabin_class,
                    base_fare, taxes, total_fare, advance_days, is_outlier
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    q_hash,
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    cleaned.source,
                    cleaned.origin,
                    cleaned.destination,
                    route_code,
                    cleaned.airline_code,
                    cleaned.airline_name,
                    cleaned.flight_number,
                    cleaned.travel_date,
                    cleaned.departure_time,
                    cleaned.arrival_time,
                    cleaned.duration_minutes,
                    cleaned.stops,
                    cleaned.cabin_class,
                    cleaned.base_fare,
                    cleaned.taxes,
                    cleaned.total_fare,
                    max(0, (datetime.strptime(cleaned.travel_date, "%Y-%m-%d").date() - datetime.now().date()).days),
                    1 if is_out else 0,
                ),
            )

        return {"status": "INGESTED", "hash": q_hash, "is_outlier": is_out}
