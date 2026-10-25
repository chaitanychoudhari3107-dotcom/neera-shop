import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from datetime import date
from fastapi import APIRouter, HTTPException
from models.schemas import DailyEntryCreate, DailyEntryUpdate
from models.calculations import run_all_calculations
from database import supabase
from weather_service import get_pune_weather

router = APIRouter(prefix="/entries", tags=["entries"])
def fetch_weather_safely(entry_date):
    # The unified service retrieves daily AND 9 AM–6 PM values in one request.
    try:
        return get_pune_weather(str(entry_date))
    except Exception as error:
        print(f"Weather unavailable for {entry_date}: {type(error).__name__}")
        return {}  # Saving financial information must remain possible.


@router.get("/weather/{entry_date}")
def get_weather_for_date(entry_date: date):
    try:
        weather = get_pune_weather(entry_date.isoformat())
        return weather

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Unable to fetch Pune weather"
        )

@router.post("/")
def create_entry(entry: DailyEntryCreate):
    entry_date_str = str(entry.entry_date)

    existing = supabase.table("daily_entries")\
        .select("id")\
        .eq("entry_date", entry_date_str)\
        .execute()

    if existing.data:
        raise HTTPException(status_code=400, detail="Entry for this date already exists. Use PUT to edit.")

    prakash_total = sum(e.amount for e in entry.prakash_expenses)
    calcs = run_all_calculations(entry.dict(), prakash_total)

    row = {
        "entry_date":         entry_date_str,
        "morning_float":      entry.morning_float,
        "n_500": entry.n_500,
        "n_200": entry.n_200,
        "n_100": entry.n_100,
        "n_50":  entry.n_50,
        "n_20":  entry.n_20,
        "n_10":  entry.n_10,
        "upi_earnings":       entry.upi_earnings,
        "cash_purchases":     entry.cash_purchases,
        "total_cash_counted": calcs["total_cash_counted"],
        "locker_cash":        calcs["locker_cash"],
        "net_daily_sales":    calcs["net_daily_sales"],
    }
    row.update(fetch_weather_safely(entry_date_str))
    result = supabase.table("daily_entries").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to insert entry")

    new_entry = result.data[0]

    if entry.prakash_expenses:
        prakash_rows = [
            {
                "entry_date":     entry_date_str,
                "amount":         e.amount,
                "description":    e.description,
                "payment_method": e.payment_method,
            }
            for e in entry.prakash_expenses
        ]
        supabase.table("prakash_expenses").insert(prakash_rows).execute()

    return {"message": "Entry created", "entry": new_entry}


@router.get("/")
def get_all_entries():
    print("HISTORY STARTED", flush=True)

    # Paginate both tables (Supabase commonly limits responses to 1000 rows).
    entries = []
    page_size = 500
    offset = 0
    while True:
        result = (supabase.table("daily_entries")
                  .select("*")
                  .order("entry_date", desc=True)
                  .range(offset, offset + page_size - 1)
                  .execute())
        batch = result.data or []
        entries.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size

    if not entries:
        return []

    prakash_by_date = {}

    page_size = 500
    offset = 0

    while True:
        prakash_result = supabase.table("prakash_expenses") \
            .select("*") \
            .order("entry_date") \
            .range(offset, offset + page_size - 1) \
            .execute()

        expenses = prakash_result.data or []

        for expense in expenses:
            date = expense["entry_date"]
            prakash_by_date.setdefault(date, []).append(expense)

        if len(expenses) < page_size:
            break

        offset += page_size

    for entry in entries:
        entry["prakash_expenses"] = prakash_by_date.get(
            entry["entry_date"], []
        )
    print("HISTORY FINISHED", len(entries), flush=True)
    return entries


@router.get("/{entry_date}")
def get_entry(entry_date: str):
    result = supabase.table("daily_entries")\
        .select("*")\
        .eq("entry_date", entry_date)\
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry = result.data[0]
    prakash = supabase.table("prakash_expenses")\
        .select("*")\
        .eq("entry_date", entry_date)\
        .execute()
    entry["prakash_expenses"] = prakash.data or []

    return entry


@router.put("/{entry_date}")
def update_entry(entry_date: str, entry: DailyEntryUpdate):
    existing = supabase.table("daily_entries")\
        .select("*")\
        .eq("entry_date", entry_date)\
        .execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Entry not found")

    current = existing.data[0]
    updated = {**current, **{k: v for k, v in entry.dict().items() if v is not None}}

    prakash_total = 0
    if entry.prakash_expenses is not None:
        prakash_total = sum(e.amount for e in entry.prakash_expenses)
    else:
        existing_prakash = supabase.table("prakash_expenses")\
            .select("amount")\
            .eq("entry_date", entry_date)\
            .execute()
        prakash_total = sum(r["amount"] for r in (existing_prakash.data or []))

    calcs = run_all_calculations(updated, prakash_total)

    update_row = {
        "morning_float":      updated["morning_float"],
        "n_500": updated["n_500"],
        "n_200": updated["n_200"],
        "n_100": updated["n_100"],
        "n_50":  updated["n_50"],
        "n_20":  updated["n_20"],
        "n_10":  updated["n_10"],
        "upi_earnings":       updated["upi_earnings"],
        "cash_purchases":     updated["cash_purchases"],
        "total_cash_counted": calcs["total_cash_counted"],
        "locker_cash":        calcs["locker_cash"],
        "net_daily_sales":    calcs["net_daily_sales"],
    }
    # Preserve previously stored weather readings when an API field is unavailable.
    update_row.update({key: value for key, value in fetch_weather_safely(entry_date).items()
                       if value is not None})
    supabase.table("daily_entries")\
        .update(update_row)\
        .eq("entry_date", entry_date)\
        .execute()

    if entry.prakash_expenses is not None:
        supabase.table("prakash_expenses")\
            .delete()\
            .eq("entry_date", entry_date)\
            .execute()
        if entry.prakash_expenses:
            prakash_rows = [
                {
                    "entry_date":     entry_date,
                    "amount":         e.amount,
                    "description":    e.description,
                    "payment_method": e.payment_method,
                }
                for e in entry.prakash_expenses
            ]
            supabase.table("prakash_expenses").insert(prakash_rows).execute()

    return {"message": "Entry updated"}