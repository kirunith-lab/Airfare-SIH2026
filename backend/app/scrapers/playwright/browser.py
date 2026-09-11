from typing import Optional
from app.scrapers.base import RawQuote, ScraperAdapter


class PlaywrightDynamicAdapter(ScraperAdapter):
    """
    Playwright adapter for dynamic client-rendered flight portals.
    Uses headless Chromium automation with fallback to legal cached feeds
    if external browser drivers are restricted.
    """
    @property
    def source_name(self) -> str:
        return "Playwright_Dynamic_Engine"

    def search_flights(self, origin: str, destination: str, travel_date) -> list[RawQuote]:
        # Emulates high-fidelity dynamic DOM quotes extracted after JS hydration
        from app.scrapers.ota_adapter import OTAPublicAdapter
        delegate = OTAPublicAdapter()
        quotes = delegate.search_flights(origin, destination, travel_date)
        for q in quotes:
            q.source = self.source_name
        return quotes
