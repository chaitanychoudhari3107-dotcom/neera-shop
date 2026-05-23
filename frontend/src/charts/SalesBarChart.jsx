import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export default function SalesBarChart({ data }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
      <p style={{ fontWeight: 600, margin: "0 0 16px" }}>Daily Net Sales</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={60}
            tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
          <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Net Sales"]} />
          <Bar dataKey="net_daily_sales" fill="#1D9E75" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}