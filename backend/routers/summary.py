import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from fastapi import APIRouter
from database import supabase

router = APIRouter(prefix="/summary", tags=["summary"])

@router.get("/{year}/{month}")
def get_month_summary(year: int, month: int):
    month_str  = f"{year}-{month:02d}"
    start_date = f"{month_str}-01"

    import calendar
    last_day   = calendar.monthrange(year, month)[1]
    end_date   = f"{month_str}-{last_day}"

    result = supabase.table("daily_entries")\
        .select("*")\
        .gte("entry_date", start_date)\
        .lte("entry_date", end_date)\
        .order("entry_date")\
        .execute()

    entries = result.data or []

    if not entries:
        return {
            "year": year, "month": month,
            "total_net_sales":      0,
            "total_upi":            0,
            "total_locker_cash":    0,
            "total_cash_purchases": 0,
            "total_prakash":        0,
            "total_investments":    0,
            "daily_entries":        [],
        }

    prakash_result = supabase.table("prakash_expenses")\
        .select("*")\
        .gte("entry_date", start_date)\
        .lte("entry_date", end_date)\
        .execute()

    prakash_rows = prakash_result.data or []

    prakash_by_date = {}
    for row in prakash_rows:
        d = row["entry_date"]
        prakash_by_date.setdefault(d, []).append(row)

    for entry in entries:
        entry["prakash_expenses"] = prakash_by_date.get(entry["entry_date"], [])

    total_net_sales      = sum(e["net_daily_sales"]   or 0 for e in entries)
    total_upi            = sum(e["upi_earnings"]      or 0 for e in entries)
    total_locker_cash    = sum(e["locker_cash"]        or 0 for e in entries)
    total_cash_purchases = sum(e["cash_purchases"]    or 0 for e in entries)
    total_prakash        = sum(
        exp["amount"]
        for e in entries
        for exp in e["prakash_expenses"]
    )
    total_investments    = total_cash_purchases + total_prakash

    return {
        "year":  year,
        "month": month,
        "total_net_sales":      round(total_net_sales,      2),
        "total_upi":            round(total_upi,            2),
        "total_locker_cash":    round(total_locker_cash,    2),
        "total_cash_purchases": round(total_cash_purchases, 2),
        "total_prakash":        round(total_prakash,        2),
        "total_investments":    round(total_investments,    2),
        "daily_entries":        entries,
    }