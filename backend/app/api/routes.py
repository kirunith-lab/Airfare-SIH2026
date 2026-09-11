from fastapi import APIRouter

from app.config.routes import DEFAULT_ROUTES
from app.database.connection import get_db
from app.models.route import Route

router = APIRouter(prefix="/routes", tags=["routes"])


@router.get("", response_model=list[Route])
def list_routes() -> list[Route]:
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, origin, destination, route_code, origin_name, destination_name, weight, base_price, active FROM routes WHERE active = 1 ORDER BY weight DESC")
            rows = cursor.fetchall()
            if rows:
                return [
                    Route(
                        id=r["id"],
                        origin=r["origin"],
                        destination=r["destination"],
                        route_code=r["route_code"],
                        origin_name=r["origin_name"],
                        destination_name=r["destination_name"],
                        weight=float(r["weight"]),
                        base_price=float(r["base_price"]),
                        active=bool(r["active"]),
                    )
                    for r in rows
                ]
    except Exception:
        pass
    return DEFAULT_ROUTES
