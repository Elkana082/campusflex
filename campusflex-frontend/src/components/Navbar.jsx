import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CampusSwitcher from "./CampusSwitcher";
import api from "../api/axios";

export const CAMPUSES = [
  { id: "maseno",     name: "Maseno University",                       short: "MASENO",  emoji: "🔵", color: "#1d4ed8" },
  { id: "uon",        name: "University of Nairobi",                   short: "UoN",     emoji: "🔴", color: "#dc2626" },
  { id: "ku",         name: "Kenyatta University",                     short: "KU",      emoji: "🟢", color: "#16a34a" },
  { id: "mmust",      name: "Masinde Muliro University of Sci & Tech", short: "MMUST",   emoji: "🟠", color: "#ea580c" },
  { id: "moi",        name: "Moi University",                          short: "MOI",     emoji: "🟣", color: "#9333ea" },
  { id: "strathmore", name: "Strathmore University",                   short: "STRATH",  emoji: "⚫", color: "#374151" },
];

export default function Navbar() {
  const { user, currentCampus, toggleDarkMode, darkMode, isAdmin } = useAuth();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showMenu, setShowMenu]         = useState(false);
  const [notifCount, setNotifCount]     = useState(0);
  const [msgCount, setMsgCount]         = useState(0);
  const menuRef  = useRef(null);
  const navigate = useNavigate();

  const campus     = CAMPUSES.find((c) => c.id === currentCampus) || CAMPUSES[0];
  const totalBadge = notifCount + msgCount;

  useEffect(() => {
    if (!user) return;
    const fetch = () => {
      api.get("/notifications/unread/count").then((r) => setNotifCount(r.data.count)).catch(() => {});
      api.get("/messages/unread/count").then((r)     => setMsgCount(r.data.count)).catch(() => {});
    };
    fetch();
    const t = setInterval(fetch, 30000);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const Pill = ({ n }) => n > 0
    ? <span style={{ background: "#ef4444", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 800 }}>{n > 9 ? "9+" : n}</span>
    : null;

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--nav-bg)", backdropFilter: "blur(18px)",
        borderBottom: "1px solid var(--border)",
        left: 0, right: 0,
        padding: "7px 10px",
        display: "flex", alignItems: "center", gap: 6,
        boxSizing: "border-box",
        width: "100%",
      }}>
        {/* Logo */}
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
          <span className="syne gradient-text" style={{ fontWeight: 800, fontSize: 13, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
            CampusFlex
          </span>
        </button>

        <div style={{ flex: 1 }} />

        {/* Campus pill — always visible */}
        <button
          onClick={() => setShowSwitcher(true)}
          style={{ display: "flex", alignItems: "center", gap: 3, background: campus.color + "18", border: `1px solid ${campus.color}44`, borderRadius: 20, padding: "4px 8px", cursor: "pointer", color: campus.color, fontSize: 11, fontWeight: 700, flexShrink: 0, maxWidth: 100, overflow: "hidden" }}
        >
          <span>{campus.emoji}</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{campus.short}</span>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={campus.color} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* ── Logged-in controls ────────────────────────────────────────────── */}
        {user ? (
          <>
            {isAdmin && (
              <button onClick={() => navigate("/admin")} style={{ background: "var(--accent)", border: "none", borderRadius: 8, padding: "4px 7px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>🛡️</button>
            )}

            {/* ••• dropdown */}
            <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={() => setShowMenu((v) => !v)}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center", position: "relative" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                </svg>
                {totalBadge > 0 && (
                  <div style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 14, height: 14, fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bg)" }}>
                    {totalBadge > 9 ? "9+" : totalBadge}
                  </div>
                )}
              </button>

              {showMenu && (
                <div style={{ position: "fixed", top: 56, right: 10, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, width: 210, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden" }}>
                  <p style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Appearance</p>
                  <button onClick={() => { toggleDarkMode(); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", width: "100%", background: "none", border: "none", borderTop: "1px solid var(--border)", cursor: "pointer", fontSize: 13, color: "var(--text)" }}>
                    {darkMode
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                    }
                    <span style={{ flex: 1, textAlign: "left" }}>{darkMode ? "Light mode" : "Dark mode"}</span>
                  </button>

                  <p style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Activity</p>
                  <button onClick={() => { navigate("/messages"); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", width: "100%", background: "none", border: "none", borderTop: "1px solid var(--border)", cursor: "pointer", fontSize: 13, color: "var(--text)" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    <span style={{ flex: 1, textAlign: "left" }}>Messages</span>
                    <Pill n={msgCount} />
                  </button>
                  <button onClick={() => { navigate("/notifications"); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", width: "100%", background: "none", border: "none", borderTop: "1px solid var(--border)", cursor: "pointer", fontSize: 13, color: "var(--text)" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                    <span style={{ flex: 1, textAlign: "left" }}>Notifications</span>
                    <Pill n={notifCount} />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ── Guest controls — Login + Sign up ─────────────────────────────── */
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => navigate("/login")}
              style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 10px", color: "var(--text)", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
            >
              Log in
            </button>
            <button
              onClick={() => navigate("/signup")}
              style={{ background: "var(--accent)", border: "none", borderRadius: 8, padding: "5px 10px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
            >
              Sign up
            </button>
          </div>
        )}
      </nav>

      {showSwitcher && <CampusSwitcher onClose={() => setShowSwitcher(false)} />}
    </>
  );
}