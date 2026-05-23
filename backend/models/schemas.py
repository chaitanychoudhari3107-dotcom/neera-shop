from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class PrakashExpenseCreate(BaseModel):
    amount: float
    description: str
    payment_method: str = "UPI"

class PrakashExpenseOut(BaseModel):
    id: str
    entry_date: date
    amount: float
    description: str
    payment_method: str
    created_at: str

class DailyEntryCreate(BaseModel):
    entry_date: date
    morning_float: float
    n_500: int = 0
    n_200: int = 0
    n_100: int = 0
    n_50:  int = 0
    n_20:  int = 0
    n_10:  int = 0
    upi_earnings:     float = 0
    cash_purchases:   float = 0
    prakash_expenses: List[PrakashExpenseCreate] = []

class DailyEntryUpdate(BaseModel):
    morning_float:    Optional[float] = None
    n_500: Optional[int] = None
    n_200: Optional[int] = None
    n_100: Optional[int] = None
    n_50:  Optional[int] = None
    n_20:  Optional[int] = None
    n_10:  Optional[int] = None
    upi_earnings:     Optional[float] = None
    cash_purchases:   Optional[float] = None
    prakash_expenses: Optional[List[PrakashExpenseCreate]] = None

class DailyEntryOut(BaseModel):
    id: str
    entry_date: date
    morning_float: float
    n_500: int
    n_200: int
    n_100: int
    n_50:  int
    n_20:  int
    n_10:  int
    upi_earnings:       float
    cash_purchases:     float
    total_cash_counted: float
    locker_cash:        float
    net_daily_sales:    float
    created_at: str
    updated_at: str
    prakash_expenses: List[PrakashExpenseOut] = []