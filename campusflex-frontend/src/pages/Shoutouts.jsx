import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { CAMPUSES } from "../components/Navbar";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Shoutouts() {
  const { currentCampus, isAdmin } = useAuth();
  const [shoutouts, setShoutouts]   = useState([]);
  const [pending, setPending]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitted, setSubmitted]   = useState(false);
  const [form, setForm]             = useState({ toUsername: "", message: "" });
  const [sending, setSending]       = useState(false);
  const [showPending, setShowPending] = useState(false);

  const campus = CAMPUSES.find((c) => c.id === currentCampus);

  // Load approved shoutouts
  useEffect(() => {
    setLoading(true);
    api.get(`/shoutouts?campus=${currentCampus}`)
      .then((r) => setShoutouts(r.data))
      .catch(() => toast.error("Could not load shoutouts"))
      .finally(() => setLoading(false));
  }, [currentCampus]);

  // Load pending shoutouts for admin
  useEffect(() => {
    if (!isAdmin) return;
    api.get("/shoutouts/pending")
      .then((r) => setPending(r.data))
      .catch(() => {});
  }, [isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.toUsername.trim() || !form.message.trim())
      return toast.error("Please fill in both fields");
    setSending(true);
    try {
      await api.post("/shoutouts", form);
      setSubmitted(true);
      setForm({ toUsername: "", message: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send shoutout");
    } finally {
      setSending(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const { data } = await api.post(`/shoutouts/${id}/approve`);
      // Move from pending to live feed
      setPending((prev) => prev.filter((s) => s._id !== id));
      setShoutouts((prev) => [data.shoutout, ...prev]);
      toast.success("Shoutout approved and live ✅");
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleDelete = async (id, isPending = false) => {
    if (!window.confirm("Delete this shoutout?")) return;
    try {
      await api.delete(`/shoutouts/${id}`);
      if (isPending) {
        setPending((prev) => prev.filter((s) => s._id !== id));
      } else {
        setShoutouts((prev) => prev.filter((s) => s._id !== id));
      }
      toast.success("Shoutout deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="page" style={{ paddingTop: 14 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 11l19-9-9 19-2-8-8-2z"/>
          </svg>
          <h2 className="syne" style={{ fontWeight: 800, fontSize: 21, color: "var(--text)" }}>
            Anonymous Shoutouts
          </h2>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          Send a compliment anonymously. Admin reviews before it goes live.
        </p>
      </div>

      {/* Admin — pending shoutouts panel */}
      {isAdmin && pending.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16, border: "1px solid var(--gold)44" }}>
          <button
            onClick={() => setShowPending(!showPending)}
            style={{
              width: "100%", background: "none", border: "none",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer", padding: 0,
            }}
          >
            <span className="syne" style={{ fontWeight: 800, fontSize: 15, color: "var(--gold)" }}>
              ⏳ Pending Approval ({pending.length})
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round">
              <polyline points={showPending ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
            </svg>
          </button>

          {showPending && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {pending.map((s) => (
                <div key={s._id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                    <span style={{ background: "var(--pink)18", color: "var(--pink)", border: "1px solid var(--pink)33", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                      to @{s.toUsername}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}>
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--subtext)", lineHeight: 1.6, marginBottom: 10 }}>"{s.message}"</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleApprove(s._id)}
                      style={{
                        flex: 1, background: "var(--accent)", border: "none",
                        borderRadius: 10, padding: "8px", color: "#fff",
                        cursor: "pointer", fontWeight: 700, fontSize: 13,
                      }}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleDelete(s._id, true)}
                      style={{
                        flex: 1, background: "transparent", border: "1px solid #ef4444",
                        borderRadius: 10, padding: "8px", color: "#ef4444",
                        cursor: "pointer", fontWeight: 700, fontSize: 13,
                      }}
                    >
                      🗑 Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit form */}
      {!submitted ? (
        <form onSubmit={handleSubmit} className="card" style={{ padding: 16, marginBottom: 20 }}>
          <input
            className="input"
            placeholder="@username you're shouting out"
            value={form.toUsername}
            onChange={(e) => setForm({ ...form, toUsername: e.target.value.replace("@", "") })}
            style={{ marginBottom: 10 }}
          />
          <textarea
            className="input"
            placeholder="Write your shoutout... 💬"
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            style={{ resize: "none", marginBottom: 12, borderRadius: 12 }}
            maxLength={300}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Anonymously 💜"}
          </button>
        </form>
      ) : (
        <div
          className="card"
          style={{
            padding: 24, marginBottom: 20, textAlign: "center",
            background: "var(--pink)12", border: "1px solid var(--pink)33",
          }}
        >
          <div style={{ fontSize: 38, marginBottom: 8 }}>💜</div>
          <div className="syne" style={{ fontWeight: 800, fontSize: 16, color: "var(--text)", marginBottom: 4 }}>
            Shoutout Sent!
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
            Awaiting admin approval before going live.
          </div>
          <button
            onClick={() => setSubmitted(false)}
            className="btn-secondary"
            style={{ width: "auto", padding: "8px 20px", margin: "0 auto", display: "block" }}
          >
            Send Another
          </button>
        </div>
      )}

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>LIVE SHOUTOUTS</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      {/* Live shoutouts */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>Loading...</div>
      ) : shoutouts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 20px", color: "var(--muted)" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🤫</div>
          <div className="syne" style={{ fontWeight: 700 }}>No shoutouts yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Be the first to send one!</div>
        </div>
      ) : (
        shoutouts.map((s) => (
          <div key={s._id} className="card" style={{ padding: 15, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <span style={{
                background: "var(--pink)18", color: "var(--pink)",
                border: "1px solid var(--pink)33",
                borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700,
              }}>
                to @{s.toUsername}
              </span>
              {campus && (
                <span style={{
                  background: campus.color + "18", color: campus.color,
                  border: `1px solid ${campus.color}33`,
                  borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
                }}>
                  {campus.short}
                </span>
              )}
              <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}>Anonymous</span>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(s._id)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              )}
            </div>
            <p style={{ fontSize: 13, color: "var(--subtext)", lineHeight: 1.65 }}>"{s.message}"</p>
          </div>
        ))
      )}
    </div>
  );
}