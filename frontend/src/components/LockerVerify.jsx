import { useState } from "react"

export default function LockerVerify({ computedLocker }) {
  const [physical, setPhysical] = useState("")

  const diff = physical !== "" ? parseFloat(physical) - computedLocker : null

  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "16px",
      border: "1px solid #e5e7eb", marginTop: 16,
    }}>
      <p style={{ fontWeight: 600, margin: "0 0 12px" }}>🔒 Locker Reconciliation</p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 4px" }}>App calculated</p>
          <p style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#1D9E75" }}>
            ₹{computedLocker.toLocaleString("en-IN")}
          </p>
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 4px" }}>Physical count</p>
          <input
            type="number"
            placeholder="Enter physical count"
            value={physical}
            onChange={e => setPhysical(e.target.value)}
            style={{
              width: "100%", padding: "8px 10px", borderRadius: 8,
              border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {diff !== null && (
        <div style={{
          marginTop: 12, padding: "10px 14px", borderRadius: 8,
          background: diff === 0 ? "#E1F5EE" : "#fee2e2",
          color: diff === 0 ? "#085041" : "#991b1b",
          fontSize: 13, fontWeight: 500,
        }}>
          {diff === 0
            ? "✅ Perfect match — locker is balanced"
            : `⚠️ Difference: ₹${Math.abs(diff).toLocaleString("en-IN")} ${diff > 0 ? "extra in locker" : "missing from locker"}`}
        </div>
      )}
    </div>
  )
}