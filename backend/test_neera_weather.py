"""Offline tests. Run: python -m unittest test_neera_weather.py"""
import unittest
from unittest.mock import patch
from weather_service import get_pune_weather

DATE = "2020-04-10"


class FakeResponse:
    def __init__(self, body):
        self.body = body
    def raise_for_status(self):
        pass
    def json(self):
        return self.body


def sample_payload(missing_hour=None):
    hours = [f"{DATE}T{hour:02d}:00" for hour in range(24)]
    temperature = [20 + hour / 2 for hour in range(24)]
    if missing_hour is not None:
        temperature[missing_hour] = None
    return {
        "daily": {
            "time": [DATE], "temperature_2m_mean": [25],
            "temperature_2m_max": [33], "temperature_2m_min": [19],
            "precipitation_sum": [12.5], "sunshine_duration": [18000],
        },
        "hourly": {
            "time": hours,
            "temperature_2m": temperature,
            "relative_humidity_2m": [50] * 24,
            "apparent_temperature": [30] * 24,
            # preceding hour sums: index 10..18 (nine hours) total 9mm.
            "precipitation": [1] * 24,
        },
    }


class WeatherTests(unittest.TestCase):
    @patch("weather_service.httpx.get")
    def test_combined_weather_is_one_request(self, fetch):
        fetch.return_value = FakeResponse(sample_payload())
        result = get_pune_weather(DATE)
        self.assertEqual(fetch.call_count, 1)
        self.assertEqual(result["temperature_mean_c"], 25)
        self.assertEqual(result["sunshine_duration_hours"], 5)
        self.assertEqual(result["humidity_mean_pct"], 50)
        self.assertEqual(result["shop_temp_mean_c"], 26.5)
        self.assertEqual(result["shop_temp_max_c"], 28.5)
        self.assertEqual(result["shop_precipitation_mm"], 9)
        self.assertEqual(result["temperature_status"], "finalized")
        self.assertNotIn("net_daily_sales", result)

    @patch("weather_service.httpx.get")
    def test_missing_hour_keeps_full_day(self, fetch):
        fetch.return_value = FakeResponse(sample_payload(missing_hour=9))
        result = get_pune_weather(DATE)
        self.assertIsNone(result["shop_temp_mean_c"])
        self.assertEqual(result["temperature_mean_c"], 25)
        self.assertEqual(result["precipitation_sum_mm"], 12.5)

    @patch("weather_service.httpx.get")
    def test_future_date_rejected_without_request(self, fetch):
        with self.assertRaises(ValueError):
            get_pune_weather("2999-01-01")
        fetch.assert_not_called()


if __name__ == "__main__":
    unittest.main()
