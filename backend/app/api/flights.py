from datetime import date
from fastapi import APIRouter, HTTPException, Query

from app.database.connection import get_db
from app.models.flight import FairFareScore, FlightQuote, FlightSearchRequest, FlightSearchResponse
from app.scrapers.airline_adapter import AirlineDirectAdapter
from app.scrapers.ota_adapter import OTAPublicAdapter
from app.services.booking_analysis import calculate_fair_fare_score, get_booking_window_analysis
from app.services.cleaning import clean_raw_quote
from app.services.deduplication import compute_quote_hash, is_duplicate_quote
from app.services.outlier import is_fare_outlier
from app.services.validation import validate_quote

router = APIRouter(prefix="/flights", tags=["flights"])

airline_adapter = AirlineDirectAdapter()
ota_adapter = OTAPublicAdapter()


@router.get("/fair-fare-eval", response_model=FairFareScore)
def evaluate_fair_fare(
    route_code: str = Query(..., examples=["DEL-BOM"]),
    advance_days: int = Query(..., ge=0, examples=[14]),
    fare: float = Query(..., gt=0, examples=[4500.0]),
) -> FairFareScore:
    with get_db() as conn:
        return calculate_fair_fare_score(conn, route_code.upper(), advance_days, fare)


@router.get("/recent")
def get_recent_quotes(
    route_code: str = Query(None),
    airline: str = Query(None),
    is_outlier: int = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT quote_hash, timestamp, origin, destination, route_code, airline_code, airline_name, flight_number, travel_date, departure_time, arrival_time, duration_minutes, stops, base_fare, taxes, total_fare, advance_days, is_outlier FROM fare_observations WHERE 1=1"
        params = []
        if route_code and route_code != "all":
            query += " AND route_code = ?"
            params.append(route_code.upper())
        if airline and airline != "all":
            query += " AND (airline_code = ? OR airline_name LIKE ?)"
            params.extend([airline.upper(), f"%{airline}%"])
        if is_outlier is not None:
            query += " AND is_outlier = ?"
            params.append(is_outlier)

        # Count total matching
        count_query = query.replace("SELECT quote_hash, timestamp, origin, destination, route_code, airline_code, airline_name, flight_number, travel_date, departure_time, arrival_time, duration_minutes, stops, base_fare, taxes, total_fare, advance_days, is_outlier", "SELECT COUNT(*)")
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()[0]

        query += " ORDER BY id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(query, params)
        rows = [dict(r) for r in cursor.fetchall()]

        return {
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "quotes": rows,
        }


@router.post("/search", response_model=FlightSearchResponse)
def search_flights(payload: FlightSearchRequest) -> FlightSearchResponse:
    origin = payload.origin.upper()
    destination = payload.destination.upper()
    travel_date = payload.travel_date
    route_code = f"{origin}-{destination}"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT route_code FROM routes WHERE route_code = ?", (route_code,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail=f"Route {route_code} is not in tracked basket. Available routes: DEL-BOM, BOM-DEL, DEL-BLR, BLR-DEL, BOM-BLR, BLR-BOM, DEL-HYD, HYD-DEL, BOM-MAA, MAA-BOM",
            )

        today = date.today()
        advance_days = max(0, (travel_date - today).days)

        # 1. Collect live quotes from legal / simulated adapters
        raw_quotes = []
        raw_quotes.extend(airline_adapter.search_flights(origin, destination, travel_date))
        raw_quotes.extend(ota_adapter.search_flights(origin, destination, travel_date))

        cleaned_and_scored: list[FlightQuote] = []

        for raw in raw_quotes:
            cleaned = clean_raw_quote(raw)
            val_res = validate_quote(cleaned)
            if not val_res.is_valid:
                continue

            q_hash = compute_quote_hash(cleaned, today.strftime("%Y-%m-%d"))
            is_dup = is_duplicate_quote(conn, q_hash)

            is_outlier, _ = is_fare_outlier(conn, route_code, cleaned.total_fare)

            # Ingest non-duplicate quotes into DB
            if not is_dup:
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
                        today.strftime("%Y-%m-%d %H:%M:%S"),
                        cleaned.source,
                        cleaned.origin,
                        cleaned.destination,
                        route_code,
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
                        advance_days,
                        1 if is_outlier else 0,
                    ),
                )

            # Calculate Fair Fare score for user
            fair_fare = calculate_fair_fare_score(conn, route_code, advance_days, cleaned.total_fare)

            dur_h = cleaned.duration_minutes // 60
            dur_m = cleaned.duration_minutes % 60
            dur_str = f"{dur_h}h {dur_m:02d}m"

            cleaned_and_scored.append(
                FlightQuote(
                    id=q_hash,
                    airline_code=cleaned.airline_code,
                    airline_name=cleaned.airline_name,
                    flight_number=cleaned.flight_number,
                    origin=cleaned.origin,
                    destination=cleaned.destination,
                    travel_date=cleaned.travel_date,
                    departure_time=cleaned.departure_time,
                    arrival_time=cleaned.arrival_time,
                    duration_minutes=cleaned.duration_minutes,
                    duration_display=dur_str,
                    stops=cleaned.stops,
                    base_fare=cleaned.base_fare,
                    taxes=cleaned.taxes,
                    total_fare=cleaned.total_fare,
                    source=cleaned.source,
                    fair_fare=fair_fare,
                )
            )

        # Sort quotes by fare ascending
        cleaned_and_scored.sort(key=lambda q: q.total_fare)

        booking_window_info = get_booking_window_analysis(conn, route_code)

        return FlightSearchResponse(
            origin=origin,
            destination=destination,
            travel_date=travel_date.strftime("%Y-%m-%d"),
            advance_days=advance_days,
            total_flights=len(cleaned_and_scored),
            historical_median_fare=booking_window_info.buckets[3].median_fare,
            recommended_window=booking_window_info.optimal_window,
            flights=cleaned_and_scored,
        )
