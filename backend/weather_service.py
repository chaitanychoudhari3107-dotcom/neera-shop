"""Pune daily and shop-hours weather from Open-Meteo.

9:00–18:00 Asia/Kolkata shop window:
- temperature/humidity/apparent temp: hourly readings 09:00 through 17:00;
- precipitation: preceding-hour totals timestamped 10:00 through 18:00.

One upstream request supplies all weather columns. No DB writes occur here.
"""

from datetime import date, datetime, timedelta, timezone

import httpx

PUNE_LATITUDE = 18.5204
PUNE_LONGITUDE = 73.8567
IST = timezone(timedelta(hours=5, minutes=30))
FORECAST_API = "https://api.open-meteo.com/v1/forecast"
HISTORICAL_API = "https://archive-api.open-meteo.com/v1/archive"

SHOP_COLUMNS = (
    "shop_temp_mean_c",
    "shop_temp_max_c",
    "shop_humidity_mean_pct",
    "shop_apparent_temp_mean_c",
    "shop_precipitation_mm",
)


def _first(daily, name):
    values = daily.get(name) or []
    return values[0] if values else None


def _round(value):
    return round(float(value), 2) if value is not None else None


def _hourly_values(hourly, variable, entry_date, hours):
    times = hourly.get("time", [])
    indices = {value: index for index, value in enumerate(times)}
    series = hourly.get(variable, [])
    values = []
    for hour in hours:
        index = indices.get(f"{entry_date}T{hour:02d}:00")
        if index is None or index >= len(series) or series[index] is None:
            raise ValueError(f"Missing {variable} at {entry_date} {hour:02d}:00")
        values.append(float(series[index]))
    return values


def _mean(values):
    return sum(values) / len(values)


def _mean_available(hourly, variable, entry_date):
    """Full-day mean from up to 24 available local hourly readings."""
    values = hourly.get(variable, [])
    times = hourly.get("time", [])
    matches = [float(v) for t, v in zip(times, values)
               if t.startswith(entry_date + "T") and v is not None]
    return _round(_mean(matches)) if matches else None


def get_pune_weather(entry_date):
    """Return all weather DB columns, from one daily+hourly HTTP request."""
    entry_date = str(entry_date)
    selected = date.fromisoformat(entry_date)
    today = datetime.now(IST).date()
    if selected > today:
        raise ValueError("Future dates are not supported.")

    recent = selected >= today - timedelta(days=7)
    api_url = FORECAST_API if recent else HISTORICAL_API
    params = {
        "latitude": PUNE_LATITUDE,
        "longitude": PUNE_LONGITUDE,
        "start_date": entry_date,
        "end_date": entry_date,
        "timezone": "Asia/Kolkata",
        "temperature_unit": "celsius",
        "daily": (
            "temperature_2m_mean,temperature_2m_max,temperature_2m_min,"
            "precipitation_sum,sunshine_duration"
        ),
        "hourly": (
            "temperature_2m,relative_humidity_2m,"
            "apparent_temperature,precipitation"
        ),
    }
    if not recent:
        params["models"] = "era5"

    response = httpx.get(api_url, params=params, timeout=20)
    response.raise_for_status()
    data = response.json()
    daily = data.get("daily", {})
    hourly = data.get("hourly", {})

    if _first(daily, "time") != entry_date:
        raise ValueError(f"Weather data unavailable for {entry_date}")

    full_day_temps = [float(t) for ts, t in zip(
        hourly.get("time", []), hourly.get("temperature_2m", []))
        if ts.startswith(entry_date + "T") and t is not None]
    mean = _first(daily, "temperature_2m_mean")
    maximum = _first(daily, "temperature_2m_max")
    minimum = _first(daily, "temperature_2m_min")
    if mean is None and full_day_temps:
        mean = _mean(full_day_temps)
    if maximum is None and full_day_temps:
        maximum = max(full_day_temps)
    if minimum is None and full_day_temps:
        minimum = min(full_day_temps)
    if any(v is None for v in (mean, maximum, minimum)):
        raise ValueError(f"Incomplete daily temperature data for {entry_date}")

    sunshine_secs = _first(daily, "sunshine_duration")
    result = {
        "temperature_mean_c": _round(mean),
        "temperature_max_c": _round(maximum),
        "temperature_min_c": _round(minimum),
        "temperature_source": "Open-Meteo Forecast" if recent else "Open-Meteo ERA5",
        "temperature_status": "preliminary" if recent else "finalized",
        "temperature_synced_at": datetime.now(timezone.utc).isoformat(),
        "humidity_mean_pct": _mean_available(hourly, "relative_humidity_2m", entry_date),
        "apparent_temperature_mean_c": _mean_available(hourly, "apparent_temperature", entry_date),
        "precipitation_sum_mm": _round(_first(daily, "precipitation_sum")),
        "sunshine_duration_hours": _round(sunshine_secs / 3600) if sunshine_secs is not None else None,
    }

    # Daily readings can be available even when a shop-hour series is incomplete.
    try:
        temperatures = _hourly_values(hourly, "temperature_2m", entry_date, range(9, 18))
        humidity = _hourly_values(hourly, "relative_humidity_2m", entry_date, range(9, 18))
        apparent = _hourly_values(hourly, "apparent_temperature", entry_date, range(9, 18))
        rainfall = _hourly_values(hourly, "precipitation", entry_date, range(10, 19))
        result.update({
            "shop_temp_mean_c": _round(_mean(temperatures)),
            "shop_temp_max_c": _round(max(temperatures)),
            "shop_humidity_mean_pct": _round(_mean(humidity)),
            "shop_apparent_temp_mean_c": _round(_mean(apparent)),
            "shop_precipitation_mm": _round(sum(rainfall)),
        })
    except ValueError:
        # Incomplete hour data should never prevent recording a sale.
        result.update({column: None for column in SHOP_COLUMNS})

    return result


def get_pune_shop_weather(entry_date):
    """Backward compatible helper; use get_pune_weather for both datasets."""
    data = get_pune_weather(entry_date)
    return {column: data[column] for column in SHOP_COLUMNS}
