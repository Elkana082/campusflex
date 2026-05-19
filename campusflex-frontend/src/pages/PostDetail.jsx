import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import PostCard from "../components/PostCard";
import toast from "react-hot-toast";

export default function PostDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [post, setPost]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/posts/${id}`)
      .then((r) => setPost(r.data))
      .catch(() => { toast.error("Post not found"); navigate(-1); })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      {/* Back header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "var(--nav-bg)", backdropFilter: "blur(18px)",
        borderBottom: "1px solid var(--border)",
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", padding: 4 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="syne" style={{ fontWeight: 800, fontSize: 16, color: "var(--text)" }}>Post</span>
      </div>

      <div style={{ padding: "8px 0 90px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            Loading post...
          </div>
        ) : post ? (
          <PostCard post={post} />
        ) : null}
      </div>
    </div>
  );
}