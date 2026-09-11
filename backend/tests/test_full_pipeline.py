import unittest
from datetime import date
from fastapi.testclient import TestClient
from app.database.connection import get_db
from app.database.seed import seed_database
from app.main import app
from app.scrapers.airline_adapter import AirlineDirectAdapter
from app.services.cleaning import clean_raw_quote
from app.services.deduplication import compute_quote_hash, is_duplicate_quote
from app.services.index_engine import compute_daily_index_for_date
from app.services.outlier import is_fare_outlier
from app.services.validation import validate_quote


class TestFullPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed_database()

    def test_full_pipeline(self):
        client = TestClient(app)
        adapter = AirlineDirectAdapter()
        today = date.today()
        today_str = today.strftime("%Y-%m-%d")

        # 1. Ingest a live batch of raw quotes across corridors
        routes = ["DEL-BOM", "BOM-DEL", "DEL-BLR", "BLR-DEL", "BOM-BLR", "BLR-BOM", "DEL-HYD", "HYD-DEL"]
        ingested_count = 0
        duplicates_skipped = 0

        with get_db() as conn:
            cursor = conn.cursor()
            for r in routes:
                orig, dest = r.split("-")
                quotes = adapter.search_flights(orig, dest, today)
                
                # 2. Run cleaning + dedup + outlier
                for raw in quotes:
                    cleaned = clean_raw_quote(raw)
                    val = validate_quote(cleaned)
                    if not val.is_valid:
                        continue

                    q_hash = compute_quote_hash(cleaned, today_str)
                    if is_duplicate_quote(conn, q_hash):
                        duplicates_skipped += 1
                        continue

                    is_out, _ = is_fare_outlier(conn, r, cleaned.total_fare)

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
                            f"{today_str} 12:00:00",
                            cleaned.source,
                            cleaned.origin,
                            cleaned.destination,
                            r,
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
                            0,
                            1 if is_out else 0,
                        ),
                    )
                    ingested_count += 1

        self.assertGreater(ingested_count + duplicates_skipped, 0, "Pipeline should process raw quotes")

        # 3. Compute daily index from the ingested data
        with get_db() as conn:
            daily_calc = compute_daily_index_for_date(conn, today_str)
            self.assertIsNotNone(daily_calc, f"Daily index should be computable for {today_str}")
            self.assertGreaterEqual(daily_calc["coverage_pct"], 70.0, "Coverage must be >= 70%")

        # 4. Call /api/v1/index/national?frequency=daily
        resp = client.get("/api/v1/index/national?frequency=daily")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        # 5. Assert index is within expected range
        self.assertGreaterEqual(data["current_laspeyres"], 100.0)
        self.assertLessEqual(data["current_laspeyres"], 145.0)

        # 6. Assert coverage > 70%
        self.assertGreaterEqual(data["coverage_pct"], 70.0)


if __name__ == "__main__":
    unittest.main()
