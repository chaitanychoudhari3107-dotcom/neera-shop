"""Safely populate missing weather data or refresh older provisional readings.

Read-only by default. Use --apply to write weather columns ONLY.
"""

import argparse
import time
from datetime import date, datetime, timedelta, timezone

from database import supabase
from weather_service import get_pune_weather

WEATHER_NUMBERS = (
    "temperature_mean_c", "temperature_max_c", "temperature_min_c",
    "humidity_mean_pct", "apparent_temperature_mean_c",
    "precipitation_sum_mm", "sunshine_duration_hours",
    "shop_temp_mean_c", "shop_temp_max_c", "shop_humidity_mean_pct",
    "shop_apparent_temp_mean_c", "shop_precipitation_mm",
)
WEATHER_METADATA = ("temperature_source", "temperature_status", "temperature_synced_at")
TODAY = datetime.now(timezone(timedelta(hours=5, minutes=30))).date()


def get_all_entries():
    records = []
    offset = 0
    page_size = 500
    while True:
        result = (supabase.table("daily_entries")
                  .select("entry_date," + ",".join(WEATHER_NUMBERS + WEATHER_METADATA))
                  .order("entry_date")
                  .range(offset, offset + page_size - 1)
                  .execute())
        batch = result.data or []
        records.extend(batch)
        if len(batch) < page_size:
            return records
        offset += page_size


def needs_update(row, refresh_preliminary):
    if date.fromisoformat(row["entry_date"]) > TODAY:
        return False
    missing = any(row.get(column) is None for column in WEATHER_NUMBERS)
    old_preliminary = (
        refresh_preliminary
        and row.get("temperature_status") == "preliminary"
        and date.fromisoformat(row["entry_date"]) < TODAY - timedelta(days=7)
    )
    return missing or old_preliminary


def build_weather_update(row, weather, refresh_preliminary):
    old_preliminary = (
        refresh_preliminary
        and row.get("temperature_status") == "preliminary"
        and date.fromisoformat(row["entry_date"]) < TODAY - timedelta(days=7)
    )
    if old_preliminary:
        # Replace provisional data with historical data when it is available.
        return {key: value for key, value in weather.items() if value is not None}
    # Ordinary backfill: never overwrite existing values; preserve zero precipitation.
    missing = {key: value for key, value in weather.items()
               if key in WEATHER_NUMBERS and row.get(key) is None and value is not None}
    if missing:
        missing.update({key: weather[key] for key in WEATHER_METADATA if key in weather})
    return missing


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Write weather columns to Supabase")
    parser.add_argument("--refresh-preliminary", action="store_true",
                        help="Also replace preliminary readings older than 7 days")
    parser.add_argument("--limit", type=int, default=0, help="Optional maximum dates (0 = all)")
    args = parser.parse_args()

    rows = get_all_entries()
    pending = [r for r in rows if needs_update(r, args.refresh_preliminary)]
    if args.limit > 0:
        pending = pending[:args.limit]
    print(f"NEERA weather backfill | Rows: {len(rows)} | Dates to check: {len(pending)}")
    print("Mode:", "APPLY (weather columns only)" if args.apply else "PREVIEW (read-only)")
    if not pending:
        print("Nothing to update.")
        return

    succeeded = failed = skipped = 0
    for position, row in enumerate(pending, 1):
        day = row["entry_date"]
        # Preview inspects three dates, avoiding 89 API requests for no reason.
        if not args.apply and position > 3:
            print(f"... {len(pending) - 3} additional dates ready for --apply")
            break
        try:
            weather = get_pune_weather(day)
            changes = build_weather_update(row, weather, args.refresh_preliminary)
            if not changes:
                skipped += 1
                print(f"[{position}/{len(pending)}] {day}: no new weather values available")
                continue
            if args.apply:
                (supabase.table("daily_entries")
                 .update(changes).eq("entry_date", day).execute())
            succeeded += 1
            print(f"[{position}/{len(pending)}] {day}: {len(changes)} weather fields"
                  + (" UPDATED" if args.apply else " (preview only)"))
        except Exception as error:
            failed += 1
            print(f"[{position}/{len(pending)}] {day}: FAILED {type(error).__name__}: {error}")
        time.sleep(0.4)

    print(f"Finished | Ready/updated: {succeeded} | Skipped: {skipped} | Failed: {failed}")
    if not args.apply:
        print("Database unchanged. Run with --apply to populate all dates.")


if __name__ == "__main__":
    main()
