import math
import sqlite3
from typing import Optional


def compute_daily_index_for_date(conn: sqlite3.Connection, target_date: str) -> Optional[dict]:
    """
    Computes Laspeyres and Jevons indices for a single day across basket routes.
    Includes coverage metric (% of basket routes with >= 4 valid observations).
    """
    cursor = conn.cursor()

    # Get active basket routes, weights and base prices
    cursor.execute("SELECT route_code, weight, base_price FROM routes WHERE active = 1")
    routes = cursor.fetchall()
    if not routes:
        return None

    total_basket_routes = len(routes)
    routes_counted = 0
    numerator_laspeyres = 0.0
    denominator_laspeyres = 0.0
    log_jevons_sum = 0.0
    total_effective_weight = 0.0

    current_prices: dict[str, float] = {}

    for row in routes:
        route_code = row["route_code"]
        weight = float(row["weight"])
        base_price = float(row["base_price"])

        # Fetch average fare for this route on target_date (only non-outliers)
        cursor.execute(
            """
            SELECT AVG(total_fare), COUNT(*) 
            FROM fare_observations 
            WHERE route_code = ? AND DATE(timestamp) = ? AND is_outlier = 0
            """,
            (route_code, target_date),
        )
        fare_row = cursor.fetchone()
        avg_fare = fare_row[0]
        obs_count = fare_row[1]

        if avg_fare is not None and obs_count >= 3:
            routes_counted += 1
            current_prices[route_code] = float(avg_fare)
            numerator_laspeyres += weight * float(avg_fare)
            denominator_laspeyres += weight * base_price
            log_jevons_sum += weight * math.log(float(avg_fare) / base_price)
            total_effective_weight += weight

    if routes_counted == 0 or total_effective_weight == 0 or denominator_laspeyres == 0:
        return None

    coverage_pct = round((routes_counted / total_basket_routes) * 100.0, 1)

    # Re-normalize if some routes didn't meet coverage threshold
    norm_factor = 1.0 / total_effective_weight
    laspeyres = round((numerator_laspeyres / denominator_laspeyres) * 100.0, 2)
    jevons = round(math.exp(log_jevons_sum * norm_factor) * 100.0, 2)
    weighted_avg_fare = round(numerator_laspeyres * norm_factor, 2)

    return {
        "date": target_date,
        "laspeyres": laspeyres,
        "jevons": jevons,
        "weighted_price": weighted_avg_fare,
        "coverage_pct": coverage_pct,
        "routes_counted": routes_counted,
        "total_routes": total_basket_routes,
    }


def compute_monthly_indices(conn: sqlite3.Connection) -> list[dict]:
    """
    Computes monthly aggregated Laspeyres and Jevons series, with MoM and YoY rates of change.
    """
    cursor = conn.cursor()
    cursor.execute("SELECT route_code, weight, base_price FROM routes WHERE active = 1")
    routes = cursor.fetchall()
    if not routes:
        return []

    # Get distinct year_months from fare_observations
    cursor.execute(
        """
        SELECT DISTINCT SUBSTR(travel_date, 1, 7) as ym 
        FROM fare_observations 
        WHERE is_outlier = 0 
        ORDER BY ym ASC
        """
    )
    months = [r[0] for r in cursor.fetchall()]

    monthly_results: list[dict] = []
    total_basket_routes = len(routes)

    prev_laspeyres: Optional[float] = None
    yoy_map: dict[str, float] = {}

    for ym in months:
        num_laspeyres = 0.0
        den_laspeyres = 0.0
        log_jevons = 0.0
        tot_weight = 0.0
        counted = 0

        for r in routes:
            route_code = r["route_code"]
            weight = float(r["weight"])
            base_price = float(r["base_price"])

            cursor.execute(
                """
                SELECT AVG(total_fare), COUNT(*) 
                FROM fare_observations 
                WHERE route_code = ? AND SUBSTR(travel_date, 1, 7) = ? AND is_outlier = 0
                """,
                (route_code, ym),
            )
            res = cursor.fetchone()
            avg_fare = res[0]
            cnt = res[1]

            if avg_fare is not None and cnt >= 5:
                counted += 1
                num_laspeyres += weight * float(avg_fare)
                den_laspeyres += weight * base_price
                log_jevons += weight * math.log(float(avg_fare) / base_price)
                tot_weight += weight

        if counted == 0 or tot_weight == 0 or den_laspeyres == 0:
            continue

        coverage = round((counted / total_basket_routes) * 100.0, 1)
        norm_factor = 1.0 / tot_weight
        laspeyres_val = round((num_laspeyres / den_laspeyres) * 100.0, 2)
        jevons_val = round(math.exp(log_jevons * norm_factor) * 100.0, 2)
        weighted_fare = round(num_laspeyres * norm_factor, 2)

        mom_change = round(((laspeyres_val - prev_laspeyres) / prev_laspeyres) * 100.0, 2) if prev_laspeyres else 0.0
        prev_laspeyres = laspeyres_val

        # YoY calculation
        y, m = ym.split("-")
        prior_year_ym = f"{int(y)-1:04d}-{m}"
        yoy_change = None
        if prior_year_ym in yoy_map:
            yoy_change = round(((laspeyres_val - yoy_map[prior_year_ym]) / yoy_map[prior_year_ym]) * 100.0, 2)
        yoy_map[ym] = laspeyres_val

        monthly_results.append({
            "year_month": ym,
            "laspeyres": laspeyres_val,
            "jevons": jevons_val,
            "weighted_price": weighted_fare,
            "mom_change": mom_change,
            "yoy_change": yoy_change,
            "coverage_pct": coverage,
            "routes_counted": counted,
            "total_routes": total_basket_routes,
        })

    return monthly_results
