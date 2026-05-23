export default function PrakashExpenseRow({ expense, index, onChange, onRemove }) {
  const update = (field, value) => onChange(index, { ...expense, [field]: value })

  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "center",
      padding: "10px 0", borderBottom: "1px solid #f3f4f6", flexWrap: "wrap",
    }}>
      <input
        type="number" placeholder="Amount ₹"
        value={expense.amount || ""}
        onChange={e => update("amount", parseFloat(e.target.value) || 0)}
        style={{ width: 100, padding: "8px 10px", borderRadius: 8,
          border: "1px solid #e5e7eb", fontSize: 14 }}
      />
      <input
        type="text" placeholder="What was bought"
        value={expense.description || ""}
        onChange={e => update("description", e.target.value)}
        style={{ flex: 1, minWidth: 140, padding: "8px 10px", borderRadius: 8,
          border: "1px solid #e5e7eb", fontSize: 14 }}
      />
      <select
        value={expense.payment_method || "UPI"}
        onChange={e => update("payment_method", e.target.value)}
        style={{ padding: "8px 10px", borderRadius: 8,
          border: "1px solid #e5e7eb", fontSize: 14 }}
      >
        <option>UPI</option>
        <option>Card</option>
        <option>Cash</option>
      </select>
      <button onClick={() => onRemove(index)}
        style={{ padding: "8px 12px", borderRadius: 8, border: "none",
          background: "#fee2e2", color: "#991b1b", cursor: "pointer", fontSize: 14 }}>
        ✕
      </button>
    </div>
  )
}