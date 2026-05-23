const DENOMS = [500, 200, 100, 50, 20, 10]

export default function DenominationCounter({ values, onChange }) {
  const update = (denom, delta) => {
    const key = `n_${denom}`
    const next = Math.max(0, (values[key] || 0) + delta)
    onChange({ ...values, [key]: next })
  }

  const total        = DENOMS.reduce((s, d) => s + (values[`n_${d}`] || 0) * d, 0)
  const lockerCash   = [500, 200, 100].reduce((s, d) => s + (values[`n_${d}`] || 0) * d, 0)
  const changefloat  = [50, 20, 10].reduce((s, d) => s + (values[`n_${d}`] || 0) * d, 0)

  return (
    <div>
      <p style={{ fontWeight: 600, marginBottom: 10 }}>Night Cash Count</p>

      {DENOMS.map(denom => {
        const key   = `n_${denom}`
        const count = values[key] || 0
        const isLocker = denom >= 100

        return (
          <div key={denom} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 0", borderBottom: "1px solid #f3f4f6",
          }}>
            <span style={{
              width: 60, fontSize: 14, fontWeight: 500,
              color: isLocker ? "#1D9E75" : "#185FA5",
            }}>
              ₹{denom}
            </span>

            <button onClick={() => update(denom, -1)}
              style={{
                width: 40, height: 40, borderRadius: 8,
                border: "1px solid #e5e7eb", background: "#f9fafb",
                fontSize: 20, cursor: "pointer", lineHeight: 1,
              }}>−</button>

            <span style={{ width: 32, textAlign: "center", fontSize: 16, fontWeight: 600 }}>
              {count}
            </span>

            <button onClick={() => update(denom, 1)}
              style={{
                width: 40, height: 40, borderRadius: 8,
                border: "1px solid #e5e7eb", background: "#f9fafb",
                fontSize: 20, cursor: "pointer", lineHeight: 1,
              }}>+</button>

            <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>
              ₹{(count * denom).toLocaleString("en-IN")}
            </span>
          </div>
        )
      })}

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span style={{ padding: "4px 12px", borderRadius: 20,
          background: "#E1F5EE", color: "#085041", fontSize: 12, fontWeight: 500 }}>
          🔒 Locker: ₹{lockerCash.toLocaleString("en-IN")}
        </span>
        <span style={{ padding: "4px 12px", borderRadius: 20,
          background: "#E6F1FB", color: "#042C53", fontSize: 12, fontWeight: 500 }}>
          🪙 Float: ₹{changefloat.toLocaleString("en-IN")}
        </span>
        <span style={{ padding: "4px 12px", borderRadius: 20,
          background: "#f3f4f6", color: "#374151", fontSize: 12, fontWeight: 500 }}>
          Total: ₹{total.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  )
}