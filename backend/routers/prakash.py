import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from fastapi import APIRouter, HTTPException
from models.schemas import PrakashExpenseCreate
from database import supabase

router = APIRouter(prefix="/prakash", tags=["prakash"])

@router.get("/{entry_date}")
def get_prakash_expenses(entry_date: str):
    result = supabase.table("prakash_expenses")\
        .select("*")\
        .eq("entry_date", entry_date)\
        .execute()
    return result.data or []

@router.post("/{entry_date}")
def add_prakash_expense(entry_date: str, expense: PrakashExpenseCreate):
    existing = supabase.table("daily_entries")\
        .select("id")\
        .eq("entry_date", entry_date)\
        .execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="No daily entry found for this date")

    row = {
        "entry_date":     entry_date,
        "amount":         expense.amount,
        "description":    expense.description,
        "payment_method": expense.payment_method,
    }
    result = supabase.table("prakash_expenses").insert(row).execute()
    return {"message": "Expense added", "expense": result.data[0]}

@router.delete("/{expense_id}")
def delete_prakash_expense(expense_id: str):
    supabase.table("prakash_expenses")\
        .delete()\
        .eq("id", expense_id)\
        .execute()
    return {"message": "Expense deleted"}