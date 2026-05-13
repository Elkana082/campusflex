import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Main tabs — always visible
const NAV = [
  {
    path: "/", label: "Feed",
    icon: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>,
  },
  {
    path: "/explore", label: "Explore",
    icon: <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>,
  },
  {
    path: "/fit", label: "Fit",
    icon: <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z"/>,
  },
  {
    path: "/profile", label: "Me",
    icon: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  },
];

// Hidden behind "More" tray
const MORE_ITEMS = [
  {
    path: "/events", label: "Events", desc: "Campus events",
    icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  },
  {
    path: "/wall", label: "Wall", desc: "Shoutouts",
    icon: <path d="M3 11l19-9-9 19-2-8-8-2z"/>,
  },
  {
    path: "/news", label: "News", desc: "Latest updates",
    icon: <><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></>,
  },
];

const NavIcon = ({ icon, active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke={active ? "var(--accent)" : "var(--muted)"}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {icon}
  </svg>
);

const TrayIcon = ({ icon, active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke={active ? "var(--accent)" : "var(--text)"}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {icon}
  </svg>
);

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showTray, setShowTray] = useState(false);

  const isMoreActive = MORE_ITEMS.some((m) => m.path === location.pathname);

  const go = (path) => { setShowTray(false); navigate(path); };

  return (
    <>
      {/* More tray overlay */}
      {showTray && (
        <div
          onClick={() => setShowTray(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 98,
            display: "flex", alignItems: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              // ── KEY FIX: use left/right 0, no centering transforms ───────
              position: "fixed",
              bottom: 0, left: 0, right: 0,
              background: "var(--bg)",
              borderRadius: "20px 20px 0 0",
              borderTop: "1px solid var(--border)",
              padding: "14px 16px",
              // ── Safe area for iPhone home bar ────────────────────────────
              paddingBottom: "calc(80px + env(safe-area-inset-bottom))",
              zIndex: 99,
              boxSizing: "border-box",
            }}
          >
            {/* Handle bar */}
            <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 16px" }} />

            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, paddingLeft: 2 }}>
              Discover
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {MORE_ITEMS.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
                      background: active ? "var(--accent)18" : "var(--surface)",
                      border: active ? "1px solid var(--accent)44" : "1px solid var(--border)",
                      borderRadius: 16, padding: "16px 8px", cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    <TrayIcon icon={item.icon} active={active} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: active ? "var(--accent)" : "var(--text)" }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav style={{
        position: "fixed",
        // ── KEY FIX: left 0 / right 0 so it always fits the screen ─────────
        bottom: 0, left: 0, right: 0,
        zIndex: 100,
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "flex-start",
        padding: "7px 0",
        // Safe area padding for iPhone home indicator
        paddingBottom: "calc(7px + env(safe-area-inset-bottom))",
        boxSizing: "border-box",
      }}>
        {/* Main tabs */}
        {NAV.map((n) => {
          const active = location.pathname === n.path;
          return (
            <button
              key={n.path}
              onClick={() => go(n.path)}
              style={{
                flex: 1, background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "2px 0",
                minWidth: 0, // prevents flex children from overflowing
              }}
            >
              <div style={{
                background: active ? "var(--accent)18" : "transparent",
                borderRadius: 10, padding: "4px 10px",
                transition: "background 0.2s",
              }}>
                <NavIcon icon={n.icon} active={active} />
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.02em",
                color: active ? "var(--accent)" : "var(--muted)",
                whiteSpace: "nowrap", overflow: "hidden",
                maxWidth: "100%", textOverflow: "ellipsis",
              }}>
                {n.label}
              </span>
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setShowTray((v) => !v)}
          style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            padding: "2px 0",
            minWidth: 0,
          }}
        >
          <div style={{
            background: isMoreActive || showTray ? "var(--accent)18" : "transparent",
            borderRadius: 10, padding: "4px 10px",
            transition: "background 0.2s",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke={isMoreActive || showTray ? "var(--accent)" : "var(--muted)"}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5" cy="12" r="1.5"/>
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="19" cy="12" r="1.5"/>
            </svg>
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.02em",
            color: isMoreActive || showTray ? "var(--accent)" : "var(--muted)",
            whiteSpace: "nowrap",
          }}>
            More
          </span>
        </button>
      </nav>
    </>
  );
}