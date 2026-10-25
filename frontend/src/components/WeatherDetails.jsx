const hasValue = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v))
const format = (v, unit) => hasValue(v) ? `${Number(v).toFixed(1)}${unit}` : "—"

const GROUPS = [
  {
    label: "Full day",
    rows: [
      ["Humidity", "humidity_mean_pct", "%"],
      ["Feels like", "apparent_temperature_mean_c", "°C"],
      ["Precipitation", "precipitation_sum_mm", " mm"],
      ["Sunshine", "sunshine_duration_hours", " h"],
    ],
  },
  {
    label: "Shop hours · 9 AM–6 PM",
    rows: [
      ["Mean temperature", "shop_temp_mean_c", "°C"],
      ["Max temperature", "shop_temp_max_c", "°C"],
      ["Humidity", "shop_humidity_mean_pct", "%"],
      ["Feels like", "shop_apparent_temp_mean_c", "°C"],
      ["Precipitation", "shop_precipitation_mm", " mm"],
    ],
  },
]

export default function WeatherDetails({ weather }) {
  if (!weather) return null
  return (
    <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
      {GROUPS.map(group => (
        <div key={group.label} style={{ borderTop: "1px solid #9FE1CB", paddingTop: 10 }}>
          <p style={{ margin: "0 0 9px", fontWeight: 600, fontSize: 12, color: "#085041" }}>
            {group.label}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {group.rows.map(([label, field, unit]) => (
              <div key={field} style={{ borderRadius: 8, background: "#fff", padding: "9px 10px" }}>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#085041" }}>
                  {format(weather[field], unit)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
