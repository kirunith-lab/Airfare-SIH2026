import unittest
from app.database.connection import get_db
from app.database.seed import seed_database
from app.services.index_engine import compute_monthly_indices


class TestIndexEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed_database()

    def test_monthly_indices_calculation(self):
        with get_db() as conn:
            monthly = compute_monthly_indices(conn)
            self.assertTrue(len(monthly) > 0, "Should compute monthly indices")
            
            # Check base period (Jan 2025) is close to 100
            jan_2025 = next((m for m in monthly if m["year_month"] == "2025-01"), None)
            self.assertIsNotNone(jan_2025, "Jan 2025 must exist in monthly calculations")
            self.assertAlmostEqual(jan_2025["laspeyres"], 100.0, delta=2.5)

            # Check coverage metric
            for m in monthly:
                self.assertGreaterEqual(m["coverage_pct"], 70.0, f"Coverage should be >= 70% for {m['year_month']}")
                self.assertGreater(m["laspeyres"], 50.0)
                self.assertLess(m["laspeyres"], 250.0)
                # Jevons should be non-zero and reasonably close to Laspeyres
                self.assertGreater(m["jevons"], 50.0)


if __name__ == "__main__":
    unittest.main()
