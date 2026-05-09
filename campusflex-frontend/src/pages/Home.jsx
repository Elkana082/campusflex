import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import StoryBar from "../components/StoryBar";
import PostCard from "../components/PostCard";
import toast from "react-hot-toast";
import { CAMPUSES } from "../components/Navbar";

export default function Home() {
  const { currentCampus, isAdmin, user } = useAuth();
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ caption: "", tags: "", mentions: "" });
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const campus  = CAMPUSES.find((c) => c.id === currentCampus);
  const isHome  = currentCampus === user?.campus;

  const fetchPosts = useCallback(() => {
    api.get(`/posts?campus=${currentCampus}&limit=20`)
      .then((r) => setPosts(r.data))
      .catch(() => toast.error("Could not load posts"))
      .finally(() => setLoading(false));
  }, [currentCampus]);

  useEffect(() => {
    setLoading(true);
    fetchPosts();
  }, [fetchPosts]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!mediaFile) return toast.error("Please select an image or video");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("media", mediaFile);
      if (form.caption)  fd.append("caption", form.caption);
      if (form.tags)     fd.append("tags", JSON.stringify(form.tags.split(",").map((t) => t.trim().replace("#", "")).filter(Boolean)));
      if (form.mentions) fd.append("mentions", JSON.stringify(form.mentions.split(",").map((m) => m.trim().replace("@", "")).filter(Boolean)));
      const { data } = await api.post("/posts", fd);
      setPosts((prev) => [data, ...prev]);
      setShowForm(false);
      setForm({ caption: "", tags: "", mentions: "" });
      setMediaFile(null);
      setMediaPreview(null);
      toast.success("Post published! 🎉");
    } catch {
      toast.error("Failed to publish post");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  return (
    <div style={{ paddingBottom: 90 }}>
      <StoryBar />

      {/* Campus banner */}
      {campus && (
        <div style={{ background: campus.color + "14", borderBottom: `1px solid ${campus.color}28`, padding: "9px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{campus.emoji}</span>
          <div style={{ flex: 1 }}>
            <div className="syne" style={{ fontWeight: 800, fontSize: 13, color: campus.color }}>{campus.short} Feed</div>
          </div>
          {!isHome && (
            <span style={{ background: campus.color + "22", color: campus.color, border: `1px solid ${campus.color}33`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
              Visiting
            </span>
          )}
        </div>
      )}

      {/* Admin post form */}
      {isAdmin && isHome && (
        <div style={{ padding: "12px 12px 0" }}>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ width: "100%", background: showForm ? "var(--surface)" : "linear-gradient(135deg,var(--accent),var(--pink))", border: showForm ? "1.5px solid var(--border)" : "none", borderRadius: 14, padding: "12px", color: showForm ? "var(--muted)" : "#fff", cursor: "pointer", fontWeight: 800, fontSize: 14, fontFamily: "Syne" }}
          >
            {showForm ? "✕ Cancel" : "+ Post to Feed"}
          </button>

          {showForm && (
            <form onSubmit={handlePost} className="card" style={{ marginTop: 12, padding: 16 }}>
              <label style={{ display: "block", cursor: "pointer", marginBottom: 12 }}>
                <input type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileChange} />
                {mediaPreview ? (
                  <div style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "1/1", background: "var(--border)", position: "relative" }}>
                    {mediaFile?.type.startsWith("video")
                      ? <video src={mediaPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <img src={mediaPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="preview" />
                    }
                    <div style={{ position: "absolute", bottom: 10, right: 10, background: "var(--accent)", borderRadius: 10, padding: "5px 12px", color: "#fff", fontSize: 12, fontWeight: 700 }}>Change</div>
                  </div>
                ) : (
                  <div style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: "30px", textAlign: "center", color: "var(--muted)", background: "var(--surface)" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Tap to select image or video</div>
                  </div>
                )}
              </label>

              <textarea
                className="input"
                placeholder="Caption (optional)"
                rows={2}
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                style={{ resize: "none", marginBottom: 10, borderRadius: 12 }}
              />
              <input
                className="input"
                placeholder="#tags separated by commas (optional)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                style={{ marginBottom: 10 }}
              />
              <input
                className="input"
                placeholder="@mentions separated by commas (optional)"
                value={form.mentions}
                onChange={(e) => setForm({ ...form, mentions: e.target.value })}
                style={{ marginBottom: 12 }}
              />
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? "Publishing..." : "Publish Post"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Feed */}
      <div style={{ padding: "12px 12px 0" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            Loading feed...
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div className="syne" style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No posts yet</div>
            <div style={{ fontSize: 13 }}>
              {isAdmin ? "Be the first to post something for your campus!" : "Check back soon — your admin will post something!"}
            </div>
          </div>
        ) : (
          posts.map((p) => <PostCard key={p._id} post={p} onDelete={handleDelete} />)
        )}
      </div>
    </div>
  );
}