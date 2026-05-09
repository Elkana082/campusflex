import { useAuth } from "../context/AuthContext";
import { CAMPUSES } from "./Navbar";

export default function CampusSwitcher({ onClose }) {
  const { currentCampus, user, switchCampus } = useAuth();

  const handleSwitch = (campusId) => {
    switchCampus(campusId);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "#00000066",
        zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "var(--surface)",
          borderRadius: "24px 24px 0 0",
          padding: "20px 16px 36px",
          border: "1px solid var(--border)",
        }}
      >
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 20px" }} />

        <h3 className="syne" style={{ fontWeight: 800, fontSize: 17, color: "var(--text)", marginBottom: 4 }}>
          Browse Campus Feeds
        </h3>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
          Tap any campus to explore their posts, stories and events.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {CAMPUSES.map((campus) => {
            const isHome   = campus.id === user?.campus;
            const isActive = campus.id === currentCampus;
            return (
              <button
                key={campus.id}
                onClick={() => handleSwitch(campus.id)}
                style={{
                  background: isActive ? campus.color + "18" : "var(--card)",
                  border: `2px solid ${isActive ? campus.color : "var(--border)"}`,
                  borderRadius: 14, padding: "12px 14px",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  gap: 12, textAlign: "left", transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 22 }}>{campus.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="syne" style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>
                      {campus.short}
                    </span>
                    {isHome && (
                      <span style={{
                        background: campus.color + "18", color: campus.color,
                        border: `1px solid ${campus.color}33`,
                        borderRadius: 20, padding: "1px 8px",
                        fontSize: 10, fontWeight: 700,
                      }}>🏠 Your Campus</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{campus.name}</div>
                </div>
                {isActive && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={campus.color} strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 12 4 10" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}