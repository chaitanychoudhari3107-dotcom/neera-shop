export default function SummaryCard({ label, value, color = "#1D9E75", prefix = "₹" }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "14px 16px",
      border: "1px solid #e5e7eb", flex: 1, minWidth: 140,
    }}>
      <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color }}>
        {prefix}{(value || 0).toLocaleString("en-IN")}
      </p>
    </div>
  )
}