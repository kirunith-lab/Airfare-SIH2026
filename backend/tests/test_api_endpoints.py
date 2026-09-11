import unittest
from fastapi.testclient import TestClient
from app.database.seed import seed_database
from app.main import app


class TestApiEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed_database()
        cls.client = TestClient(app)

    def test_health_and_root(self):
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        if "application/json" in resp.headers.get("content-type", ""):
            self.assertIn("project", resp.json())
        else:
            self.assertIn("html", resp.text.lower())

        health_resp = self.client.get("/api/health")
        self.assertEqual(health_resp.status_code, 200)
        self.assertEqual(health_resp.json(), {"status": "ok"})

    def test_national_index(self):
        resp = self.client.get("/api/v1/index/national?frequency=monthly")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("current_laspeyres", data)
        self.assertIn("current_jevons", data)
        self.assertIn("coverage_pct", data)
        self.assertTrue(len(data["series"]) > 0)

    def test_route_index(self):
        resp = self.client.get("/api/v1/index/route/DEL-BOM")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["route_code"], "DEL-BOM")
        self.assertTrue(len(data["history"]) > 0)

    def test_analytics_summary(self):
        resp = self.client.get("/api/v1/analytics/summary")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreater(data["routes_tracked"], 0)
        self.assertIn("ai_analyst_summary", data)
        self.assertTrue(len(data["top_movements"]) > 0)

    def test_booking_window(self):
        resp = self.client.get("/api/v1/analytics/booking-window/BOM-MAA")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["route_code"], "BOM-MAA")
        self.assertEqual(len(data["buckets"]), 6)
        self.assertIn("optimal_window", data)

    def test_backtest_endpoint(self):
        resp = self.client.get("/api/v1/backtest")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("metrics", data)
        self.assertGreater(data["metrics"]["correlation"], 0.8)
        self.assertTrue(len(data["series"]) > 0)

    def test_data_quality_endpoint(self):
        resp = self.client.get("/api/v1/quality")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("records_collected", data)
        self.assertIn("completeness_pct", data)
        self.assertIn("staleness_pct", data)

    def test_metadata_endpoint(self):
        resp = self.client.get("/api/v1/metadata")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("basket_routes", data)
        self.assertIn("formulas", data)
        self.assertEqual(len(data["basket_routes"]), 10)

    def test_flight_search_with_fair_fare(self):
        payload = {
            "origin": "BOM",
            "destination": "MAA",
            "travel_date": "2026-09-15",
            "cabin_class": "Economy",
        }
        resp = self.client.post("/api/v1/flights/search", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["origin"], "BOM")
        self.assertEqual(data["destination"], "MAA")
        self.assertTrue(len(data["flights"]) > 0)
        
        # Validate Fair Fare Score presence on flights
        first_flight = data["flights"][0]
        self.assertIsNotNone(first_flight["fair_fare"])
        self.assertIn(first_flight["fair_fare"]["rating"], ["GOOD", "FAIR", "HIGH"])
        self.assertGreaterEqual(first_flight["fair_fare"]["score"], 0)
        self.assertLessEqual(first_flight["fair_fare"]["score"], 100)


    def test_routes_endpoint(self):
        resp = self.client.get("/api/v1/routes")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 10)
        self.assertEqual(data[0]["route_code"], "DEL-BOM")


if __name__ == "__main__":
    unittest.main()
