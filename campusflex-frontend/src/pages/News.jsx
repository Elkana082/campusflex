import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { CAMPUSES } from "../components/Navbar";
import VerifiedBadge from "../components/VerifiedBadge";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function News() {
  const { currentCampus, isAdmin } = useAuth();
  const [articles, setArticles]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [mediaFile, setMediaFile]     = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [caption, setCaption]         = useState("");
  const [posting, setPosting]         = useState(false);

  const campus = CAMPUSES.find((c) => c.id === currentCampus);

  useEffect(() => {
    setLoading(true);
    api.get(`/news?campus=${currentCampus}`)
      .then((r) => setArticles(r.data))
      .catch(() => toast.error("Could not load news"))
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
      const { data } = await api.post("/news", fd);
      setArticles((prev) => [data, ...prev]);
      setShowForm(false);
      setMediaFile(null);
      setMediaPreview(null);
      setCaption("");
      toast.success("News posted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this news post?")) return;
    try {
      await api.delete(`/news/${id}`);
      setArticles((prev) => prev.filter((a) => a._id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="page" style={{ paddingTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 className="syne" style={{ fontWeight: 800, fontSize: 20, color: "var(--text)" }}>Campus News</h2>
          {campus && <div style={{ fontSize: 12, color: campus.color, fontWeight: 700 }}>{campus.emoji} {campus.short}</div>}
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} style={{ background: showForm ? "var(--surface)" : "var(--accent)", border: `1px solid ${showForm ? "var(--border)" : "var(--accent)"}`, borderRadius: 12, padding: "8px 14px", color: showForm ? "var(--muted)" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            {showForm ? "✕ Cancel" : "+ Post News"}
          </button>
        )}
      </div>

      {/* Post form */}
      {isAdmin && showForm && (
        <form onSubmit={handlePost} className="card" style={{ padding: 16, marginBottom: 16 }}>
          <label style={{ display: "block", cursor: "pointer", marginBottom: 12 }}>
            <input type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileChange} />
            {mediaPreview ? (
              <div style={{ borderRadius: 14, overflow: "hidden", aspectRatio: "1/1", background: "var(--border)", position: "relative" }}>
                {mediaFile?.type.startsWith("video") ? <video src={mediaPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <img src={mediaPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                <div style={{ position: "absolute", bottom: 10, right: 10, background: "var(--accent)", borderRadius: 10, padding: "5px 12px", color: "#fff", fontSize: 12, fontWeight: 700 }}>Change</div>
              </div>
            ) : (
              <div style={{ border: "2px dashed var(--border)", borderRadius: 14, padding: "36px 20px", textAlign: "center", color: "var(--muted)", background: "var(--surface)" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📰</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Tap to select image or video</div>
              </div>
            )}
          </label>
          <textarea className="input" placeholder="Caption..." rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} style={{ resize: "none", marginBottom: 12, borderRadius: 12 }} />
          <button type="submit" className="btn-primary" disabled={posting}>{posting ? "Posting..." : "Post News"}</button>
        </form>
      )}

      {/* Feed */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Loading...</div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📰</div>
          <div className="syne" style={{ fontWeight: 700 }}>No news yet</div>
        </div>
      ) : articles.map((n) => {
        const author = n.author || {};
        const initial = author.username?.[0]?.toUpperCase() || "?";
        return (
          <div key={n._id} className="card" style={{ marginBottom: 18, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 15px" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: author.profilePicture ? `url(${author.profilePicture}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#7c3aed" }}>
                  {!author.profilePicture && initial}
                </div>
                {author.verified && <div style={{ position: "absolute", bottom: -2, right: -2, border: "2px solid var(--bg)", borderRadius: "50%" }}><VerifiedBadge size={13} /></div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span className="syne" style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{author.username}</span>
                  {author.verified && <VerifiedBadge size={13} />}
                  <span style={{ background: "#ec489918", color: "var(--pink)", border: "1px solid #ec489933", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>News</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(n._id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              )}
            </div>
            <div style={{ width: "100%", aspectRatio: "1/1", maxHeight: 420, background: "var(--border)", overflow: "hidden" }}>
              {n.mediaType === "video" ? <video src={n.mediaUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <img src={n.mediaUrl} alt="news" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            {n.caption && (
              <div style={{ padding: "12px 15px" }}>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text)" }}>
                  <span style={{ fontWeight: 700 }}>{author.username} </span>
                  <span style={{ color: "var(--subtext)" }}>{n.caption}</span>
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}