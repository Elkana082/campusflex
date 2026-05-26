import { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import VerifiedBadge from "./VerifiedBadge";
import api from "../api/axios";
import toast from "react-hot-toast";

// ── VideoPlayer ───────────────────────────────────────────────────────────────
// • Attempts to autoplay WITH sound on scroll-in (works after first user tap)
// • If browser blocks sound (fresh page load, no interaction yet) falls back
//   to muted silently — user can tap 🔊 to unmute
// • Always restarts from 0 each time it scrolls into view
function VideoPlayer({ src }) {
  const videoRef          = useRef(null);
  const [muted, setMuted] = useState(false); // optimistic: assume sound allowed

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          video.currentTime = 0;
          video.muted = false;   // ← try with sound first
          setMuted(false);

          video.play().catch(() => {
            // Browser blocked autoplay with sound — fall back to muted
            video.muted = true;
            setMuted(true);
            video.play().catch(() => {});
          });
        } else {
          video.pause();
          video.currentTime = 0;
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    return () => { if (video) { video.pause(); video.currentTime = 0; } };
  }, []);

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted && video.paused) video.play().catch(() => {});
  };

  return (
    // Wrapper fills the slide 100% — essential so video centres inside it
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#000" }}>
      <video
        ref={videoRef}
        src={src}
        playsInline
        loop={false}
        style={{
          // ── KEY FIX: fill the container, then objectFit centres the frame ──
          width: "100%",
          height: "100%",
          objectFit: "contain",   // full frame, symmetric letterbox
          display: "block",
        }}
      />
      {/* Mute toggle — bottom-right corner */}
      <button
        onClick={toggleMute}
        style={{
          position: "absolute", bottom: 10, right: 10,
          background: "rgba(0,0,0,0.55)", border: "none",
          borderRadius: "50%", width: 34, height: 34,
          color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, zIndex: 5,
        }}
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </div>
  );
}

// ── MediaCarousel ─────────────────────────────────────────────────────────────
function MediaCarousel({ mediaItems }) {
  const [current, setCurrent] = useState(0);
  const startXRef             = useRef(null);

  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, mediaItems.length - 1)), [mediaItems.length]);
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  const onTouchStart = (e) => { startXRef.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (startXRef.current === null) return;
    const diff = startXRef.current - e.changedTouches[0].clientX;
    if (diff > 40)  next();
    if (diff < -40) prev();
    startXRef.current = null;
  };

  return (
    <div style={{ position: "relative", background: "#000", overflow: "hidden" }}>
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          display: "flex",
          transform: `translateX(-${current * 100}%)`,
          transition: "transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      >
        {mediaItems.map((item, i) => (
          <div
            key={i}
            style={{
              minWidth: "100%",
              flexShrink: 0,
              aspectRatio: "1 / 1",   // consistent square slide height
              background: "#000",
              overflow: "hidden",
            }}
          >
            {item.type === "video"
              ? <VideoPlayer src={item.url} />
              : <img
                  src={item.url}
                  alt={`media-${i}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",   // full image, no crop
                    display: "block",
                  }}
                />
            }
          </div>
        ))}
      </div>

      {/* Arrows */}
      {mediaItems.length > 1 && current > 0 && (
        <button onClick={prev} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "#00000077", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", zIndex: 2 }}>‹</button>
      )}
      {mediaItems.length > 1 && current < mediaItems.length - 1 && (
        <button onClick={next} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "#00000077", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", zIndex: 2 }}>›</button>
      )}

      {/* Counter */}
      {mediaItems.length > 1 && (
        <div style={{ position: "absolute", top: 10, right: 12, background: "#00000077", borderRadius: 20, padding: "3px 9px", fontSize: 11, color: "#fff", fontWeight: 700, backdropFilter: "blur(4px)", zIndex: 2 }}>
          {current + 1}/{mediaItems.length}
        </div>
      )}

      {/* Dot indicators */}
      {mediaItems.length > 1 && (
        <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5, zIndex: 2 }}>
          {mediaItems.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? 16 : 6, height: 6, borderRadius: 3, background: i === current ? "#fff" : "#ffffff66", cursor: "pointer", transition: "width 0.2s" }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Share Modal ───────────────────────────────────────────────────────────────
function ShareModal({ post, author, onClose }) {
  const url  = `${window.location.origin}/post/${post._id}`;
  const text = `${post.caption ? post.caption + "\n\n" : ""}Check this out on CampusFlex 🔥 @${author.username}\n${url}`;
  const enc  = encodeURIComponent(text);

  const apps = [
    { name: "WhatsApp",  bg: "#25D366", icon: "https://cdn.cdnlogo.com/logos/w/14/whatsapp.svg",  action: () => window.open(`https://wa.me/?text=${enc}`, "_blank") },
    { name: "Telegram",  bg: "#229ED9", icon: "https://cdn.cdnlogo.com/logos/t/71/telegram.svg",  action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.caption || "CampusFlex")}`, "_blank") },
    { name: "Twitter/X", bg: "#000",    icon: "https://cdn.cdnlogo.com/logos/t/96/twitter-x.svg", action: () => window.open(`https://twitter.com/intent/tweet?text=${enc}`, "_blank") },
    { name: "Facebook",  bg: "#1877F2", icon: "https://cdn.cdnlogo.com/logos/f/83/facebook.svg",  action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank") },
    { name: "TikTok",    bg: "#010101", emoji: "🎵", action: () => { navigator.clipboard.writeText(url); toast.success("Link copied — paste into TikTok!"); onClose(); } },
    { name: "Instagram", bg: "#C13584", emoji: "📸", action: () => { navigator.clipboard.writeText(text); toast.success("Caption copied!"); onClose(); } },
  ];

  const handleSave = async () => {
    const firstMedia = post.media?.[0] || { url: post.mediaUrl, type: post.mediaType };
    try {
      const res  = await fetch(firstMedia.url);
      const blob = await res.blob();
      const a    = document.createElement("a");
      a.href     = URL.createObjectURL(blob);
      a.download = `campusflex-${post._id}.${firstMedia.type === "video" ? "mp4" : "jpg"}`;
      a.click();
      onClose();
    } catch { toast.error("Download failed"); }
  };

  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000077", zIndex: 99998, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "var(--surface)", borderRadius: "24px 24px 0 0", padding: "20px 16px 36px", border: "1px solid var(--border)" }}>
        <div style={{ width: 40, height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 18px" }} />
        <h3 className="syne" style={{ fontWeight: 800, fontSize: 16, color: "var(--text)", marginBottom: 4 }}>Share Post</h3>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 18 }}>Share @{author.username}'s post</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
          {apps.map((app) => (
            <button key={app.name} onClick={app.action} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
              {app.icon
                ? <img src={app.icon} alt={app.name} style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 8 }} />
                : <div style={{ width: 32, height: 32, borderRadius: 8, background: app.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{app.emoji}</div>
              }
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{app.name}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied!"); onClose(); }} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 8px", color: "var(--muted)", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>🔗 Copy link</button>
          <button onClick={handleSave} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 8px", color: "var(--muted)", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>⬇️ Save</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Reusable login prompt helper ──────────────────────────────────────────────
const needsLogin = (navigate, action) => {
  toast(`Login to ${action}`, { icon: "🔒" });
  setTimeout(() => navigate("/login"), 800);
};

// ── PostCard ──────────────────────────────────────────────────────────────────
export default function PostCard({ post, onDelete }) {
  const { user, isAdmin }               = useAuth();
  const navigate                        = useNavigate();
  const [liked, setLiked]               = useState(post.likes?.includes(user?._id));
  const [likeCount, setLikeCount]       = useState(post.likes?.length || 0);
  const [saved, setSaved]               = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]         = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentText, setCommentText]   = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [showShare, setShowShare]       = useState(false);

  const author     = post.author || {};
  const mediaItems = post.media?.length
    ? post.media
    : post.mediaUrl ? [{ url: post.mediaUrl, type: post.mediaType || "image" }] : [];

  const goTo = (username) => { if (username) navigate(`/profile/${username}`); };

  const handleLike = async () => {
    if (!user) return needsLogin(navigate, "like posts");
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      setLiked(data.liked); setLikeCount(data.likeCount);
    } catch { toast.error("Could not like post"); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success("Post deleted");
      if (onDelete) onDelete(post._id);
    } catch { toast.error("Could not delete"); }
  };

  const handleToggleComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setLoadingComments(true);
    try {
      const { data } = await api.get(`/posts/${post._id}/comments`);
      setComments(data); setCommentCount(data.length); setShowComments(true);
    } catch { toast.error("Could not load comments"); }
    finally { setLoadingComments(false); }
  };

  const submitComment = async () => {
    if (!user) return needsLogin(navigate, "comment");
    if (!commentText.trim()) return;
    try {
      const { data } = await api.post(`/posts/${post._id}/comments`, { text: commentText });
      setComments((prev) => [data, ...prev]);
      setCommentCount((c) => c + 1);
      setCommentText("");
    } catch { toast.error("Could not post comment"); }
  };

  const handleDeleteComment = async (commentId, authorId) => {
    if (authorId !== user?._id && !isAdmin) return;
    if (!window.confirm("Delete this comment?")) return;
    try {
      await api.delete(`/posts/${post._id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentCount((c) => Math.max(0, c - 1));
    } catch { toast.error("Could not delete comment"); }
  };

  return (
    <>
      <div className="card" style={{ marginBottom: 18, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 15px" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div onClick={() => goTo(author.username)} style={{ width: 42, height: 42, borderRadius: "50%", cursor: "pointer", background: author.profilePicture ? `url(${author.profilePicture}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#7c3aed", fontFamily: "Syne" }}>
              {!author.profilePicture && author.username?.[0]?.toUpperCase()}
            </div>
            {author.verified && <div style={{ position: "absolute", bottom: -2, right: -2, border: "2px solid var(--bg)", borderRadius: "50%", lineHeight: 0 }}><VerifiedBadge size={14} /></div>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              <span onClick={() => goTo(author.username)} className="syne" style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", cursor: "pointer" }}>{author.username}</span>
              {author.verified && <VerifiedBadge size={14} />}
              {(author.role === "admin" || author.role === "superadmin") && (
                <span style={{ background: "#ec489918", color: "var(--pink)", border: "1px solid #ec489933", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>Admin</span>
              )}
            </div>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          {isAdmin && (
            <button onClick={handleDelete} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          )}
        </div>

        {/* Media */}
        {mediaItems.length > 0 && <MediaCarousel mediaItems={mediaItems} />}

        {/* Actions */}
        <div style={{ padding: "12px 15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
            <button onClick={handleLike} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: liked ? "var(--pink)" : "var(--muted)", fontSize: 13, fontWeight: 700 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? "var(--pink)" : "none"} stroke={liked ? "var(--pink)" : "var(--muted)"} strokeWidth="1.8" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              {likeCount.toLocaleString()}
            </button>
            <button onClick={handleToggleComments} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: showComments ? "var(--accent)" : "var(--muted)", fontSize: 13, fontWeight: 700 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={showComments ? "var(--accent)" : "var(--muted)"} strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              {loadingComments ? "..." : commentCount.toLocaleString()}
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={() => setSaved(!saved)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={saved ? "var(--gold)" : "none"} stroke={saved ? "var(--gold)" : "var(--muted)"} strokeWidth="1.8" strokeLinecap="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            </button>
            <button onClick={() => setShowShare(true)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          </div>

          {post.caption && (
            <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text)", marginBottom: 6 }}>
              <span onClick={() => goTo(author.username)} style={{ fontWeight: 700, cursor: "pointer" }}>{author.username} </span>
              <span style={{ color: "var(--subtext)" }}>{post.caption}</span>
            </p>
          )}
          {post.tags?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 5 }}>{post.tags.map((t) => <span key={t} style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600 }}>#{t}</span>)}</div>}
          {post.mentions?.length > 0 && <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{post.mentions.map((m) => <span key={m} onClick={() => goTo(m)} style={{ color: "var(--pink)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>@{m}</span>)}</div>}

          {/* Comments section */}
          {showComments && (
            <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              {comments.length === 0 && <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: "10px 0" }}>No comments yet. Be the first!</div>}
              {comments.map((cm) => {
                const canDelete = cm.author?._id === user?._id || isAdmin;
                return (
                  <div key={cm._id} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
                    <div onClick={() => goTo(cm.author?.username)} style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, cursor: "pointer", background: cm.author?.profilePicture ? `url(${cm.author.profilePicture}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#7c3aed" }}>
                      {!cm.author?.profilePicture && cm.author?.username?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "8px 13px", fontSize: 13 }}>
                        <span onClick={() => goTo(cm.author?.username)} style={{ fontWeight: 700, color: "var(--text)", marginRight: 6, cursor: "pointer" }}>{cm.author?.username}</span>
                        <span style={{ color: "var(--subtext)" }}>{cm.text}</span>
                      </div>
                      {canDelete && <button onClick={() => handleDeleteComment(cm._id, cm.author?._id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#ef4444", marginTop: 3, marginLeft: 6, fontWeight: 600, padding: 0 }}>Delete</button>}
                    </div>
                  </div>
                );
              })}
              {/* Comment input */}
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: user?.profilePicture ? `url(${user.profilePicture}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#7c3aed" }}>
                  {!user?.profilePicture && (user?.username?.[0]?.toUpperCase() || "?")}
                </div>
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  placeholder={user ? "Add a comment..." : "Login to comment..."}
                  onClick={() => { if (!user) needsLogin(navigate, "comment"); }}
                  readOnly={!user}
                  style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "8px 14px", color: "var(--text)", fontSize: 13, outline: "none", cursor: user ? "text" : "pointer" }}
                />
                <button onClick={submitComment} style={{ background: "var(--accent)", border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>Post</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {showShare && <ShareModal post={post} author={author} onClose={() => setShowShare(false)} />}
    </>
  );
}