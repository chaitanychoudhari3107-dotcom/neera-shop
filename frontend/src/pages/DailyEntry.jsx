import { useState, useEffect } from "react"
import DenominationCounter from "../components/DenominationCounter"
import PrakashExpenseRow   from "../components/PrakashExpenseRow"
import { createEntry, updateEntry, getEntry } from "../api"

const today = () => new Date().toISOString().split("T")[0]

const emptyDenoms = { n_500:0, n_200:0, n_100:0, n_50:0, n_20:0, n_10:0 }

export default function DailyEntry() {
  const [date,            setDate]            = useState(today())
  const [morningFloat,    setMorningFloat]    = useState("")
  const [denoms,          setDenoms]          = useState(emptyDenoms)
  const [upiEarnings,     setUpiEarnings]     = useState("")
  const [cashPurchases,   setCashPurchases]   = useState("")
  const [prakashExpenses, setPrakashExpenses] = useState([])
  const [isEdit,          setIsEdit]          = useState(false)
  const [status,          setStatus]          = useState("")
  const [loading,         setLoading]         = useState(false)

  useEffect(() => {
    const handler = (e) => {
      setDate(e.detail)
      loadExisting(e.detail)
    }
    window.addEventListener("loadEntry", handler)
    return () => window.removeEventListener("loadEntry", handler)
  }, [])

  useEffect(() => {
    loadExisting(today())
  }, [])

  const prefillMorningFloat = async (d) => {
    try {
      const prev = new Date(d)
      prev.setDate(prev.getDate() - 1)
      const prevStr = prev.toISOString().split("T")[0]
      const prevData = await getEntry(prevStr)
      const changeFloat =
        ((prevData.n_50  || 0) * 50) +
        ((prevData.n_20  || 0) * 20) +
        ((prevData.n_10  || 0) * 10)
      setMorningFloat(changeFloat)
      setStatus(`💡 Morning float auto-filled from ${prevStr}: ₹${changeFloat.toLocaleString("en-IN")}`)
    } catch {
      setMorningFloat("")
      setStatus("")
    }
  }

  const loadExisting = async (d) => {
    try {
      const data = await getEntry(d)
      setMorningFloat(data.morning_float)
      setDenoms({ n_500: data.n_500, n_200: data.n_200, n_100: data.n_100,
                  n_50:  data.n_50,  n_20:  data.n_20,  n_10:  data.n_10 })
      setUpiEarnings(data.upi_earnings)
      setCashPurchases(data.cash_purchases)
      setPrakashExpenses(data.prakash_expenses || [])
      setIsEdit(true)
      setStatus("Loaded existing entry — you can now edit it.")
    } catch {
      setIsEdit(false)
      setDenoms(emptyDenoms)
      setUpiEarnings("")
      setCashPurchases("")
      setPrakashExpenses([])
      await prefillMorningFloat(d)
    }
  }

  const handleDateChange = (e) => {
    setDate(e.target.value)
    setStatus("")
    loadExisting(e.target.value)
  }

  const addPrakash = () =>
    setPrakashExpenses(p => [...p, { amount: "", description: "", payment_method: "UPI" }])

  const updatePrakash = (i, val) =>
    setPrakashExpenses(p => p.map((e, idx) => idx === i ? val : e))

  const removePrakash = (i) =>
    setPrakashExpenses(p => p.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    setLoading(true)
    setStatus("")
    try {
      const payload = {
        entry_date:       date,
        morning_float:    parseFloat(morningFloat) || 0,
        ...denoms,
        upi_earnings:     parseFloat(upiEarnings)   || 0,
        cash_purchases:   parseFloat(cashPurchases) || 0,
        prakash_expenses: prakashExpenses.filter(e => e.description),
      }

      if (isEdit) {
        await updateEntry(date, payload)
        setStatus("✅ Entry updated successfully!")
      } else {
        await createEntry(payload)

        const changeFloat =
          ((denoms.n_50 || 0) * 50) +
          ((denoms.n_20 || 0) * 20) +
          ((denoms.n_10 || 0) * 10)

        const tomorrow = new Date(date)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowStr = tomorrow.toISOString().split("T")[0]

        setStatus(`✅ Entry saved! Tomorrow's morning float pre-filled: ₹${changeFloat.toLocaleString("en-IN")}`)
        setDate(tomorrowStr)
        setMorningFloat(changeFloat)
        setDenoms(emptyDenoms)
        setUpiEarnings("")
        setCashPurchases("")
        setPrakashExpenses([])
        setIsEdit(false)
      }
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`)
    }
    setLoading(false)
  }

  const field = (label, value, setter, type = "number") => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500,
        color: "#374151", marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => setter(e.target.value)}
        onWheel={e => e.target.blur()}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 10,
          border: "1px solid #e5e7eb", fontSize: 15, boxSizing: "border-box" }}
      />
    </div>
  )

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
        {isEdit ? "✏️ Edit Entry" : "📝 Daily Entry"}
      </h2>

      {field("Date", date, setDate, "date")}
      {field("Morning Float (₹)", morningFloat, setMorningFloat)}

      <div style={{ marginBottom: 20 }}>
        <DenominationCounter values={denoms} onChange={setDenoms} />
      </div>

      {field("UPI Earnings (₹)", upiEarnings, setUpiEarnings)}
      {field("Cash Purchases (₹)", cashPurchases, setCashPurchases)}

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontWeight: 600, margin: 0 }}>Prakash Ji's Expenses</p>
          <button onClick={addPrakash}
            style={{ padding: "6px 14px", borderRadius: 8, border: "none",
              background: "#1D9E75", color: "#fff", cursor: "pointer", fontSize: 13 }}>
            + Add
          </button>
        </div>
        {prakashExpenses.length === 0 &&
          <p style={{ fontSize: 13, color: "#9ca3af" }}>No expenses added yet.</p>}
        {prakashExpenses.map((e, i) => (
          <PrakashExpenseRow key={i} expense={e} index={i}
            onChange={updatePrakash} onRemove={removePrakash} />
        ))}
        {prakashExpenses.length > 0 && (
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
            Total: ₹{prakashExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
              .toLocaleString("en-IN")}
          </p>
        )}
      </div>

      {status && (
        <p style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16,
          background: status.startsWith("✅") ? "#E1F5EE" :
                      status.startsWith("💡") ? "#E6F1FB" : "#fee2e2",
          color:      status.startsWith("✅") ? "#085041" :
                      status.startsWith("💡") ? "#042C53" : "#991b1b",
          fontSize: 14 }}>{status}</p>
      )}

      <button onClick={handleSubmit} disabled={loading}
        style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none",
          background: loading ? "#9ca3af" : "#1D9E75", color: "#fff",
          fontSize: 16, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Saving..." : isEdit ? "Update Entry" : "Save Entry"}
      </button>
    </div>
  )
}