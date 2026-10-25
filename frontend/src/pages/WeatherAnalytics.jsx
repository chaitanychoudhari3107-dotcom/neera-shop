import { useEffect, useMemo, useState } from "react"
import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
} from "recharts"
import { getEntries } from "../api"
import {
  WEATHER_FACTORS, normalizeSales, filterPeriod, salesTrend, weekdaySales,
  weekendComparison, monthlySales, weatherSales, pearson, weatherCoverage,
  rainyComparison, temperatureBands, weatherCorrelations, summarize,
} from "../utils/analytics"

const money = v => v === null || v === undefined ? "—" : `₹${Math.round(Number(v)).toLocaleString("en-IN")}`
const currencyAxis = v => Number(v) >= 1000 ? `₹${(Number(v) / 1000).toFixed(0)}k` : `₹${Math.round(Number(v))}`
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 12px" }
const cardTitle = { fontSize: 14, fontWeight: 650, margin: "0 0 5px", color: "#111827" }
const note = { color: "#6b7280", fontSize: 11, lineHeight: 1.5, margin: "8px 0 0" }
const tick = { fontSize: 11, fill: "#6b7280" }

function Empty({ message = "Not enough matching records for this chart yet." }) {
  return <p style={{ ...note, padding: "25px 4px", textAlign: "center" }}>{message}</p>
}
function Box({ title, description, children }) {
  return <section style={card}>
    <h3 style={cardTitle}>{title}</h3>
    {description && <p style={{ ...note, margin: "0 0 15px" }}>{description}</p>}
    {children}
  </section>
}
function Kpi({ title, value, sub }) {
  return <div style={{ ...card, padding: "13px 12px", minWidth: 0 }}>
    <div style={{ color: "#6b7280", fontSize: 11 }}>{title}</div>
    <div style={{ fontSize: 19, fontWeight: 700, color: "#085041", marginTop: 4, overflowWrap: "anywhere" }}>{value}</div>
    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 5 }}>{sub}</div>
  </div>
}
const salesTooltip = (value, name) => [money(value), name]
function EntriesTooltip({ active, payload, label, extra }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  return <div style={{ ...card, fontSize: 12, padding: 10, boxShadow: "0 3px 12px #0001" }}>
    <strong>{label}</strong>
    <div>Average: {money(row?.mean)}</div>
    <div>Median: {money(row?.median)}</div>
    <div>Recorded days: {row?.count ?? 0}</div>
    {extra && <div>{extra(row)}</div>}
  </div>
}

export default function WeatherAnalytics() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [period, setPeriod] = useState("all")
  const [factorKey, setFactorKey] = useState("shop_temp_mean_c")
  const [view, setView] = useState("average")

  useEffect(() => {
    let active = true
    getEntries().then(data => { if (active) setEntries(Array.isArray(data) ? data : []) })
      .catch(err => { if (active) { console.error(err); setError(err.message || "Could not load analytics data.") } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const allSales = useMemo(() => normalizeSales(entries), [entries])
  const sales = useMemo(() => filterPeriod(allSales, period), [allSales, period])
  const total = useMemo(() => summarize(sales.map(e => e.sales)), [sales])
  const weekday = useMemo(() => weekdaySales(sales), [sales])
  const weekend = useMemo(() => weekendComparison(sales), [sales])
  const trend = useMemo(() => salesTrend(sales), [sales])
  const months = useMemo(() => monthlySales(sales), [sales])
  const factor = WEATHER_FACTORS.find(item => item.key === factorKey) || WEATHER_FACTORS[0]
  const scatter = useMemo(() => weatherSales(sales, factorKey), [sales, factorKey])
  const correlation = useMemo(() => pearson(scatter), [scatter])
  const coverage = useMemo(() => weatherCoverage(sales), [sales])
  const rain = useMemo(() => rainyComparison(sales), [sales])
  const bands = useMemo(() => temperatureBands(sales), [sales])
  const relationships = useMemo(() => weatherCorrelations(sales), [sales])
  const bestWeekday = weekday.filter(d => d.count >= 3).sort((a, b) => b.mean - a.mean)[0]

  if (loading) return <p style={note}>Loading analytics…</p>
  if (error) return <p style={{ color: "#991b1b", fontSize: 13 }}>{error}</p>

  return <div style={{ display: "grid", gap: 14, paddingBottom: 12 }}>
    <div>
      <h2 style={{ fontSize: 18, margin: "0 0 5px" }}>📈 NEERA · Sales Analytics</h2>
      <p style={{ ...note, margin: 0 }}>Real shop records · Weather, weekday and seasonal patterns</p>
    </div>

    <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, fontSize: 12, fontWeight: 600 }}>
      Data period
      <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: "9px 10px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", minWidth: 150 }}>
        <option value="all">All recorded dates</option>
        <option value="30">Last 30 calendar days</option>
        <option value="90">Last 90 calendar days</option>
        <option value="180">Last 180 calendar days</option>
      </select>
    </label>
    {allSales.length > 0 && <p style={{ ...note, margin: "-8px 0 0" }}>
      Relative to latest recorded date: {allSales[allSales.length - 1].entry_date}. Only entered sales dates count.
    </p>}

    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 9 }}>
      <Kpi title="Net sales (selected period)" value={money(total.total)} sub={`${total.count} recorded days`} />
      <Kpi title="Average daily sales" value={money(total.mean)} sub={`Median ${money(total.median)}`} />
      <Kpi title="Weekend vs weekday" value={weekend.difference === null ? "—" : `${weekend.difference > 0 ? "+" : ""}${weekend.difference.toFixed(1)}%`} sub={`${weekend.weekend.count} weekend / ${weekend.weekday.count} weekday records`} />
      <Kpi title="Shop-hour weather coverage" value={`${coverage.percent}%`} sub={`${coverage.complete} of ${coverage.total} sales days`} />
    </div>

    <Box title="Daily sales trend" description="Every recorded day, with a moving average of the last 7 entries (not necessarily 7 consecutive calendar days).">
      {trend.length ? <ResponsiveContainer width="100%" height={260}>
        <LineChart data={trend} margin={{ top: 8, right: 10, bottom: 3, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eff2f5" />
          <XAxis dataKey="label" tick={tick} minTickGap={22} />
          <YAxis tick={tick} tickFormatter={currencyAxis} width={53} />
          <Tooltip formatter={salesTooltip} labelFormatter={(_label, items) => items?.[0]?.payload?.date || _label} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line dataKey="sales" type="linear" stroke="#1D9E75" strokeWidth={1.7} dot={false} name="Daily sales" connectNulls={false} />
          <Line dataKey="rolling" type="monotone" stroke="#185FA5" strokeWidth={2.5} dot={false} name="7-entry moving average" />
        </LineChart>
      </ResponsiveContainer> : <Empty message="No sales entries in this date range." />}
    </Box>

    <Box title="Sales by day of the week" description="Average net sales for Monday through Sunday. Missing dates are not treated as zero-sales days.">
      {sales.length ? <ResponsiveContainer width="100%" height={245}>
        <BarChart data={weekday} margin={{ top: 6, right: 7, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eff2f5" />
          <XAxis dataKey="weekday" tick={tick} />
          <YAxis width={53} tick={tick} tickFormatter={currencyAxis} />
          <Tooltip content={<EntriesTooltip />} />
          <Bar dataKey="mean" name="Average daily sales" fill="#1D9E75" radius={[5, 5, 0, 0]} maxBarSize={45} />
        </BarChart>
      </ResponsiveContainer> : <Empty />}
      <p style={note}>
        Weekdays: {money(weekend.weekday.mean)} ({weekend.weekday.count} days) · Weekends: {money(weekend.weekend.mean)} ({weekend.weekend.count} days).
        {bestWeekday && <> Highest observed average (≥3 dates): <strong>{bestWeekday.weekday}</strong>.</>}
      </p>
    </Box>

    <Box title="Month-by-month sales" description="Explore seasonality and possible wedding-season effects. Months are observations, not wedding labels.">
      {months.length ? <>
        <label style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end", color: "#6b7280", fontSize: 12, marginBottom: 10 }}>
          Metric
          <select value={view} onChange={e => setView(e.target.value)} style={{ padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 7 }}>
            <option value="average">Average per recorded day</option>
            <option value="total">Monthly recorded total</option>
          </select>
        </label>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={months} margin={{ top: 6, right: 7, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eff2f5" />
            <XAxis dataKey="month" tick={tick} minTickGap={15} />
            <YAxis width={53} tick={tick} tickFormatter={currencyAxis} />
            <Tooltip content={<EntriesTooltip extra={r => `Recorded total: ${money(r?.total)}`} />} />
            <Bar dataKey={view === "average" ? "mean" : "total"} name="Sales" fill="#185FA5" maxBarSize={38} radius={[5,5,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </> : <Empty />}
      <p style={note}>Monthly totals are lower when fewer days were recorded. Use daily averages for comparisons; month, weather and weddings may overlap.</p>
    </Box>

    <Box title="Weather versus sales" description="Each dot represents one recorded day. Compare humidity, perceived heat, rainfall and temperature.">
      <label style={{ display: "block", fontWeight: 600, fontSize: 12, marginBottom: 7 }} htmlFor="weather-factor">Weather variable</label>
      <select id="weather-factor" value={factorKey} onChange={e => setFactorKey(e.target.value)}
        style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: 9, marginBottom: 8 }}>
        {WEATHER_FACTORS.map(f => <option key={f.key} value={f.key}>{f.label} ({f.unit})</option>)}
      </select>
      <div style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>
        <strong>{scatter.length}</strong> matched dates · Pearson r: <strong>{correlation === null ? "N/A" : correlation.toFixed(2)}</strong>
      </div>
      {scatter.length >= 3 ? <ResponsiveContainer width="100%" height={270}>
        <ScatterChart margin={{ top: 5, left: 0, right: 12, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eff2f5" />
          <XAxis dataKey="x" type="number" name={factor.label} unit={factor.unit} domain={["auto", "auto"]} tick={tick} tickCount={6} />
          <YAxis dataKey="y" type="number" name="Net daily sales" width={53} tick={tick} tickFormatter={currencyAxis} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const row = payload[0]?.payload
            if (!row) return null
            return <div style={{ ...card, fontSize: 12, padding: 10 }}>
              <strong>{row.date}</strong><div>{factor.label}: {row.x.toFixed(2)} {factor.unit}</div>
              <div>Net sales: {money(row.y)}</div>
            </div>
          }} />
          <Scatter data={scatter} name="Recorded dates" fill="#1D9E75" />
        </ScatterChart>
      </ResponsiveContainer> : <Empty message="At least 3 records with this weather field are needed. Run the weather backfill first." />}
      <p style={note}>r ranges from −1 to +1. An association does not prove weather causes sales. Low variation, weekends, weddings and missing dates can distort results.</p>
    </Box>

    <Box title="Weather relationships · quick comparison" description="Pearson correlation of each weather variable with daily sales (not model feature importance).">
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ textAlign: "left", color: "#6b7280", background: "#f9fafb" }}>
            <th style={{ padding: "9px 7px" }}>Variable</th>
            <th style={{ padding: "9px 7px", textAlign: "right" }}>Days</th>
            <th style={{ padding: "9px 7px", textAlign: "right" }}>r</th>
          </tr></thead>
          <tbody>{relationships.map(f => <tr key={f.key} style={{ borderBottom: "1px solid #f3f4f6" }}>
            <td style={{ padding: "9px 7px" }}>{f.label}</td>
            <td style={{ padding: "9px 7px", textAlign: "right" }}>{f.count}</td>
            <td style={{ padding: "9px 7px", textAlign: "right", fontWeight: 650 }}>{f.count >= 8 && f.r !== null ? f.r.toFixed(2) : "—"}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p style={note}>Values shown only with ≥8 matched observations and nonzero variation. Variables are correlated with each other too.</p>
    </Box>

    <Box title="Rainy versus dry shop days" description="Based on shop-hour precipitation where available; falls back to full-day precipitation for older rows.">
      {rain.some(d => d.count > 0) ? <ResponsiveContainer width="100%" height={205}>
        <BarChart data={rain} margin={{ top: 6, right: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eff2f5" />
          <XAxis dataKey="label" tick={tick} />
          <YAxis width={53} tick={tick} tickFormatter={currencyAxis} />
          <Tooltip content={<EntriesTooltip />} />
          <Bar dataKey="mean" name="Average net sales" fill="#534AB7" radius={[5,5,0,0]} maxBarSize={75} />
        </BarChart>
      </ResponsiveContainer> : <Empty />}
      <p style={note}>Rainy means measured precipitation &gt; 0 mm; dry means 0 mm. This is an observational grouping.</p>
    </Box>

    <Box title="Sales across temperature groups" description="Recorded days ranked by average temperature during 9 AM–6 PM; split into three similar-sized groups.">
      {bands.length ? <ResponsiveContainer width="100%" height={220}>
        <BarChart data={bands} margin={{ top: 5, right: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eff2f5" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
          <YAxis width={53} tick={tick} tickFormatter={currencyAxis} />
          <Tooltip content={<EntriesTooltip extra={r => `Temperature range: ${r?.range || "—"}`} />} />
          <Bar dataKey="mean" name="Average net sales" fill="#D97706" radius={[5,5,0,0]} maxBarSize={75} />
        </BarChart>
      </ResponsiveContainer> : <Empty message="Need at least six days with shop-hours temperature to compare groups." />}
      <p style={note}>Temperature boundaries depend on your available records. Same temperature can occur in adjacent groups. These are descriptive, not predictive.</p>
    </Box>

    <div style={{ background: "#E1F5EE", borderRadius: 12, border: "1px solid #9FE1CB", padding: 14, fontSize: 12, lineHeight: 1.7, color: "#085041" }}>
      <strong>What this tells us</strong><br />
      Your weekend and wedding-season ideas remain hypotheses until we compare enough recorded days and account for other factors. These charts show associations, not a sales forecast. We can use these same columns for ML later—without changing how your family enters daily sales.
    </div>
  </div>
}
