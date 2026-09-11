from app.models.index import PricePoint


def forecast(history: list[PricePoint], days: int = 7) -> list[PricePoint]:
    if not history:
        return []
    latest = history[-1]
    return [latest]
