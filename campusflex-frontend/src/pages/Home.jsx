import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import StoryBar from "../components/StoryBar";
import PostCard from "../components/PostCard";
import toast from "react-hot-toast";
import { CAMPUSES } from "../components/Navbar";

const buildPostsUrl = (campus) =>
  campus && campus !== "undefined" && campus !== "null"
    ? `/posts?campus=${campus}&limit=20`
    : `/posts?limit=20`;

export default function Home() {
  const { currentCampus, isAdmin, user } = useAuth();
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState({ caption: "", tags: "", mentions: "" });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews]     = useState([]);

  const campus = CAMPUSES.find((c) => c.id === currentCampus);
  const isHome = currentCampus === user?.campus;

  const fetchPosts = useCallback(() => {
    if (!user) return;
    setLoading(true);
    api.get(buildPostsUrl(currentCampus))
      .then((r) => setPosts(r.data))
      .catch(() => toast.error("Could not load posts"))
      .finally(() => setLoading(false));
  }, [currentCampus, user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleFilesChange = (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;
    if (selected.length > 4) { toast.error("Maximum 4 files per post"); return; }
    const videos = selected.filter((f) => f.type.startsWith("video"));
    if (videos.length > 1) { toast.error("Maximum 1 video per post."); return; }
    setMediaFiles(selected);
    setPreviews(selected.map((f) => ({ url: URL.createObjectURL(f), type: f.type.startsWith("video") ? "video" : "image" })));
    e.target.value = "";
  };

  const removeFile = (i) => {
    setMediaFiles((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!mediaFiles.length) return toast.error("Please select at least one image or video");
    setUploading(true);
    try {
      const fd = new FormData();
      mediaFiles.forEach((f) => fd.append("media", f));
      if (form.caption)  fd.append("caption",  form.caption);
      if (form.tags)     fd.append("tags",      JSON.stringify(form.tags.split(",").map((t) => t.trim().replace("#", "")).filter(Boolean)));
      if (form.mentions) fd.append("mentions",  JSON.stringify(form.mentions.split(",").map((m) => m.trim().replace("@", "")).filter(Boolean)));
      const { data } = await api.post("/posts", fd);
      setPosts((prev) => [data, ...prev]);
      setShowForm(false);
      setForm({ caption: "", tags: "", mentions: "" });
      setMediaFiles([]); setPreviews([]);
      toast.success("Post published! 🎉");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish post");
    } finally { setUploading(false); }
  };

  const handleDelete = (postId) => setPosts((prev) => prev.filter((p) => p._id !== postId));

  return (
    <div style={{ paddingBottom: 16 }}>
      <StoryBar />

      {campus && (
        <div style={{ background: campus.color + "14", borderBottom: `1px solid ${campus.color}28`, padding: "9px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{campus.emoji}</span>
          <div style={{ flex: 1 }}>
            <div className="syne" style={{ fontWeight: 800, fontSize: 13, color: campus.color }}>{campus.short} Feed</div>
          </div>
          {!isHome && <span style={{ background: campus.color + "22", color: campus.color, border: `1px solid ${campus.color}33`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>Visiting</span>}
        </div>
      )}

      {isAdmin && isHome && (
        <div style={{ padding: "12px 12px 0" }}>
          <button onClick={() => setShowForm(!showForm)} style={{ width: "100%", background: showForm ? "var(--surface)" : "linear-gradient(135deg,var(--accent),var(--pink))", border: showForm ? "1.5px solid var(--border)" : "none", borderRadius: 14, padding: "12px", color: showForm ? "var(--muted)" : "#fff", cursor: "pointer", fontWeight: 800, fontSize: 14, fontFamily: "Syne" }}>
            {showForm ? "✕ Cancel" : "+ Post to Feed"}
          </button>

          {showForm && (
            <form onSubmit={handlePost} className="card" style={{ marginTop: 12, padding: 16 }}>
              <label style={{ display: "block", cursor: "pointer", marginBottom: 12 }}>
                <input type="file" accept="image/*,video/*" multiple style={{ display: "none" }} onChange={handleFilesChange} />
                {previews.length === 0 ? (
                  <div style={{ border: "2px dashed var(--border)", borderRadius: 14, padding: "28px 20px", textAlign: "center", color: "var(--muted)", background: "var(--surface)" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Tap to select images or video</div>
                    <div style={{ fontSize: 12 }}>Up to 4 images — or 1 video + up to 3 images</div>
                  </div>
                ) : (
                  <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: 8, scrollbarWidth: "none" }}>
                      {previews.map((p, i) => (
                        <div key={i} style={{ position: "relative", flexShrink: 0, width: 110, height: 110, borderRadius: 10, overflow: "hidden", background: "#000" }}>
                          {p.type === "video" ? <video src={p.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                          <button type="button" onClick={(e) => { e.preventDefault(); removeFile(i); }} style={{ position: "absolute", top: 4, right: 4, background: "#000000bb", border: "none", borderRadius: "50%", width: 22, height: 22, color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                        </div>
                      ))}
                    </div>
                    {previews.length < 4 && <div style={{ padding: 8, textAlign: "center", background: "var(--surface)", color: "var(--accent)", fontWeight: 700, fontSize: 13 }}>+ Add more ({previews.length}/4)</div>}
                  </div>
                )}
              </label>

              <textarea className="input" placeholder="Caption (optional)" rows={2} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} style={{ resize: "none", marginBottom: 10, borderRadius: 12 }} />
              <input className="input" placeholder="#tags separated by commas" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} style={{ marginBottom: 10 }} />
              <input className="input" placeholder="@mentions separated by commas" value={form.mentions} onChange={(e) => setForm({ ...form, mentions: e.target.value })} style={{ marginBottom: 12 }} />
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? "Publishing..." : `Publish${mediaFiles.length > 1 ? ` (${mediaFiles.length} files)` : ""}`}
              </button>
            </form>
          )}
        </div>
      )}

      <div style={{ padding: "12px 12px 0" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>Loading feed...
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div className="syne" style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No posts yet</div>
            <div style={{ fontSize: 13 }}>{isAdmin ? "Be the first to post!" : "Check back soon — your admin will post something!"}</div>
          </div>
        ) : (
          posts.map((p) => <PostCard key={p._id} post={p} onDelete={handleDelete} />)
        )}
      </div>
    </div>
  );
}