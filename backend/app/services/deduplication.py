import hashlib
import sqlite3
from app.scrapers.base import RawQuote


def compute_quote_hash(quote: RawQuote, collection_date: str) -> str:
    key = f"{quote.origin}-{quote.destination}_{quote.airline_code}_{quote.flight_number}_{quote.travel_date}_{quote.departure_time}_{collection_date}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()[:24]


def is_duplicate_quote(conn: sqlite3.Connection, quote_hash: str) -> bool:
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM fare_observations WHERE quote_hash = ? LIMIT 1", (quote_hash,))
    return cursor.fetchone() is not None
