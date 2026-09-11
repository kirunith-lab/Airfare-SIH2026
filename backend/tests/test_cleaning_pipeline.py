import unittest
from app.database.connection import get_db
from app.database.seed import seed_database
from app.scrapers.base import RawQuote
from app.services.cleaning import clean_currency_value, clean_raw_quote
from app.services.deduplication import compute_quote_hash, is_duplicate_quote
from app.services.outlier import is_fare_outlier
from app.services.validation import validate_quote


class TestCleaningPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed_database()

    def test_currency_cleaning(self):
        self.assertEqual(clean_currency_value("₹5,420"), 5420.0)
        self.assertEqual(clean_currency_value("INR 12,850.50"), 12850.50)
        self.assertEqual(clean_currency_value(4500), 4500.0)

    def test_quote_validation(self):
        valid_raw = RawQuote(
            source="Test_Src",
            origin="BOM",
            destination="MAA",
            travel_date="2026-09-15",
            airline_code="6E",
            airline_name="IndiGo",
            flight_number="6E-101",
            departure_time="08:30",
            arrival_time="10:25",
            duration_minutes=115,
            stops=0,
            cabin_class="Economy",
            base_fare=4444.8,
            taxes=975.2,
            total_fare=5420.0,
        )
        cleaned = clean_raw_quote(valid_raw)
        res = validate_quote(cleaned)
        self.assertTrue(res.is_valid, f"Validation failed: {res.error_message}")

        # Invalid identical origin/dest
        invalid_raw = RawQuote(
            source="Test_Src",
            origin="BOM",
            destination="BOM",
            travel_date="2026-09-15",
            airline_code="6E",
            airline_name="IndiGo",
            flight_number="6E-101",
            departure_time="08:30",
            arrival_time="10:25",
            duration_minutes=115,
            stops=0,
            cabin_class="Economy",
            base_fare=4444.8,
            taxes=975.2,
            total_fare=5420.0,
        )
        self.assertFalse(validate_quote(invalid_raw).is_valid)

    def test_route_specific_outlier_detection(self):
        with get_db() as conn:
            # Normal fare on DEL-BOM should not be an outlier
            is_out, _ = is_fare_outlier(conn, "DEL-BOM", 5200.0)
            self.assertFalse(is_out)

            # An absurd ₹45,000 quote on DEL-BOM must be flagged as an outlier
            is_out, msg = is_fare_outlier(conn, "DEL-BOM", 45000.0)
            self.assertTrue(is_out, "₹45,000 on DEL-BOM should be flagged as outlier")
            self.assertTrue(len(msg) > 0)


if __name__ == "__main__":
    unittest.main()
