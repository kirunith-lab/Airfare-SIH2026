from app.models.flight import Flight


def normalize_flight(flight: Flight) -> Flight:
    return flight.model_copy(update={
        "airline": flight.airline.strip().title(),
        "origin": flight.origin.strip().upper(),
        "destination": flight.destination.strip().upper(),
        "currency": flight.currency.strip().upper(),
    })
