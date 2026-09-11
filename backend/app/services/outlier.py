import sqlite3
from typing import Optional

# Explicit domain sanity checks per corridor (safety thresholds)
ROUTE_SANITY_BOUNDS: dict[str, tuple[float, float]] = {
    "DEL-BOM": (2500.0, 18000.0),
    "BOM-DEL": (2500.0, 18000.0),
    "DEL-BLR": (2800.0, 20000.0),
    "BLR-DEL": (2800.0, 20000.0),
    "BOM-BLR": (2000.0, 15000.0),
    "BLR-BOM": (2000.0, 15000.0),
    "DEL-HYD": (2200.0, 16000.0),
    "HYD-DEL": (2200.0, 16000.0),
    "BOM-MAA": (2000.0, 15000.0),
    "MAA-BOM": (2000.0, 15000.0),
}


def calculate_iqr_bounds(fares: list[float]) -> tuple[float, float]:
    if len(fares) < 4:
        return (1500.0, 30000.0)
    sorted_fares = sorted(fares)
    n = len(sorted_fares)
    q1 = sorted_fares[int(n * 0.25)]
    q3 = sorted_fares[int(n * 0.75)]
    iqr = q3 - q1
    lower_bound = max(1200.0, q1 - 1.5 * iqr)
    upper_bound = q3 + 1.5 * iqr
    return (round(lower_bound, 2), round(upper_bound, 2))


def get_route_historical_iqr(conn: sqlite3.Connection, route_code: str) -> tuple[float, float]:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT total_fare FROM fare_observations WHERE route_code = ? AND is_outlier = 0 LIMIT 500",
        (route_code,),
    )
    rows = cursor.fetchall()
    if not rows or len(rows) < 8:
        # Fallback to route sanity bounds
        return ROUTE_SANITY_BOUNDS.get(route_code, (1800.0, 25000.0))

    fares = [float(r[0]) for r in rows]
    return calculate_iqr_bounds(fares)


def is_fare_outlier(conn: sqlite3.Connection, route_code: str, total_fare: float) -> tuple[bool, str]:
    # 1. Check fixed route bounds
    if route_code in ROUTE_SANITY_BOUNDS:
        min_bound, max_bound = ROUTE_SANITY_BOUNDS[route_code]
        if total_fare < min_bound or total_fare > max_bound:
            return True, f"Fare ₹{total_fare} violates route domain sanity range [₹{min_bound:,.0f} - ₹{max_bound:,.0f}]"

    # 2. Check dynamic IQR bounds
    lower_iqr, upper_iqr = get_route_historical_iqr(conn, route_code)
    if total_fare < lower_iqr or total_fare > upper_iqr:
        return True, f"Fare ₹{total_fare} flagged as statistical outlier outside IQR [₹{lower_iqr:,.0f} - ₹{upper_iqr:,.0f}]"

    return False, ""
