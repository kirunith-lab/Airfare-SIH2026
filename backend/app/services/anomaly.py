from statistics import mean, pstdev

from app.models.flight import Flight


def find_anomalies(flights: list[Flight]) -> list[Flight]:
    prices = [flight.price for flight in flights]
    if len(prices) < 3:
        return []
    average = mean(prices)
    deviation = pstdev(prices)
    return [flight for flight in flights if deviation and abs(flight.price - average) > deviation * 2]
