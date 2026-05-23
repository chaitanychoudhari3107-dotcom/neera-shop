import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export default function PrakashBreakdown({ expenses }) {
  if (!expenses || expenses.length === 0) {
    return (
      <div style={{ background: "#fff", borderRadius: 12, padding: 16,
        border: "1px solid #e5e7eb" }}>
        <p style={{ fontWeight: 600, margin: "0 0 8px" }}>Prakash Ji's Expenses</p>
        <p style={{ color: "#9ca3af", fontSize: 13 }}>No expenses this month.</p>
      </div>
    )
  }

  const data = expenses.map(e => ({
    name: e.description.length > 12 ? e.description.slice(0, 12) + "…" : e.description,
    amount: e.amount,
  }))

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
      <p style={{ fontWeight: 600, margin: "0 0 16px" }}>Prakash Ji's Expenses Breakdown</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis type="number" tick={{ fontSize: 11 }}
            tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
          <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Amount"]} />
          <Bar dataKey="amount" fill="#534AB7" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}