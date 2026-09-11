from app.database.connection import get_db

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    route_code TEXT UNIQUE NOT NULL,
    origin_name TEXT NOT NULL,
    destination_name TEXT NOT NULL,
    weight REAL NOT NULL,
    base_price REAL NOT NULL,
    active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS airlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fare_observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_hash TEXT UNIQUE NOT NULL,
    timestamp TEXT NOT NULL,
    source TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    route_code TEXT NOT NULL,
    airline_code TEXT NOT NULL,
    airline_name TEXT NOT NULL,
    flight_number TEXT,
    travel_date TEXT NOT NULL,
    departure_time TEXT,
    arrival_time TEXT,
    duration_minutes INTEGER,
    stops INTEGER DEFAULT 0,
    cabin_class TEXT DEFAULT 'Economy',
    base_fare REAL NOT NULL,
    taxes REAL NOT NULL,
    total_fare REAL NOT NULL,
    advance_days INTEGER NOT NULL,
    is_outlier INTEGER DEFAULT 0,
    FOREIGN KEY(route_code) REFERENCES routes(route_code)
);

CREATE INDEX IF NOT EXISTS idx_fares_route_date ON fare_observations(route_code, travel_date);
CREATE INDEX IF NOT EXISTS idx_fares_advance ON fare_observations(route_code, advance_days);
CREATE INDEX IF NOT EXISTS idx_fares_timestamp ON fare_observations(timestamp);

CREATE TABLE IF NOT EXISTS route_weights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_code TEXT NOT NULL,
    weight REAL NOT NULL,
    effective_from TEXT NOT NULL,
    FOREIGN KEY(route_code) REFERENCES routes(route_code)
);

CREATE TABLE IF NOT EXISTS index_daily (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    index_type TEXT NOT NULL, -- 'laspeyres' or 'jevons'
    index_value REAL NOT NULL,
    weighted_price REAL NOT NULL,
    coverage_pct REAL NOT NULL,
    routes_counted INTEGER NOT NULL,
    total_routes INTEGER NOT NULL,
    UNIQUE(date, index_type)
);

CREATE TABLE IF NOT EXISTS index_monthly (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year_month TEXT NOT NULL,
    index_type TEXT NOT NULL,
    index_value REAL NOT NULL,
    weighted_price REAL NOT NULL,
    mom_change REAL,
    yoy_change REAL,
    coverage_pct REAL NOT NULL,
    UNIQUE(year_month, index_type)
);

CREATE TABLE IF NOT EXISTS data_quality (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    source TEXT NOT NULL,
    records_collected INTEGER NOT NULL,
    records_valid INTEGER NOT NULL,
    records_rejected INTEGER NOT NULL,
    missing_pct REAL NOT NULL,
    duplicate_pct REAL NOT NULL,
    outlier_pct REAL NOT NULL,
    staleness_pct REAL NOT NULL,
    UNIQUE(date, source)
);

CREATE TABLE IF NOT EXISTS backtest_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year_month TEXT UNIQUE NOT NULL,
    our_index REAL NOT NULL,
    dgca_reference REAL NOT NULL,
    error REAL NOT NULL,
    abs_error REAL NOT NULL,
    pct_error REAL NOT NULL,
    event_annotation TEXT
);
"""


def init_db() -> None:
    with get_db() as conn:
        conn.executescript(SCHEMA_SQL)


if __name__ == "__main__":
    init_db()
    print("Database schema successfully initialized.")
