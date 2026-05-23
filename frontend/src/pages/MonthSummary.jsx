import { useState, useEffect } from "react"
import { getMonthSummary } from "../api"
import SummaryCard       from "../components/SummaryCard"
import LockerVerify      from "../components/LockerVerify"
import SalesBarChart     from "../charts/SalesBarChart"
import CashUpiSplit      from "../charts/CashUpiSplit"
import RevenueVsCostLine from "../charts/RevenueVsCostLine"
import PrakashBreakdown  from "../charts/PrakashBreakdown"
import LockerAreaChart   from "../charts/LockerAreaChart"

export default function MonthSummary() {
  const now = new Date()
  const [year,    setYear]    = useState(now.getFullYear())
  const [month,   setMonth]   = useState(now.getMonth() + 1)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchSummary() }, [year, month])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const data = await getMonthSummary(year, month)
      setSummary(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const buildChartData = () => {
    if (!summary?.daily_entries) return []
    let cumSales = 0, cumInvestments = 0, cumLocker = 0

    return summary.daily_entries.map(e => {
      const day          = e.entry_date.slice(8)
      const investments  = (e.cash_purchases || 0) +
        (e.prakash_expenses || []).reduce((s, p) => s + p.amount, 0)
      const cash         = (e.total_cash_counted || 0) - (e.upi_earnings || 0)

      cumSales       += e.net_daily_sales   || 0
      cumInvestments += investments
      cumLocker      += e.locker_cash       || 0

      return {
        day,
        net_daily_sales:        e.net_daily_sales   || 0,
        upi:                    e.upi_earnings       || 0,
        cash:                   Math.max(0, cash),
        cumulative_sales:       Math.round(cumSales),
        cumulative_investments: Math.round(cumInvestments),
        cumulative_locker:      Math.round(cumLocker),
      }
    })
  }

  const allPrakashExpenses = () => {
    if (!summary?.daily_entries) return []
    return summary.daily_entries.flatMap(e => e.prakash_expenses || [])
  }

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun",
                  "Jul","Aug","Sep","Oct","Nov","Dec"]

  const chartData = summary ? buildChartData() : []

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>📊 Month Summary</h2>

      {/* Month picker */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={month} onChange={e => setMonth(Number(e.target.value))}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
            fontSize: 14, flex: 1 }}>
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
            fontSize: 14, flex: 1 }}>
          {[2024, 2025, 2026, 2027].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading && <p style={{ color: "#9ca3af" }}>Loading...</p>}

      {!loading && summary && (
        <>
          {/* KPI Cards */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            <SummaryCard label="Total Net Sales"       value={summary.total_net_sales}      color="#1D9E75" />
            <SummaryCard label="Total Investments"     value={summary.total_investments}    color="#D85A30" />
            <SummaryCard label="Prakash Ji Due"        value={summary.total_prakash}        color="#534AB7" />
            <SummaryCard label="UPI Collected"         value={summary.total_upi}            color="#185FA5" />
            <SummaryCard label="Cash in Locker"        value={summary.total_locker_cash}    color="#085041" />
          </div>

          {/* Locker reconciliation */}
          <LockerVerify computedLocker={summary.total_locker_cash} />

          {/* Charts */}
          {chartData.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
              <SalesBarChart     data={chartData} />
              <CashUpiSplit      data={chartData} />
              <RevenueVsCostLine data={chartData} />
              <PrakashBreakdown  expenses={allPrakashExpenses()} />
              <LockerAreaChart   data={chartData} />
            </div>
          ) : (
            <p style={{ color: "#9ca3af", marginTop: 20, fontSize: 14 }}>
              No entries found for this month.
            </p>
          )}
        </>
      )}
    </div>
  )
}