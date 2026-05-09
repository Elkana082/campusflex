import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VerifiedBadge from "../components/VerifiedBadge";
import api from "../api/axios";
import toast from "react-hot-toast";

const TYPE_META = {
  like:              { emoji: "❤️",  label: "liked your post" },
  comment:           { emoji: "💬",  label: "commented on your post" },
  message:           { emoji: "✉️",  label: "sent you a message" },
  feature_approved:  { emoji: "✨",  label: "Feature request approved!" },
  feature_rejected:  { emoji: "📋",  label: "Feature request reviewed" },
  fit_approved:      { emoji: "🔥",  label: "Outfit approved for rating!" },
  fit_rejected:      { emoji: "👗",  label: "Outfit submission reviewed" },
  shoutout_approved: { emoji: "📣",  label: "A shoutout about you went live" },
};

export default function Notifications() {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  useEffect(() => {
    api.get("/notifications")
      .then((r) => setNotifs(r.data))
      .catch(() => toast.error("Could not load notifications"))
      .finally(() => setLoading(false));

    // Mark all as read when page opens
    api.put("/notifications/read-all").catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifs((prev) => prev.filter((n) => n._id !== id));
    } catch { /* silent */ }
  };

  const handleNotifPress = (notif) => {
    if (notif.type === "message" && notif.sender) {
      navigate(`/messages/${notif.sender._id}?username=${notif.sender.username}`);
    } else if (notif.type === "like" || notif.type === "comment") {
      navigate("/");
    } else if (notif.sender?.username) {
      navigate(`/profile/${notif.sender.username}`);
    }
  };

  const meta    = (type) => TYPE_META[type] || { emoji: "🔔", label: "notification" };
  const initial = (user) => user?.username?.[0]?.toUpperCase() || "?";

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, background: "var(--nav-bg)", backdropFilter: "blur(18px)", borderBottom: "1px solid var(--border)", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 className="syne" style={{ fontWeight: 800, fontSize: 20, color: "var(--text)" }}>Notifications</h2>
        {notifs.length > 0 && (
          <button
            onClick={async () => {
              try {
                await Promise.all(notifs.map((n) => api.delete(`/notifications/${n._id}`)));
                setNotifs([]);
                toast.success("All cleared");
              } catch { /* silent */ }
            }}
            style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            Clear all
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>Loading...</div>
      ) : notifs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
          <div className="syne" style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>You're all caught up</div>
          <div style={{ fontSize: 13 }}>Likes, comments, messages and feature updates will appear here.</div>
        </div>
      ) : (
        <div>
          {notifs.map((n) => {
            const m    = meta(n.type);
            const unread = !n.read;
            return (
              <div
                key={n._id}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--border)", background: unread ? "var(--accent)08" : "transparent", cursor: "pointer" }}
                onClick={() => handleNotifPress(n)}
              >
                {/* Avatar or emoji */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {n.sender ? (
                    <>
                      <div style={{ width: 46, height: 46, borderRadius: "50%", background: n.sender.profilePicture ? `url(${n.sender.profilePicture}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#7c3aed" }}>
                        {!n.sender.profilePicture && initial(n.sender)}
                      </div>
                      {n.sender.verified && <div style={{ position: "absolute", bottom: -2, right: -2, border: "2px solid var(--bg)", borderRadius: "50%" }}><VerifiedBadge size={13} /></div>}
                      <div style={{ position: "absolute", bottom: -4, right: -4, fontSize: 16, lineHeight: 1 }}>{m.emoji}</div>
                    </>
                  ) : (
                    <div style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--accent)18", border: "1px solid var(--accent)33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                      {m.emoji}
                    </div>
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>
                    {n.sender && <span style={{ fontWeight: 700 }}>@{n.sender.username} </span>}
                    <span style={{ color: n.sender ? "var(--subtext)" : "var(--text)", fontWeight: n.sender ? 400 : 600 }}>
                      {n.text || m.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                    {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                {/* Post thumbnail */}
                {n.post?.mediaUrl && (
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--border)", overflow: "hidden", flexShrink: 0 }}>
                    {n.post.mediaType === "video"
                      ? <video src={n.post.mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <img src={n.post.mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    }
                  </div>
                )}

                {/* Unread dot */}
                {unread && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                )}

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--muted)", flexShrink: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}