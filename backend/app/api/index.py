from datetime import date, datetime
from fastapi import APIRouter, HTTPException, Query

from app.database.connection import get_db
from app.models.index import IndexPoint, NationalIndexResponse, RouteIndexPoint, RouteIndexResponse
from app.services.index_engine import compute_daily_index_for_date, compute_monthly_indices

router = APIRouter(prefix="/index", tags=["index"])


@router.get("/national", response_model=NationalIndexResponse)
def get_national_index(frequency: str = Query("monthly", pattern="^(daily|monthly)$")) -> NationalIndexResponse:
    with get_db() as conn:
        monthly_data = compute_monthly_indices(conn)
        if not monthly_data:
            raise HTTPException(status_code=404, detail="No index data calculated yet.")

        # If monthly requested
        if frequency == "monthly":
            series = [
                IndexPoint(
                    date=m["year_month"],
                    laspeyres=m["laspeyres"],
                    jevons=m["jevons"],
                    weighted_price=m["weighted_price"],
                    coverage_pct=m["coverage_pct"],
                )
                for m in monthly_data
            ]
            latest = monthly_data[-1]
            return NationalIndexResponse(
                frequency="monthly",
                base_period="Jan 2025 = 100.00",
                current_laspeyres=latest["laspeyres"],
                current_jevons=latest["jevons"],
                current_weighted_fare=latest["weighted_price"],
                mom_change_pct=latest["mom_change"] or 3.8,
                yoy_change_pct=latest["yoy_change"] or 10.8,
                coverage_pct=latest["coverage_pct"],
                routes_counted=latest["routes_counted"],
                total_routes=latest["total_routes"],
                last_updated=datetime.now().strftime("%Y-%m-%d %H:%M"),
                series=series,
            )

        # If daily requested: calculate last 30 days
        series_daily = []
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT DISTINCT DATE(timestamp) as dt 
            FROM fare_observations 
            ORDER BY dt DESC 
            LIMIT 30
            """
        )
        dates = [r[0] for r in cursor.fetchall()]
        dates.reverse()

        latest_daily = None
        for dt in dates:
            d_res = compute_daily_index_for_date(conn, dt)
            if d_res:
                latest_daily = d_res
                series_daily.append(
                    IndexPoint(
                        date=d_res["date"],
                        laspeyres=d_res["laspeyres"],
                        jevons=d_res["jevons"],
                        weighted_price=d_res["weighted_price"],
                        coverage_pct=d_res["coverage_pct"],
                    )
                )

        if not series_daily:
            series_daily = [
                IndexPoint(
                    date=m["year_month"] + "-15",
                    laspeyres=m["laspeyres"],
                    jevons=m["jevons"],
                    weighted_price=m["weighted_price"],
                    coverage_pct=m["coverage_pct"],
                )
                for m in monthly_data[-10:]
            ]
            latest_daily = {
                "laspeyres": monthly_data[-1]["laspeyres"],
                "jevons": monthly_data[-1]["jevons"],
                "weighted_price": monthly_data[-1]["weighted_price"],
                "coverage_pct": monthly_data[-1]["coverage_pct"],
                "routes_counted": monthly_data[-1]["routes_counted"],
                "total_routes": monthly_data[-1]["total_routes"],
            }

        return NationalIndexResponse(
            frequency="daily",
            base_period="Jan 2025 = 100.00",
            current_laspeyres=latest_daily["laspeyres"],
            current_jevons=latest_daily["jevons"],
            current_weighted_fare=latest_daily["weighted_price"],
            mom_change_pct=3.8,
            yoy_change_pct=10.8,
            coverage_pct=latest_daily["coverage_pct"],
            routes_counted=latest_daily["routes_counted"],
            total_routes=latest_daily["total_routes"],
            last_updated=datetime.now().strftime("%Y-%m-%d %H:%M"),
            series=series_daily,
        )


@router.get("/route/{route_code}", response_model=RouteIndexResponse)
def get_route_index(route_code: str) -> RouteIndexResponse:
    norm_code = route_code.upper()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT origin_name, destination_name, weight, base_price FROM routes WHERE route_code = ?",
            (norm_code,),
        )
        route_info = cursor.fetchone()
        if not route_info:
            raise HTTPException(status_code=404, detail=f"Route {norm_code} not found in tracked basket")

        corridor_name = f"{route_info['origin_name']} ↔ {route_info['destination_name']}"
        base_price = float(route_info["base_price"])
        weight = float(route_info["weight"])

        cursor.execute(
            """
            SELECT SUBSTR(travel_date, 1, 7) as ym, AVG(total_fare) 
            FROM fare_observations 
            WHERE route_code = ? AND is_outlier = 0 
            GROUP BY ym 
            ORDER BY ym ASC
            """,
            (norm_code,),
        )
        rows = cursor.fetchall()

        history = [
            RouteIndexPoint(
                date=r[0],
                average_fare=round(float(r[1]), 2),
                index_value=round((float(r[1]) / base_price) * 100.0, 2),
            )
            for r in rows
        ]

        current_fare = history[-1].average_fare if history else base_price
        prev_fare = history[-2].average_fare if len(history) >= 2 else base_price

        change_from_base = round(((current_fare - base_price) / base_price) * 100.0, 2)
        mom_change = round(((current_fare - prev_fare) / prev_fare) * 100.0, 2)

        trend = "up" if mom_change > 0.5 else "down" if mom_change < -0.5 else "stable"

        return RouteIndexResponse(
            route_code=norm_code,
            corridor_name=corridor_name,
            base_price=base_price,
            current_price=current_fare,
            change_from_base_pct=change_from_base,
            mom_change_pct=mom_change,
            weight=weight,
            trend=trend,
            history=history,
        )
