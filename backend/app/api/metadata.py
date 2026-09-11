from datetime import datetime
from fastapi import APIRouter

from app.database.connection import get_db
from app.models.metadata import BasketRouteMeta, MetadataResponse

router = APIRouter(prefix="/metadata", tags=["metadata"])


@router.get("", response_model=MetadataResponse)
def get_metadata() -> MetadataResponse:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT route_code, origin_name, destination_name, weight, base_price FROM routes WHERE active = 1 ORDER BY weight DESC")
        rows = cursor.fetchall()

        basket_routes = [
            BasketRouteMeta(
                route_code=r["route_code"],
                corridor_name=f"{r['origin_name']} ↔ {r['destination_name']}",
                weight=float(r["weight"]),
                weight_pct=round(float(r["weight"]) * 100.0, 1),
                base_price=float(r["base_price"]),
            )
            for r in rows
        ]

        formulas = {
            "laspeyres": "L_t = (sum_i w_i * P_{i,t}) / (sum_i w_i * P_{i,0}) * 100",
            "jevons": "J_t = prod_i (P_{i,t} / P_{i,0})^{w_i} * 100",
            "coverage": "Coverage_t = (Count of routes with >= 4 observations) / Total basket routes (10) * 100%",
            "fair_fare_score": "Score = 100 - PercentileRank(Fare in Route-Advance Window Distribution)",
            "mae": "MAE = (1/M) * sum_m |Index_our,m - Index_dgca,m|",
            "rmse": "RMSE = sqrt((1/M) * sum_m (Index_our,m - Index_dgca,m)^2)",
            "correlation": "Pearson r = Cov(Index_our, Index_dgca) / (Std(Index_our) * Std(Index_dgca))",
        }

        data_sources = [
            "Airline Direct Adapters (IndiGo 6E, Air India AI, Akasa Air QP, SpiceJet SG)",
            "OTA Aggregator Feed (MakeMyTrip, EaseMyTrip public aggregators)",
            "Public Schedule Baseline",
        ]

        buckets = [
            "0-6d (Last Minute Premium)",
            "7-14d (Close In)",
            "15-29d (Standard)",
            "30-44d (Optimal Sweet Spot)",
            "45-59d (Early Planning)",
            "60+d (Long Horizon Baseline)",
        ]

        return MetadataResponse(
            title="SIH26056 Airfare Price Index for India",
            version="1.0.0-MVP",
            base_period="January 2025 = 100.00",
            basket_routes=basket_routes,
            formulas=formulas,
            data_sources=data_sources,
            outlier_methodology="Route-specific domain sanity bounds + dynamic Interquartile Range (IQR) filter [Q1 - 1.5*IQR, Q3 + 1.5*IQR]",
            lead_time_buckets=buckets,
            last_updated=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        )
