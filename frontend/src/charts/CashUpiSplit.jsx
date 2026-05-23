
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"

export default function CashUpiSplit({ data }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
      <p style={{ fontWeight: 600, margin: "0 0 16px" }}>Cash vs UPI Split</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={60}
            tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
          <Tooltip formatter={v => `₹${v.toLocaleString("en-IN")}`} />
          <Legend />
          <Bar dataKey="cash" name="Cash" fill="#1D9E75" radius={[4, 4, 0, 0]} stackId="a" />
          <Bar dataKey="upi"  name="UPI"  fill="#185FA5" radius={[4, 4, 0, 0]} stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}