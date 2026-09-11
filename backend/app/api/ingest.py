from datetime import date, datetime, timedelta
from fastapi import APIRouter

from app.database.connection import get_db
from app.scrapers.airline_adapter import AirlineDirectAdapter
from app.scrapers.ota_adapter import OTAPublicAdapter
from app.services.cleaning import clean_raw_quote
from app.services.deduplication import compute_quote_hash, is_duplicate_quote
from app.services.outlier import is_fare_outlier
from app.services.validation import validate_quote

router = APIRouter(prefix="/ingest", tags=["ingestion"])

airline_adapter = AirlineDirectAdapter()
ota_adapter = OTAPublicAdapter()


@router.post("/trigger")
def trigger_ingestion() -> dict:
    """
    On-demand ingestion run: fetches quotes across basket routes for 3 lead-time dates,
    cleans, validates, deduplicates, and stores in fare_observations.
    """
    today = date.today()
    sample_dates = [today + timedelta(days=d) for d in [3, 14, 35]]

    collected = 0
    valid = 0
    duplicates = 0
    outliers = 0
    rejected = 0

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT route_code, origin, destination FROM routes WHERE active = 1")
        routes = cursor.fetchall()

        for r in routes:
            orig = r["origin"]
            dest = r["destination"]
            route_code = r["route_code"]

            for t_date in sample_dates:
                advance_days = (t_date - today).days

                raw_quotes = []
                raw_quotes.extend(airline_adapter.search_flights(orig, dest, t_date))
                raw_quotes.extend(ota_adapter.search_flights(orig, dest, t_date))

                for raw in raw_quotes:
                    collected += 1
                    cleaned = clean_raw_quote(raw)
                    val_res = validate_quote(cleaned)
                    if not val_res.is_valid:
                        rejected += 1
                        continue

                    q_hash = compute_quote_hash(cleaned, today.strftime("%Y-%m-%d"))
                    if is_duplicate_quote(conn, q_hash):
                        duplicates += 1
                        continue

                    is_out, _ = is_fare_outlier(conn, route_code, cleaned.total_fare)
                    if is_out:
                        outliers += 1

                    valid += 1
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
                            advance_days,
                            1 if is_out else 0,
                        ),
                    )

    return {
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
        "quotes_collected": collected,
        "quotes_valid_ingested": valid,
        "duplicates_skipped": duplicates,
        "outliers_flagged": outliers,
        "schema_rejected": rejected,
    }
