from fastapi import APIRouter

from app.database.connection import get_db
from app.models.backtest import BacktestResponse
from app.services.backtesting import get_backtest_results

router = APIRouter(prefix="/backtest", tags=["backtest"])


@router.get("", response_model=BacktestResponse)
def get_backtest() -> BacktestResponse:
    with get_db() as conn:
        return get_backtest_results(conn)
