from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "Airfare Intelligence"
    default_currency: str = "USD"


settings = Settings()
