import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"

export default function RevenueVsCostLine({ data }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
      <p style={{ fontWeight: 600, margin: "0 0 16px" }}>Cumulative Revenue vs Investments</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={60}
            tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
          <Tooltip formatter={v => `₹${v.toLocaleString("en-IN")}`} />
          <Legend />
          <Line type="monotone" dataKey="cumulative_sales"
            name="Revenue" stroke="#1D9E75" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="cumulative_investments"
            name="Investments" stroke="#D85A30" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}