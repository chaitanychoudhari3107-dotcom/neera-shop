const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "Request failed")
  }
  return res.json()
}

export const getEntries      = ()            => request("/entries/")
export const getEntry        = (date)        => request(`/entries/${date}`)
export const createEntry     = (data)        => request("/entries/", { method: "POST", body: JSON.stringify(data) })
export const updateEntry     = (date, data)  => request(`/entries/${date}`, { method: "PUT", body: JSON.stringify(data) })
export const getPrakash      = (date)        => request(`/prakash/${date}`)
export const getMonthSummary = (year, month) => request(`/summary/${year}/${month}`)