import { useLocation, useNavigate } from "react-router-dom";

const NAV = [
  { path: "/",       label: "Feed",    icon: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/> },
  { path: "/explore",label: "Explore", icon: <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></> },
  { path: "/fit",    label: "Fit",     icon: <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z"/> },
  { path: "/events", label: "Events",  icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
  { path: "/news",   label: "News",    icon: <><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></> },
  { path: "/wall",   label: "Wall",    icon: <path d="M3 11l19-9-9 19-2-8-8-2z"/> },
  { path: "/profile",label: "Profile", icon: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 480, zIndex: 100,
      background: "var(--nav-bg)", backdropFilter: "blur(20px)",
      borderTop: "1px solid var(--border)",
      display: "flex", padding: "7px 0 11px",
    }}>
      {NAV.map((n) => {
        const active = location.pathname === n.path;
        return (
          <button
            key={n.path}
            onClick={() => navigate(n.path)}
            style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: active ? "var(--accent)" : "var(--muted)",
              transition: "color 0.2s",
            }}
          >
            <div style={{
              background: active ? "var(--accent)18" : "transparent",
              borderRadius: 10, padding: "4px 8px", transition: "background 0.2s",
            }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                stroke={active ? "var(--accent)" : "var(--muted)"}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {n.icon}
              </svg>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.03em" }}>{n.label}</span>
          </button>
        );
      })}
    </nav>
  );
}