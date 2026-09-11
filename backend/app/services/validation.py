from datetime import datetime
from app.scrapers.base import RawQuote


class ValidationResult:
    def __init__(self, is_valid: bool, error_message: str = ""):
        self.is_valid = is_valid
        self.error_message = error_message


def validate_quote(quote: RawQuote) -> ValidationResult:
    if not quote.origin or len(quote.origin) != 3:
        return ValidationResult(False, f"Invalid origin IATA code: {quote.origin}")

    if not quote.destination or len(quote.destination) != 3:
        return ValidationResult(False, f"Invalid destination IATA code: {quote.destination}")

    if quote.origin == quote.destination:
        return ValidationResult(False, "Origin and destination cannot be identical")

    try:
        datetime.strptime(quote.travel_date, "%Y-%m-%d")
    except ValueError:
        return ValidationResult(False, f"Invalid travel date format: {quote.travel_date}")

    if quote.total_fare < 1200.0 or quote.total_fare > 50000.0:
        return ValidationResult(False, f"Total fare ₹{quote.total_fare} falls outside domestic boundaries (₹1,200 - ₹50,000)")

    if quote.base_fare <= 0:
        return ValidationResult(False, f"Base fare must be positive: ₹{quote.base_fare}")

    # Allow minimal rounding discrepancy between base + tax and total
    if abs((quote.base_fare + quote.taxes) - quote.total_fare) > 5.0:
        return ValidationResult(False, f"Base fare ({quote.base_fare}) + taxes ({quote.taxes}) != total fare ({quote.total_fare})")

    return ValidationResult(True)
