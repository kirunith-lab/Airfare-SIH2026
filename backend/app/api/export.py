import csv
import io
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse, Response

from app.database.connection import get_db
from app.services.index_engine import compute_monthly_indices

router = APIRouter(prefix="/export", tags=["export"])


@router.get("")
def export_dataset(
    dataset: str = Query("index", pattern="^(index|routes|fares|backtest)$"),
    format: str = Query("csv", pattern="^(csv|json)$"),
):
    with get_db() as conn:
        cursor = conn.cursor()

        if dataset == "index":
            monthly = compute_monthly_indices(conn)
            if format == "json":
                return JSONResponse(content=monthly)

            # Generate CSV
            output = io.StringIO()
            writer = csv.DictWriter(
                output,
                fieldnames=["year_month", "laspeyres", "jevons", "weighted_price", "mom_change", "yoy_change", "coverage_pct", "routes_counted", "total_routes"],
            )
            writer.writeheader()
            for row in monthly:
                writer.writerow(row)

            csv_data = output.getvalue()
            return Response(
                content=csv_data,
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=airfare_index_series.csv"},
            )

        elif dataset == "routes":
            cursor.execute("SELECT route_code, origin, destination, origin_name, destination_name, weight, base_price FROM routes WHERE active = 1")
            rows = [dict(r) for r in cursor.fetchall()]
            if format == "json":
                return JSONResponse(content=rows)

            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=["route_code", "origin", "destination", "origin_name", "destination_name", "weight", "base_price"])
            writer.writeheader()
            for r in rows:
                writer.writerow(r)

            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=dgca_route_basket.csv"},
            )

        elif dataset == "backtest":
            cursor.execute("SELECT year_month, our_index, dgca_reference, error, abs_error, pct_error, event_annotation FROM backtest_results ORDER BY year_month ASC")
            rows = [dict(r) for r in cursor.fetchall()]
            if format == "json":
                return JSONResponse(content=rows)

            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=["year_month", "our_index", "dgca_reference", "error", "abs_error", "pct_error", "event_annotation"])
            writer.writeheader()
            for r in rows:
                writer.writerow(r)

            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=dgca_backtest_benchmark.csv"},
            )

        elif dataset == "fares":
            cursor.execute("SELECT timestamp, route_code, airline_code, airline_name, flight_number, travel_date, total_fare, advance_days, is_outlier FROM fare_observations ORDER BY id DESC LIMIT 500")
            rows = [dict(r) for r in cursor.fetchall()]
            if format == "json":
                return JSONResponse(content=rows)

            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=["timestamp", "route_code", "airline_code", "airline_name", "flight_number", "travel_date", "total_fare", "advance_days", "is_outlier"])
            writer.writeheader()
            for r in rows:
                writer.writerow(r)

            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=fare_observations_sample.csv"},
            )
