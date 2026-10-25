import { useEffect, useState } from "react"
import { getEntries } from "../api"
import WeatherDetails from "../components/WeatherDetails"

// Format financial values
const formatMoney = (value) =>
  `₹${(Number(value) || 0).toLocaleString("en-IN")}`

// Format temperatures
const formatTemp = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—"
  }

  const number = Number(value)

  return Number.isFinite(number)
    ? `${number.toFixed(1)}°C`
    : "—"
}

export default function History({ setTab }) {
  const [entries, setEntries] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    getEntries()
      .then(setEntries)
      .catch((err) => {
        console.error(err)
        setError("Unable to load history. Please try again.")
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <p style={{ color: "#6b7280" }}>
        Loading...
      </p>
    )
  }

  if (error) {
    return (
      <p style={{ color: "#991b1b" }}>
        {error}
      </p>
    )
  }

  if (!entries.length) {
    return (
      <p style={{ color: "#6b7280" }}>
        No entries yet.
      </p>
    )
  }

  return (
    <div>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 20
        }}
      >
        📋 History
      </h2>

      {entries.map((e) => {
        const hasWeather = [
          e.temperature_mean_c,
          e.temperature_max_c,
          e.temperature_min_c
        ].some(
          value =>
            value !== null &&
            value !== undefined &&
            value !== ""
        )

        return (
          <div
            key={e.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              marginBottom: 12,
              overflow: "hidden"
            }}
          >

            {/* Collapsed Entry Header */}

            <div
              onClick={() =>
                setExpanded(
                  expanded === e.id ? null : e.id
                )
              }
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 16px",
                cursor: "pointer",
                background:
                  expanded === e.id ? "#f9fafb" : "#fff",
                gap: 10
              }}
            >

              <div>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: 15
                  }}
                >
                  {e.entry_date} · {getWeekday(e.entry_date)}
                </p>

                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    color: "#6b7280"
                  }}
                >
                  Net Sales: {formatMoney(e.net_daily_sales)}
                </p>

                {/* Quick Temperature Indicator */}

                {hasWeather && (
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 12,
                      color: "#087F5B",
                      fontWeight: 500
                    }}
                  >
                    🌡️ Pune: {formatTemp(e.temperature_mean_c)}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center"
                }}
              >

                <span
                  style={{
                    fontSize: 12,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: "#E6F1FB",
                    color: "#042C53",
                    whiteSpace: "nowrap"
                  }}
                >
                  UPI {formatMoney(e.upi_earnings)}
                </span>

                <span
                  style={{
                    fontSize: 18,
                    color: "#9ca3af"
                  }}
                >
                  {expanded === e.id ? "▲" : "▼"}
                </span>

              </div>
            </div>

            {/* Expanded Details */}

            {expanded === e.id && (
              <div
                style={{
                  padding: "14px 16px",
                  borderTop: "1px solid #f3f4f6",
                  background: "#fafafa"
                }}
              >

                {/* Financial Information */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginBottom: 16
                  }}
                >
                  {[
                    ["Morning Float", e.morning_float],
                    ["Total Cash", e.total_cash_counted],
                    ["Locker Cash", e.locker_cash],
                    ["Cash Purchases", e.cash_purchases],
                    ["UPI Earnings", e.upi_earnings],
                    ["Net Sales", e.net_daily_sales]
                  ].map(([label, val]) => (

                    <div
                      key={label}
                      style={{
                        background: "#fff",
                        borderRadius: 8,
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb"
                      }}
                    >

                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          color: "#9ca3af"
                        }}
                      >
                        {label}
                      </p>

                      <p
                        style={{
                          margin: 0,
                          fontSize: 15,
                          fontWeight: 600
                        }}
                      >
                        {formatMoney(val)}
                      </p>

                    </div>

                  ))}
                </div>

                {/* Pune Temperature Section */}

                <div
                  style={{
                    background: "#E1F5EE",
                    border: "1px solid #9FE1CB",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 16
                  }}
                >

                  <h3
                    style={{
                      margin: "0 0 14px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#085041"
                    }}
                  >
                    🌤️ Pune Weather
                  </h3>

                  {hasWeather ? (
                    <>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(3, minmax(0, 1fr))",
                          gap: 8,
                          textAlign: "center"
                        }}
                      >

                        <div>
                          <p
                            style={{
                              margin: "0 0 6px",
                              fontSize: 11,
                              color: "#6b7280"
                            }}
                          >
                            🌡️ Average
                          </p>

                          <strong
                            style={{
                              fontSize: 18,
                              color: "#085041"
                            }}
                          >
                            {formatTemp(e.temperature_mean_c)}
                          </strong>
                        </div>

                        <div>
                          <p
                            style={{
                              margin: "0 0 6px",
                              fontSize: 11,
                              color: "#6b7280"
                            }}
                          >
                            🔥 Maximum
                          </p>

                          <strong
                            style={{
                              fontSize: 18,
                              color: "#085041"
                            }}
                          >
                            {formatTemp(e.temperature_max_c)}
                          </strong>
                        </div>

                        <div>
                          <p
                            style={{
                              margin: "0 0 6px",
                              fontSize: 11,
                              color: "#6b7280"
                            }}
                          >
                            ❄️ Minimum
                          </p>

                          <strong
                            style={{
                              fontSize: 18,
                              color: "#085041"
                            }}
                          >
                            {formatTemp(e.temperature_min_c)}
                          </strong>
                        </div>

                      </div>

                      <WeatherDetails weather={e} />

                      {/* Weather Status */}

                      <div
                        style={{
                          textAlign: "center",
                          marginTop: 14
                        }}
                      >

                        <span
                          style={{
                            display: "inline-block",
                            fontSize: 11,
                            padding: "5px 10px",
                            borderRadius: 20,
                            background:
                              e.temperature_status === "preliminary"
                                ? "#FEF3C7"
                                : "#D1FAE5",
                            color:
                              e.temperature_status === "preliminary"
                                ? "#92400E"
                                : "#065F46"
                          }}
                        >
                          {e.temperature_status === "preliminary"
                            ? "⚠️ Preliminary Data"
                            : e.temperature_status === "finalized"
                            ? "📚 Historical Data"
                            : "Weather Data"}
                        </span>

                        {e.temperature_source && (
                          <p
                            style={{
                              margin: "8px 0 0",
                              fontSize: 10,
                              color: "#6b7280"
                            }}
                          >
                            Source: {e.temperature_source}
                          </p>
                        )}

                      </div>

                    </>
                  ) : (

                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: "#6b7280"
                      }}
                    >
                      Temperature data unavailable for this entry.
                    </p>

                  )}

                </div>

                {/* Prakash Expenses */}

                {(e.prakash_expenses || []).length > 0 && (
                  <div style={{ marginBottom: 12 }}>

                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        marginBottom: 6
                      }}
                    >
                      Prakash Ji's Expenses
                    </p>

                    {e.prakash_expenses.map((p, i) => (

                      <div
                        key={i}
                        style={{
                          fontSize: 13,
                          padding: "6px 0",
                          borderBottom: "1px solid #f3f4f6",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10
                        }}
                      >

                        <span style={{ color: "#374151" }}>
                          {p.description}

                          <span style={{ color: "#9ca3af" }}>
                            {" "}· {p.payment_method}
                          </span>
                        </span>

                        <span style={{ fontWeight: 500 }}>
                          {formatMoney(p.amount)}
                        </span>

                      </div>

                    ))}

                  </div>
                )}

                {/* Edit Entry Button */}

                <button
                  onClick={() => {
                    setTab("entry")

                    setTimeout(() => {
                      const event = new CustomEvent(
                        "loadEntry",
                        { detail: e.entry_date }
                      )

                      window.dispatchEvent(event)
                    }, 100)
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#1D9E75",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 13
                  }}
                >
                  ✏️ Edit this entry
                </button>

              </div>
            )}

          </div>
        )
      })}
    </div>
  )
}

const getWeekday = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number)

  return new Date(
    Date.UTC(year, month - 1, day)
  ).toLocaleDateString("en-IN", {
    weekday: "long",
    timeZone: "UTC"
  })
}