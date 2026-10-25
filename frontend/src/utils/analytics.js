// Pure analysis helpers — no backend write operations and no external dependencies.
const finite = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))
export const hasNumber = finite
export const amount = (value) => finite(value) ? Number(value) : null

// Parse database dates as calendar dates in UTC so browser timezone never shifts the weekday.
export function dayNumber(dateString) {
  if (typeof dateString !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null
  const [y, m, d] = dateString.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toISOString().slice(0, 10) === dateString ? date.getUTCDay() : null
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function mean(values) {
  return values.length ? values.reduce((s, x) => s + x, 0) / values.length : null
}
export function median(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
export function summarize(values) {
  return { count: values.length, mean: mean(values), median: median(values), total: values.reduce((s, n) => s + n, 0) }
}
export function pearson(rows) {
  if (rows.length < 3) return null
  const mx = mean(rows.map(r => r.x))
  const my = mean(rows.map(r => r.y))
  let numerator = 0, xx = 0, yy = 0
  for (const r of rows) {
    const dx = r.x - mx, dy = r.y - my
    numerator += dx * dy
    xx += dx * dx
    yy += dy * dy
  }
  return xx && yy ? numerator / Math.sqrt(xx * yy) : null
}

export const WEATHER_FACTORS = [
  { key: "shop_temp_mean_c", label: "Shop-hours average temperature", unit: "°C" },
  { key: "shop_temp_max_c", label: "Shop-hours maximum temperature", unit: "°C" },
  { key: "shop_apparent_temp_mean_c", label: "Shop-hours feels-like temperature", unit: "°C" },
  { key: "shop_humidity_mean_pct", label: "Shop-hours humidity", unit: "%" },
  { key: "shop_precipitation_mm", label: "Shop-hours precipitation", unit: "mm" },
  { key: "temperature_mean_c", label: "Full-day average temperature", unit: "°C" },
  { key: "temperature_max_c", label: "Full-day maximum temperature", unit: "°C" },
  { key: "humidity_mean_pct", label: "Full-day humidity", unit: "%" },
  { key: "apparent_temperature_mean_c", label: "Full-day feels-like temperature", unit: "°C" },
  { key: "precipitation_sum_mm", label: "Full-day precipitation", unit: "mm" },
  { key: "sunshine_duration_hours", label: "Full-day sunshine", unit: "h" },
]

// Valid zero-sales days are included. Missing sales and invalid dates are excluded.
export function normalizeSales(entries) {
  return (Array.isArray(entries) ? entries : [])
    .filter(e => dayNumber(e.entry_date) !== null && finite(e.net_daily_sales))
    .map(e => ({ ...e, sales: Number(e.net_daily_sales), weekday: dayNumber(e.entry_date) }))
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
}

export function filterPeriod(entries, period) {
  if (period === "all" || !entries.length) return entries
  const days = Number(period)
  if (!Number.isInteger(days) || days <= 0) return entries
  const last = entries[entries.length - 1].entry_date
  const [y, m, d] = last.split("-").map(Number)
  const start = new Date(Date.UTC(y, m - 1, d - days + 1)).toISOString().slice(0, 10)
  return entries.filter(e => e.entry_date >= start)
}

export function salesTrend(entries) {
  return entries.map((e, i) => ({
    date: e.entry_date,
    label: e.entry_date.slice(5),
    sales: e.sales,
    // Last seven recorded entries, not necessarily seven consecutive calendar days.
    rolling: mean(entries.slice(Math.max(0, i - 6), i + 1).map(row => row.sales)),
  }))
}

export function weekdaySales(entries) {
  return [1, 2, 3, 4, 5, 6, 0].map(day => {
    const s = summarize(entries.filter(e => e.weekday === day).map(e => e.sales))
    return { weekday: WEEKDAYS[day], ...s }
  })
}

export function weekendComparison(entries) {
  const weekday = summarize(entries.filter(e => e.weekday !== 0 && e.weekday !== 6).map(e => e.sales))
  const weekend = summarize(entries.filter(e => e.weekday === 0 || e.weekday === 6).map(e => e.sales))
  const difference = weekday.mean !== null && weekday.mean > 0 && weekend.mean !== null
    ? (weekend.mean / weekday.mean - 1) * 100 : null
  return { weekday, weekend, difference }
}

export function monthlySales(entries) {
  const months = new Map()
  for (const e of entries) {
    const key = e.entry_date.slice(0, 7)
    if (!months.has(key)) months.set(key, [])
    months.get(key).push(e.sales)
  }
  return [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, sales]) => {
    const [year, month] = key.split("-").map(Number)
    return { key, month: `${MONTHS[month - 1]} ${year}`, ...summarize(sales) }
  })
}

export function weatherSales(entries, key) {
  return entries.filter(e => finite(e[key])).map(e => ({
    date: e.entry_date, x: Number(e[key]), y: e.sales,
  }))
}

export function weatherCoverage(entries) {
  const total = entries.length
  const complete = entries.filter(e => WEATHER_FACTORS.slice(0, 5).every(f => finite(e[f.key]))).length
  return { total, complete, percent: total ? Math.round(complete / total * 100) : 0 }
}

export function rainyComparison(entries) {
  // Prefer shop-hour rainfall; when unavailable, use the full-day amount.
  const withRainfall = entries.filter(e => finite(e.shop_precipitation_mm) || finite(e.precipitation_sum_mm))
  const rainy = [], dry = []
  for (const e of withRainfall) {
    const mm = finite(e.shop_precipitation_mm) ? Number(e.shop_precipitation_mm) : Number(e.precipitation_sum_mm)
    if (mm > 0) rainy.push(e.sales)
    else dry.push(e.sales)
  }
  return [{ label: "Dry", ...summarize(dry) }, { label: "Rainy", ...summarize(rainy) }]
}

export function temperatureBands(entries) {
  // Equal-frequency groups provide meaningful samples regardless of season.
  const sorted = entries.filter(e => finite(e.shop_temp_mean_c))
    .map(e => ({ x: Number(e.shop_temp_mean_c), sales: e.sales }))
    .sort((a, b) => a.x - b.x)
  if (sorted.length < 6) return []
  const bands = [[], [], []]
  sorted.forEach((row, index) => bands[Math.min(2, Math.floor(index * 3 / sorted.length))].push(row))
  return bands.map((band, index) => ({
    label: ["Cooler third", "Middle third", "Hotter third"][index],
    range: `${band[0].x.toFixed(1)}–${band[band.length - 1].x.toFixed(1)}°C`,
    ...summarize(band.map(row => row.sales)),
  }))
}

export function weatherCorrelations(entries) {
  return WEATHER_FACTORS.map(factor => {
    const rows = weatherSales(entries, factor.key)
    return { ...factor, count: rows.length, r: pearson(rows) }
  })
}
