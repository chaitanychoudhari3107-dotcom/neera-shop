# NEERA Shop — consolidated weather + sales analytics patch

**Use this PATCH on top of your existing local repo. It is not a standalone app.**
Your uploaded source ZIP was used as the baseline. We preserved the original financial formulas, login, monthly summary and existing charts. The `backend/models/` folder was absent in the shared ZIP, so **keep your existing local `backend/models/` directory**.

## What's included

- One weather API call per day retrieves full-day temperature, humidity, apparent temperature, precipitation, sunshine and the shop-hours equivalents (9:00–18:00 IST). Writes to new weather columns on create/edit, without overwriting sales figures when weather is unavailable.
- Safe historical backfill (dry run by default) for the 9 additional weather columns; optionally refresh archive-eligible preliminary readings.
- Expanded Daily Entry and History weather cards. History retains weekdays, financial details and Edit Entry.
- **Analytics tab**, with selectable date range and:
  - total/average sales, weather completeness, and weekend-vs-weekday difference;
  - daily net-sales timeline and 7-record moving average;
  - Mon–Sun average sales chart and sample counts;
  - month-by-month net sales chart, switch between daily average and recorded monthly total;
  - interactive weather-versus-sales scatterplot (11 factors) with Pearson r;
  - weather correlation comparison table;
  - rainy vs dry day chart;
  - sales by three shop-hours temperature ranges.
- Pure JavaScript statistics functions with offline unit tests, and offline Python weather tests.
- Optional Windows Scheduled Task installer for daily preliminary-weather refresh; **not activated automatically**.

## Existing database columns

You already ran the SQL migrations that added these fields:

`humidity_mean_pct`, `apparent_temperature_mean_c`, `precipitation_sum_mm`, `sunshine_duration_hours`, `shop_temp_mean_c`, `shop_temp_max_c`, `shop_humidity_mean_pct`, `shop_apparent_temp_mean_c`, `shop_precipitation_mm`.

The six existing temperature fields must also still exist. No migration is necessary if your earlier SQL succeeded. If any columns are missing, backfill will fail; do not modify financial columns.

## Install (Windows PowerShell)

1. Make sure you are still on `feature/pune-temperature` (or another feature branch), not `main`. Save a backup / commit before replacing existing files. The ZIP contains **no `.env` files**, API keys, credentials or `backend/models/`.
2. Download `NEERA_COMPLETE_UPDATE.zip`, place it inside your existing `neera-shop` project root, and run:

```powershell
cd "C:\Users\Chaitany\OneDrive\Pictures\Documents\neera shop 1\neera-shop"
git status -sb
Expand-Archive -LiteralPath ".\NEERA_COMPLETE_UPDATE.zip" -DestinationPath "." -Force
```

3. Keep your local `backend/.env`, `frontend/.env.local`, `frontend/.env.production`, `backend/models/`, `node_modules`, and other files. Remove the ZIP from the project root afterward to avoid accidentally committing it.

## Backend checks and backfill

From your existing working Python environment (venv/conda), run:

```powershell
cd backend
python -m unittest test_neera_weather.py -v
python -m compileall -q .
python -c "from weather_service import get_pune_weather; print(get_pune_weather('2026-10-10'))"
python backfill_temperatures.py
```

Review the dry-run output. Only then populate the missing weather fields:

```powershell
python backfill_temperatures.py --apply
```

This sends **weather columns ONLY** to Supabase. It does **not** recalculate or replace any sales, expenses, float or denomination fields. It reuses your existing Supabase backend credentials (from `.env`). Check it finishes with `Failed: 0`; if not, inspect error messages and rerun the command (already-filled values will be kept).

To refresh older `preliminary` readings when an archival observation is available, run:

```powershell
python backfill_temperatures.py --apply --refresh-preliminary
```

For optional **daily automatic** refresh when your PC is available, see `scripts/install_weather_refresh_task.ps1`. Run from your active Python environment:

```powershell
# Optional! Registers daily 7 PM local Windows task.
cd ..
.\scripts\install_weather_refresh_task.ps1
```

The task runs using the Python executable active when you install it, and requires Windows Task Scheduler access. It does not run on a powered-off computer; for 24/7 refresh on deployment, use a suitable hosted scheduler instead. Uninstall command is printed by the script.

## Frontend checks and start

From `frontend/`, run:

```powershell
cd ..\frontend
npm install
node --test src/utils/analytics.test.js
npm run build
npm run dev
```

From a **second terminal**, while in `backend/`, run:

```powershell
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

Log into `http://localhost:5173`, then check Daily Entry, History and Analytics. In Analytics, test the drop-down for weather factors (especially humidity / feels-like / rainfall), inspect weekday and monthly sales charts, and switch time ranges. Check Month Summary and Edit Entry too. Avoid changing a real financial row just to test charts.

## Caveats

- Historic ERA5/reanalysis values can be revised. The DB `temperature_status='finalized'` means archival source, *not* guaranteed immutable measurements.
- For same-day weather, values are preliminary; the optional refresh updates provisional values when they age into archival availability (generally after ~7 days).
- Open-Meteo's free hosted endpoints are **non-commercial use**; for regular shop operations select a commercial license/provider.
- Correlation is not causation. Weather and month effects may overlap; sparse days, holidays/closures, or weddings can influence plots. No ML prediction model is included.
- This is an implementation patch, not a tested production deployment. Offline Python and JS tests were run. Verify the frontend build on your PC if Node dependencies cannot be installed in another environment. Test against your private Supabase data only from your own environment.
