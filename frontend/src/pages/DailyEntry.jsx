import { useState, useEffect, useRef } from "react"
import DenominationCounter from "../components/DenominationCounter"
import PrakashExpenseRow from "../components/PrakashExpenseRow"
import WeatherDetails from "../components/WeatherDetails"
import { createEntry, updateEntry, getEntry, getWeather } from "../api"

// Use Pune's local date instead of UTC
const today = () =>
  new Date(Date.now() + 330 * 60 * 1000).toISOString().split("T")[0]

const emptyDenoms = {
  n_500: 0,
  n_200: 0,
  n_100: 0,
  n_50: 0,
  n_20: 0,
  n_10: 0
}

export default function DailyEntry() {
  const [date, setDate] = useState(today())
  const [morningFloat, setMorningFloat] = useState("")
  const [denoms, setDenoms] = useState(emptyDenoms)
  const [upiEarnings, setUpiEarnings] = useState("")
  const [cashPurchases, setCashPurchases] = useState("")
  const [prakashExpenses, setPrakashExpenses] = useState([])
  const [isEdit, setIsEdit] = useState(false)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [entryLoading, setEntryLoading] = useState(false)
  const [entryLoadError, setEntryLoadError] = useState(false)
  const loadSequence = useRef(0)

  // Pune Temperature States
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState("")

  // Load an entry selected from History
  useEffect(() => {
    const handler = (e) => {
      setDate(e.detail)
      loadExisting(e.detail)
    }

    window.addEventListener("loadEntry", handler)

    return () => window.removeEventListener("loadEntry", handler)
  }, [])

  // Load today's existing entry
  useEffect(() => {
    loadExisting(today())
  }, [])

  // Automatically fetch Pune weather when date changes
  useEffect(() => {
    let active = true

    setWeather(null)
    setWeatherError("")

    if (!date) {
      setWeatherLoading(false)
      return
    }

    if (date > today()) {
      setWeatherLoading(false)
      setWeatherError("Weather will be available on the selected date.")
      return
    }

    setWeatherLoading(true)

    getWeather(date)
      .then((data) => {
        if (active) {
          setWeather(data)
        }
      })
      .catch(() => {
        if (active) {
          setWeatherError(
            "Temperature temporarily unavailable for this date."
          )
        }
      })
      .finally(() => {
        if (active) {
          setWeatherLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [date])

  const prefillMorningFloat = async (d, seq) => {
    try {
      const prev = new Date(`${d}T12:00:00Z`)
      prev.setUTCDate(prev.getUTCDate() - 1)
      const prevStr = prev.toISOString().split("T")[0]
      const prevData = await getEntry(prevStr)
      if (seq !== loadSequence.current) return

      const changeFloat =
        ((prevData.n_50 || 0) * 50) +
        ((prevData.n_20 || 0) * 20) +
        ((prevData.n_10 || 0) * 10)
      setMorningFloat(changeFloat)
      setStatus(`💡 Morning float auto-filled from ${prevStr}: ₹${changeFloat.toLocaleString("en-IN")}`)
    } catch (error) {
      if (seq !== loadSequence.current) return
      if (error.status !== 404) {
        setEntryLoadError(true)
        setStatus("❌ Cannot check the previous day's float. Please retry selecting this date.")
      } else {
        setMorningFloat("")
        setStatus("")
      }
    }
  }

  const loadExisting = async (d) => {
    const seq = ++loadSequence.current
    setEntryLoading(true)
    setEntryLoadError(false)
    try {
      const data = await getEntry(d)
      if (seq !== loadSequence.current) return

      setMorningFloat(data.morning_float)
      setDenoms({
        n_500: data.n_500, n_200: data.n_200, n_100: data.n_100,
        n_50: data.n_50, n_20: data.n_20, n_10: data.n_10
      })
      setUpiEarnings(data.upi_earnings)
      setCashPurchases(data.cash_purchases)
      setPrakashExpenses(data.prakash_expenses || [])
      setIsEdit(true)
      setStatus("Loaded existing entry — you can now edit it.")
    } catch (error) {
      if (seq !== loadSequence.current) return
      if (error.status !== 404) {
        setEntryLoadError(true)
        setStatus("❌ Could not check whether this date already has an entry. Please retry selecting the date.")
        return
      }
      setIsEdit(false)
      setDenoms(emptyDenoms)
      setUpiEarnings("")
      setCashPurchases("")
      setPrakashExpenses([])
      await prefillMorningFloat(d, seq)
    } finally {
      if (seq === loadSequence.current) setEntryLoading(false)
    }
  }

  // Updated date handler
  const handleDateChange = (newDate) => {
    setDate(newDate)
    setStatus("")

    if (newDate) {
      loadExisting(newDate)
    }
  }

  const addPrakash = () =>
    setPrakashExpenses(p => [
      ...p,
      {
        amount: "",
        description: "",
        payment_method: "UPI"
      }
    ])

  const updatePrakash = (i, val) =>
    setPrakashExpenses(p =>
      p.map((e, idx) => idx === i ? val : e)
    )

  const removePrakash = (i) =>
    setPrakashExpenses(p =>
      p.filter((_, idx) => idx !== i)
    )

  const handleSubmit = async () => {
    if (entryLoading || entryLoadError || !date) return
    setLoading(true)
    setStatus("")

    try {
      const payload = {
        entry_date: date,
        morning_float: parseFloat(morningFloat) || 0,
        ...denoms,
        upi_earnings: parseFloat(upiEarnings) || 0,
        cash_purchases: parseFloat(cashPurchases) || 0,
        prakash_expenses: prakashExpenses.filter(e => e.description)
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

        setStatus(
          `✅ Entry saved! Tomorrow's morning float pre-filled: ₹${changeFloat.toLocaleString("en-IN")}`
        )

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
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 500,
          color: "#374151",
          marginBottom: 6
        }}
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={e => setter(e.target.value)}
        onWheel={e => e.target.blur()}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          fontSize: 15,
          boxSizing: "border-box"
        }}
      />
    </div>
  )

  return (
    <div>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 20
        }}
      >
        {isEdit ? "✏️ Edit Entry" : "📝 Daily Entry"}
      </h2>

      {/* Date Selection */}
      {field("Date", date, handleDateChange, "date")}

      {/* Pune Weather Card */}
      <div
        style={{
          background: "#E1F5EE",
          border: "1px solid #9FE1CB",
          borderRadius: 12,
          padding: 16,
          marginBottom: 20
        }}
      >
        <h3
          style={{
            margin: "0 0 14px",
            fontSize: 15,
            fontWeight: 600,
            color: "#085041"
          }}
        >
          🌤️ Pune Weather
        </h3>

        {weatherLoading && (
          <p style={{ fontSize: 13, color: "#666" }}>
            Fetching temperature...
          </p>
        )}

        {weatherError && !weatherLoading && (
          <p
            style={{
              fontSize: 13,
              color: "#991b1b"
            }}
          >
            {weatherError}
          </p>
        )}

        {weather && !weatherLoading && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
                textAlign: "center"
              }}
            >
              <div>
                <p style={{ fontSize: 12, color: "#666" }}>
                  🌡️ Average
                </p>

                <strong
                  style={{
                    fontSize: 19,
                    color: "#085041"
                  }}
                >
                  {weather.temperature_mean_c == null ? "—" : `${Number(weather.temperature_mean_c).toFixed(1)}°C`}
                </strong>
              </div>

              <div>
                <p style={{ fontSize: 12, color: "#666" }}>
                  🔥 Maximum
                </p>

                <strong
                  style={{
                    fontSize: 19,
                    color: "#085041"
                  }}
                >
                  {weather.temperature_max_c == null ? "—" : `${Number(weather.temperature_max_c).toFixed(1)}°C`}
                </strong>
              </div>

              <div>
                <p style={{ fontSize: 12, color: "#666" }}>
                  ❄️ Minimum
                </p>

                <strong
                  style={{
                    fontSize: 19,
                    color: "#085041"
                  }}
                >
                  {weather.temperature_min_c == null ? "—" : `${Number(weather.temperature_min_c).toFixed(1)}°C`}
                </strong>
              </div>
            </div>

            <WeatherDetails weather={weather} />

            <p
              style={{
                margin: "14px 0 0",
                fontSize: 11,
                color: "#6b7280",
                textAlign: "center"
              }}
            >
              {weather.temperature_status === "preliminary"
                ? "⚠️ Preliminary weather data"
                : "📚 Historical weather (may be revised)"}
            </p>
          </>
        )}
      </div>

      {/* Existing Daily Entry Fields */}
      {field("Morning Float (₹)", morningFloat, setMorningFloat)}

      <div style={{ marginBottom: 20 }}>
        <DenominationCounter
          values={denoms}
          onChange={setDenoms}
        />
      </div>

      {field("UPI Earnings (₹)", upiEarnings, setUpiEarnings)}

      {field("Cash Purchases (₹)", cashPurchases, setCashPurchases)}

      {/* Prakash Expenses */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10
          }}
        >
          <p style={{ fontWeight: 600, margin: 0 }}>
            Prakash Ji's Expenses
          </p>

          <button
            onClick={addPrakash}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              background: "#1D9E75",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13
            }}
          >
            + Add
          </button>
        </div>

        {prakashExpenses.length === 0 && (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            No expenses added yet.
          </p>
        )}

        {prakashExpenses.map((e, i) => (
          <PrakashExpenseRow
            key={i}
            expense={e}
            index={i}
            onChange={updatePrakash}
            onRemove={removePrakash}
          />
        ))}

        {prakashExpenses.length > 0 && (
          <p
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginTop: 8
            }}
          >
            Total: ₹
            {prakashExpenses.reduce(
              (s, e) => s + (parseFloat(e.amount) || 0),
              0
            ).toLocaleString("en-IN")}
          </p>
        )}
      </div>

      {/* Status Message */}
      {status && (
        <p
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 16,
            background: status.startsWith("✅")
              ? "#E1F5EE"
              : status.startsWith("💡")
              ? "#E6F1FB"
              : "#fee2e2",
            color: status.startsWith("✅")
              ? "#085041"
              : status.startsWith("💡")
              ? "#042C53"
              : "#991b1b",
            fontSize: 14
          }}
        >
          {status}
        </p>
      )}

      {/* Save Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || entryLoading || entryLoadError || !date}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 12,
          border: "none",
          background: (loading || entryLoading || entryLoadError || !date) ? "#9ca3af" : "#1D9E75",
          color: "#fff",
          fontSize: 16,
          fontWeight: 600,
          cursor: (loading || entryLoading || entryLoadError || !date) ? "not-allowed" : "pointer"
        }}
      >
        {loading
          ? "Saving..."
          : entryLoading ? "Checking existing entry..."
          : entryLoadError ? "Unable to load date"
          : isEdit
          ? "Update Entry"
          : "Save Entry"}
      </button>
    </div>
  )
}