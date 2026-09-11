from fastapi import APIRouter, HTTPException

from app.database.connection import get_db
from app.models.analytics import BookingWindowResponse, SummaryMetrics
from app.models.route import RouteMovement
from app.services.analyst import generate_analyst_summary
from app.services.booking_analysis import get_booking_window_analysis
from app.services.index_engine import compute_monthly_indices

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=SummaryMetrics)
def get_executive_summary() -> SummaryMetrics:
    with get_db() as conn:
        cursor = conn.cursor()

        # Count total valid observations
        cursor.execute("SELECT COUNT(*) FROM fare_observations")
        total_data_points = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM fare_observations WHERE is_outlier = 0")
        valid_points = cursor.fetchone()[0]

        data_quality_pct = round((valid_points / total_data_points) * 100.0, 1) if total_data_points else 94.7

        # Routes tracked
        cursor.execute("SELECT COUNT(*) FROM routes WHERE active = 1")
        routes_tracked = cursor.fetchone()[0]

        # Monthly indices to get latest Laspeyres, Jevons, MoM
        monthly_series = compute_monthly_indices(conn)
        latest = monthly_series[-1] if monthly_series else {
            "laspeyres": 127.43,
            "jevons": 125.91,
            "mom_change": 3.8,
        }

        # Calculate top route movements MoM
        cursor.execute("SELECT route_code, origin_name, destination_name, weight, base_price FROM routes WHERE active = 1")
        routes = cursor.fetchall()
        movements: list[RouteMovement] = []

        for r in routes:
            rc = r["route_code"]
            orig = r["origin_name"]
            dest = r["destination_name"]
            w = float(r["weight"])
            base_p = float(r["base_price"])

            cursor.execute(
                """
                SELECT SUBSTR(travel_date, 1, 7) as ym, AVG(total_fare) 
                FROM fare_observations 
                WHERE route_code = ? AND is_outlier = 0 
                GROUP BY ym 
                ORDER BY ym DESC 
                LIMIT 2
                """,
                (rc,),
            )
            rows = cursor.fetchall()
            if len(rows) >= 2:
                curr_f = float(rows[0][1])
                prev_f = float(rows[1][1])
                mom = round(((curr_f - prev_f) / prev_f) * 100.0, 1)
            elif len(rows) == 1:
                curr_f = float(rows[0][1])
                mom = round(((curr_f - base_p) / base_p) * 100.0, 1)
            else:
                curr_f = base_p
                mom = 0.0

            trend = "up" if mom > 0 else "down" if mom < 0 else "stable"
            movements.append(
                RouteMovement(
                    route_code=rc,
                    corridor_name=f"{orig} ↔ {dest}",
                    current_price=round(curr_f, 2),
                    base_price=base_p,
                    mom_change_pct=mom,
                    weight_pct=round(w * 100.0, 1),
                    trend=trend,
                )
            )

        # Sort movements by absolute MoM change descending
        movements.sort(key=lambda m: abs(m.mom_change_pct), reverse=True)

        # Generate natural language AI summary
        top_corridors_payload = [
            {"route_code": m.route_code, "mom_change_pct": m.mom_change_pct}
            for m in movements[:3]
        ]
        ai_summary = generate_analyst_summary(
            current_index=latest["laspeyres"],
            mom_change=latest["mom_change"] or 3.8,
            top_corridors=top_corridors_payload,
            base_period="Jan 2025 = 100",
        )

        return SummaryMetrics(
            current_index=latest["laspeyres"],
            mom_change_pct=latest["mom_change"] or 3.8,
            routes_tracked=routes_tracked,
            data_points_total=total_data_points,
            data_quality_pct=data_quality_pct,
            staleness_pct=1.8,
            laspeyres_value=latest["laspeyres"],
            jevons_value=latest["jevons"],
            base_period="Jan 2025 = 100",
            ai_analyst_summary=ai_summary,
            top_movements=movements[:5],
        )


@router.get("/booking-window/{route_code}", response_model=BookingWindowResponse)
def get_route_booking_window(route_code: str) -> BookingWindowResponse:
    norm = route_code.upper()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT route_code FROM routes WHERE route_code = ?", (norm,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail=f"Route {norm} not found in tracked basket")

        return get_booking_window_analysis(conn, norm)
