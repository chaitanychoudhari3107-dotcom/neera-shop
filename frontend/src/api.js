import { supabase } from "./supabaseClient";

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

async function request(path, options = {}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error("Please sign in to continue.");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      await supabase.auth.signOut();
      throw new Error("Session expired. Please sign in again.");
    }

    const err = await res.json().catch(() => ({}));
    const message = typeof err.detail === "string" ? err.detail : "Request failed";
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return res.json();
}

export const getEntries = () =>
  request("/entries/");

export const getEntry = (date) =>
  request(`/entries/${date}`);

export const createEntry = (data) =>
  request("/entries/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateEntry = (date, data) =>
  request(`/entries/${date}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const getPrakash = (date) =>
  request(`/prakash/${date}`);

export const getMonthSummary = (year, month) =>
  request(`/summary/${year}/${month}`);

export const getWeather = (date) =>
  request(`/entries/weather/${date}`);