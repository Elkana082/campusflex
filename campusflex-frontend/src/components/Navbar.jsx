import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CampusSwitcher from "./CampusSwitcher";
import api from "../api/axios";

export const CAMPUSES = [
  { id: "maseno",     name: "Maseno University",                        short: "MASENO",  emoji: "🔵", color: "#1d4ed8" },
  { id: "uon",        name: "University of Nairobi",                    short: "UoN",     emoji: "🔴", color: "#dc2626" },
  { id: "ku",         name: "Kenyatta University",                      short: "KU",      emoji: "🟢", color: "#16a34a" },
  { id: "mmust",      name: "Masinde Muliro University of Sci & Tech",  short: "MMUST",   emoji: "🟠", color: "#ea580c" },
  { id: "moi",        name: "Moi University",                           short: "MOI",     emoji: "🟣", color: "#9333ea" },
  { id: "strathmore", name: "Strathmore University",                    short: "STRATH",  emoji: "⚫", color: "#374151" },
];

export default function Navbar() {
  const { user, currentCampus, toggleDarkMode, darkMode, isAdmin } = useAuth();
  const [showSwitcher, setShowSwitcher]     = useState(false);
  const [notifCount, setNotifCount]         = useState(0);
  const [msgCount, setMsgCount]             = useState(0);
  const navigate = useNavigate();

  const campus = CAMPUSES.find((c) => c.id === currentCampus) || CAMPUSES[0];

  useEffect(() => {
    if (!user) return;
    const fetchBadges = () => {
      api.get("/notifications/unread/count").then((r) => setNotifCount(r.data.count)).catch(() => {});
      api.get("/messages/unread/count").then((r) => setMsgCount(r.data.count)).catch(() => {});
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  const Badge = ({ count }) =>
    count > 0 ? (
      <div style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bg)" }}>
        {count > 9 ? "9+" : count}
      </div>
    ) : null;

  return (
    <>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--nav-bg)", backdropFilter: "blur(18px)", borderBottom: "1px solid var(--border)", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo */}
        <span className="syne gradient-text" style={{ fontWeight: 800, fontSize: 21, letterSpacing: "-0.02em", cursor: "pointer" }} onClick={() => navigate("/")}>
          CampusFlex
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Campus pill */}
          <button onClick={() => setShowSwitcher(true)} style={{ display: "flex", alignItems: "center", gap: 5, background: campus.color + "18", border: `1px solid ${campus.color}44`, borderRadius: 20, padding: "5px 11px", cursor: "pointer", color: campus.color, fontSize: 12, fontWeight: 700 }}>
            {campus.emoji} {campus.short}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={campus.color} strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
          </button>

          {/* Admin panel */}
          {isAdmin && (
            <button onClick={() => navigate("/admin")} style={{ background: "var(--accent)", border: "none", borderRadius: 10, padding: "5px 10px", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
              🛡️
            </button>
          )}

          {/* Dark mode */}
          <button onClick={toggleDarkMode} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
            {darkMode
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            }
          </button>

          {/* Messages */}
          <button onClick={() => navigate("/messages")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, position: "relative" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <Badge count={msgCount} />
          </button>

          {/* Notifications */}
          <button onClick={() => navigate("/notifications")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, position: "relative" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            <Badge count={notifCount} />
          </button>
        </div>
      </nav>

      {showSwitcher && <CampusSwitcher onClose={() => setShowSwitcher(false)} />}
    </>
  );
}