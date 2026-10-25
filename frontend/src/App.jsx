import { useState, useEffect } from "react";

import DailyEntry from "./pages/DailyEntry";
import History from "./pages/History";
import MonthSummary from "./pages/MonthSummary";
import WeatherAnalytics from "./pages/WeatherAnalytics";

import Login from "./components/login";
import { supabase } from "./supabaseClient";

const TABS = [
  { id: "entry", label: "Daily Entry", icon: "✏️" },
  { id: "history", label: "History", icon: "📋" },
  { id: "summary", label: "Month Summary", icon: "📊" },
  { id: "analytics", label: "Analytics", icon: "📈" },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("entry");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setAuthLoading(false);
      }
    }).catch(() => {
      if (mounted) setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Logout failed: " + error.message);
    }
  };

  if (authLoading) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        Loading NEERA...
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div
      style={{
        maxWidth: 680,
        margin: "0 auto",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          🌿 Neera & Cold Drink Shop
        </h1>

        <button
          onClick={handleLogout}
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Logout
        </button>
      </header>

      <main
        style={{
          flex: 1,
          padding: "20px 16px",
          overflowY: "auto",
        }}
      >
        {tab === "entry" && <DailyEntry />}
        {tab === "history" && <History setTab={setTab} />}
        {tab === "summary" && <MonthSummary />}
        {tab === "analytics" && <WeatherAnalytics />}
      </main>

      <nav
        style={{
          display: "flex",
          borderTop: "1px solid #e5e7eb",
          position: "sticky",
          bottom: 0,
          background: "#fff",
          zIndex: 10,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: "12px 0",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? "#1D9E75" : "#6b7280",
              borderTop:
                tab === t.id
                  ? "2px solid #1D9E75"
                  : "2px solid transparent",
            }}
          >
            <div style={{ fontSize: 20 }}>{t.icon}</div>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}