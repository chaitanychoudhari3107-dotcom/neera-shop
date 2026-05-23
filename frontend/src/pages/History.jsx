import { useEffect, useState } from "react"
import { getEntries } from "../api"

export default function History({ setTab }) {
  const [entries,  setEntries]  = useState([])
  const [expanded, setExpanded] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    getEntries()
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: "#6b7280" }}>Loading...</p>
  if (!entries.length) return <p style={{ color: "#6b7280" }}>No entries yet.</p>

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>📋 History</h2>
      {entries.map(e => (
        <div key={e.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12,
          marginBottom: 12, overflow: "hidden" }}>

          <div onClick={() => setExpanded(expanded === e.id ? null : e.id)}
            style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", padding: "14px 16px", cursor: "pointer",
              background: expanded === e.id ? "#f9fafb" : "#fff" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{e.entry_date}</p>
              <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                Net Sales: ₹{(e.net_daily_sales || 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20,
                background: "#E6F1FB", color: "#042C53" }}>
                UPI ₹{(e.upi_earnings || 0).toLocaleString("en-IN")}
              </span>
              <span style={{ fontSize: 18, color: "#9ca3af" }}>
                {expanded === e.id ? "▲" : "▼"}
              </span>
            </div>
          </div>

          {expanded === e.id && (
            <div style={{ padding: "14px 16px", borderTop: "1px solid #f3f4f6",
              background: "#fafafa" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: 8, marginBottom: 12 }}>
                {[
                  ["Morning Float",   e.morning_float],
                  ["Total Cash",      e.total_cash_counted],
                  ["Locker Cash",     e.locker_cash],
                  ["Cash Purchases",  e.cash_purchases],
                  ["UPI Earnings",    e.upi_earnings],
                  ["Net Sales",       e.net_daily_sales],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: "#fff", borderRadius: 8,
                    padding: "10px 12px", border: "1px solid #e5e7eb" }}>
                    <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                      ₹{(val || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              {(e.prakash_expenses || []).length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                    Prakash Ji's Expenses
                  </p>
                  {e.prakash_expenses.map((p, i) => (
                    <div key={i} style={{ fontSize: 13, padding: "6px 0",
                      borderBottom: "1px solid #f3f4f6",
                      display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#374151" }}>{p.description}
                        <span style={{ color: "#9ca3af" }}> · {p.payment_method}</span>
                      </span>
                      <span style={{ fontWeight: 500 }}>
                        ₹{p.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  setTab("entry")
                  setTimeout(() => {
                    const event = new CustomEvent("loadEntry", { detail: e.entry_date })
                    window.dispatchEvent(event)
                  }, 100)
                }}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none",
                  background: "#1D9E75", color: "#fff", cursor: "pointer", fontSize: 13 }}>
                ✏️ Edit this entry
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}