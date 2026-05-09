import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { CAMPUSES } from "../components/Navbar";
import VerifiedBadge from "../components/VerifiedBadge";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Events() {
  const { currentCampus, isAdmin } = useAuth();
  const [events, setEvents]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [mediaFile, setMediaFile]     = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [caption, setCaption]         = useState("");
  const [posting, setPosting]         = useState(false);

  const campus = CAMPUSES.find((c) => c.id === currentCampus);

  useEffect(() => {
    setLoading(true);
    api.get(`/events?campus=${currentCampus}`)
      .then((r) => setEvents(r.data))
      .catch(() => toast.error("Could not load events"))
      .finally(() => setLoading(false));
  }, [currentCampus]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!mediaFile) return toast.error("Please select an image or video");
    setPosting(true);
    try {
      const fd = new FormData();
      fd.append("media", mediaFile);
      if (caption) fd.append("caption", caption);
      const { data } = await api.post("/events", fd);
      setEvents((prev) => [data, ...prev]);
      setShowForm(false);
      setMediaFile(null);
      setMediaPreview(null);
      setCaption("");
      toast.success("Event posted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      setEvents((prev) => prev.filter((e) => e._id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="page" style={{ paddingTop: 14 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 className="syne" style={{ fontWeight: 800, fontSize: 20, color: "var(--text)" }}>Campus Events</h2>
          {campus && <div style={{ fontSize: 12, color: campus.color, fontWeight: 700 }}>{campus.emoji} {campus.short}</div>}
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} style={{ background: showForm ? "var(--surface)" : "var(--accent)", border: `1px solid ${showForm ? "var(--border)" : "var(--accent)"}`, borderRadius: 12, padding: "8px 14px", color: showForm ? "var(--muted)" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            {showForm ? "✕ Cancel" : "+ Post Event"}
          </button>
        )}
      </div>

      {/* Post form — admin only */}
      {isAdmin && showForm && (
        <form onSubmit={handlePost} className="card" style={{ padding: 16, marginBottom: 16 }}>
          <label style={{ display: "block", cursor: "pointer", marginBottom: 12 }}>
            <input type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileChange} />
            {mediaPreview ? (
              <div style={{ borderRadius: 14, overflow: "hidden", aspectRatio: "1/1", background: "var(--border)", position: "relative" }}>
                {mediaFile?.type.startsWith("video")
                  ? <video src={mediaPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <img src={mediaPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                }
                <div style={{ position: "absolute", bottom: 10, right: 10, background: "var(--accent)", borderRadius: 10, padding: "5px 12px", color: "#fff", fontSize: 12, fontWeight: 700 }}>Change</div>
              </div>
            ) : (
              <div style={{ border: "2px dashed var(--border)", borderRadius: 14, padding: "36px 20px", textAlign: "center", color: "var(--muted)", background: "var(--surface)" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Tap to select image or video</div>
                <div style={{ fontSize: 12 }}>For your event post</div>
              </div>
            )}
          </label>
          <textarea className="input" placeholder="Caption / event description..." rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} style={{ resize: "none", marginBottom: 12, borderRadius: 12 }} />
          <button type="submit" className="btn-primary" disabled={posting}>{posting ? "Posting..." : "Post Event"}</button>
        </form>
      )}

      {/* Events feed */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Loading...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
          <div className="syne" style={{ fontWeight: 700 }}>No events yet</div>
        </div>
      ) : events.map((ev) => {
        const author  = ev.author || {};
        const initial = author.username?.[0]?.toUpperCase() || "?";
        return (
          <div key={ev._id} className="card" style={{ marginBottom: 18, overflow: "hidden" }}>
            {/* Author row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 15px" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: author.profilePicture ? `url(${author.profilePicture}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#7c3aed" }}>
                  {!author.profilePicture && initial}
                </div>
                {author.verified && (
                  <div style={{ position: "absolute", bottom: -2, right: -2, border: "2px solid var(--bg)", borderRadius: "50%" }}>
                    <VerifiedBadge size={13} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span className="syne" style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{author.username}</span>
                  {author.verified && <VerifiedBadge size={13} />}
                  <span style={{ background: "var(--accent)18", color: "var(--accent)", border: "1px solid var(--accent)33", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>Event</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                  {new Date(ev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(ev._id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Media */}
            <div style={{ width: "100%", aspectRatio: "1/1", maxHeight: 420, background: "var(--border)", overflow: "hidden" }}>
              {ev.mediaType === "video"
                ? <video src={ev.mediaUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <img src={ev.mediaUrl} alt="event" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              }
            </div>

            {/* Caption */}
            {ev.caption && (
              <div style={{ padding: "12px 15px" }}>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text)" }}>
                  <span style={{ fontWeight: 700 }}>{author.username} </span>
                  <span style={{ color: "var(--subtext)" }}>{ev.caption}</span>
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}