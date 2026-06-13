import { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import VerifiedBadge from "./VerifiedBadge";
import api from "../api/axios";
import toast from "react-hot-toast";

// ── VideoPlayer ───────────────────────────────────────────────────────────────
// onDimensions(w, h) — called once metadata loads so the carousel can size itself
function VideoPlayer({ src, onDimensions }) {
  const videoRef        = useRef(null);
  const playPromiseRef  = useRef(null);
  const [playing,  setPlaying ] = useState(false);
  const [muted,    setMuted   ] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const iconTimer              = useRef(null);

  // ── emit natural video dimensions once ready ────────────────────────────────
  const handleMeta = (e) => {
    const v = e.target;
    if (onDimensions && v.videoWidth && v.videoHeight) {
      onDimensions(v.videoWidth, v.videoHeight);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      video.currentTime = 0;
      video.muted = false;
      setMuted(false);
      const p = video.play();
      playPromiseRef.current = p;
      if (p !== undefined) {
        p.then(() => { setPlaying(true); playPromiseRef.current = null; })
         .catch(() => {
           video.muted = true; setMuted(true);
           const p2 = video.play();
           playPromiseRef.current = p2;
           if (p2 !== undefined) {
             p2.then(() => { setPlaying(true); playPromiseRef.current = null; })
               .catch(() => { playPromiseRef.current = null; });
           }
         });
      }
    };

    const tryPause = () => {
      const doPause = () => { video.pause(); video.currentTime = 0; setPlaying(false); playPromiseRef.current = null; };
      const pending = playPromiseRef.current;
      pending ? pending.finally(doPause) : doPause();
    };

    const observer = new IntersectionObserver(
      ([entry]) => { entry.intersectionRatio >= 0.5 ? tryPlay() : tryPause(); },
      { threshold: [0, 0.5] }
    );
    observer.observe(video);
    return () => { observer.disconnect(); video.pause(); video.currentTime = 0; setPlaying(false); };
  }, [src]);

  const handleTap = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    clearTimeout(iconTimer.current);
    setShowIcon(true);
    iconTimer.current = setTimeout(() => setShowIcon(false), 700);
    if (video.paused) {
      const p = video.play();
      if (p !== undefined) p.then(() => setPlaying(true)).catch(() => {});
    } else { video.pause(); setPlaying(false); }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted && video.paused) video.play().then(() => setPlaying(true)).catch(() => {});
  };

  return (
    <div onClick={handleTap} style={{ position: "relative", width: "100%", height: "100%", background: "#000", cursor: "pointer" }}>
      <video
        ref={videoRef}
        src={src}
        playsInline
        loop={false}
        onLoadedMetadata={handleMeta}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {showIcon && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: "50%", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {playing
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
            }
          </div>
        </div>
      )}
      {!playing && !showIcon && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", background: "rgba(0,0,0,0.18)" }}>
          <div style={{ background: "rgba(0,0,0,0.55)", borderRadius: "50%", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        </div>
      )}
      <button onClick={toggleMute} style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, zIndex: 5 }}>
        {muted ? "🔇" : "🔊"}
      </button>
    </div>
  );
}

// ── MediaCarousel ─────────────────────────────────────────────────────────────
// Dynamic height: measures the FIRST item's natural dimensions, calculates the
// right container height (capped at 4:5 portrait like Instagram), then uses
// that for every slide — so nothing is cropped and the card never goes full-screen.
function MediaCarousel({ mediaItems }) {
  const [current,     setCurrent    ] = useState(0);
  const [slideHeight, setSlideHeight] = useState(null); // null = loading
  const wrapperRef                   = useRef(null);
  const startXRef                    = useRef(null);

  // ── Compute height from natural w/h of the first media item ────────────────
  const computeHeight = useCallback((naturalW, naturalH) => {
    if (slideHeight) return; // set only once
    const containerW = wrapperRef.current?.offsetWidth || 390;
    const ratio      = naturalH / naturalW;
    // Instagram caps: 0.5625 (16:9 landscape) … 1.25 (4:5 portrait)
    const capped = Math.min(Math.max(ratio, 0.5), 1.25);
    setSlideHeight(Math.round(containerW * capped));
  }, [slideHeight]);

  const onImageLoad = (e) => {
    const img = e.target;
    computeHeight(img.naturalWidth, img.naturalHeight);
  };

  const onVideoDimensions = (w, h) => computeHeight(w, h);

  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, mediaItems.length - 1)), [mediaItems.length]);
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  const onTouchStart = (e) => { startXRef.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (startXRef.current === null) return;
    const diff = startXRef.current - e.changedTouches[0].clientX;
    if (diff > 40) next(); if (diff < -40) prev();
    startXRef.current = null;
  };

  // While waiting for first image to load, show a skeleton the same height as
  // a square (containerWidth × 1) so the layout doesn't jump too much.
  const h = slideHeight ?? (wrapperRef.current?.offsetWidth ?? 390);

  return (
    <div ref={wrapperRef} style={{ position: "relative", background: "#000", overflow: "hidden" }}>
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
              height: h,          // ← dynamic, not fixed pixels
              background: "#000",
              overflow: "hidden",
            }}
          >
            {item.type === "video"
              ? <VideoPlayer
                  src={item.url}
                  onDimensions={i === 0 ? onVideoDimensions : undefined}
                />
              : <img
                  src={item.url}
                  alt={`media-${i}`}
                  onLoad={i === 0 ? onImageLoad : undefined}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
            }
          </div>
        ))}
      </div>

      {/* Arrows */}
      {mediaItems.length > 1 && current > 0 && (
        <button onClick={prev} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "#00000077", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", zIndex: 2 }}>‹</button>
      )}
      {mediaItems.length > 1 && current < mediaItems.length - 1 && (
        <button onClick={next} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "#00000077", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", zIndex: 2 }}>›</button>
      )}
      {mediaItems.length > 1 && (
        <div style={{ position: "absolute", top: 10, right: 12, background: "#00000077", borderRadius: 20, padding: "2px 8px", fontSize: 10, color: "#fff", fontWeight: 700, backdropFilter: "blur(4px)", zIndex: 2 }}>
          {current + 1}/{mediaItems.length}
        </div>
      )}
      {mediaItems.length > 1 && (
        <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5, zIndex: 2 }}>
          {mediaItems.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? 14 : 5, height: 5, borderRadius: 3, background: i === current ? "#fff" : "#ffffff66", cursor: "pointer", transition: "width 0.2s" }} />
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
    { name: "TikTok",    bg: "#010101", emoji: "🎵", action: () => { navigator.clipboard.writeText(url); toast.success("Link copied!"); onClose(); } },
    { name: "Instagram", bg: "#C13584", emoji: "📸", action: () => { navigator.clipboard.writeText(text); toast.success("Caption copied!"); onClose(); } },
  ];

  const handleSave = async () => {
    const m = post.media?.[0] || { url: post.mediaUrl, type: post.mediaType };
    try {
      const blob = await (await fetch(m.url)).blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `campusflex-${post._id}.${m.type === "video" ? "mp4" : "jpg"}`;
      a.click(); onClose();
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
                ? <img src={app.icon} alt={app.name} style={{ width: 30, height: 30, objectFit: "contain", borderRadius: 8 }} />
                : <div style={{ width: 30, height: 30, borderRadius: 8, background: app.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{app.emoji}</div>
              }
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{app.name}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied!"); onClose(); }} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 8px", color: "var(--muted)", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>🔗 Copy link</button>
          <button onClick={handleSave} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 8px", color: "var(--muted)", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>⬇️ Save</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

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
    try { await api.delete(`/posts/${post._id}`); toast.success("Post deleted"); if (onDelete) onDelete(post._id); }
    catch { toast.error("Could not delete"); }
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
      setComments((prev) => [data, ...prev]); setCommentCount((c) => c + 1); setCommentText("");
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
      <div className="card" style={{ marginBottom: 14, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div onClick={() => goTo(author.username)} style={{ width: 40, height: 40, borderRadius: "50%", cursor: "pointer", background: author.profilePicture ? `url(${author.profilePicture}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#7c3aed", fontFamily: "Syne" }}>
              {!author.profilePicture && author.username?.[0]?.toUpperCase()}
            </div>
            {author.verified && <div style={{ position: "absolute", bottom: -2, right: -2, border: "2px solid var(--bg)", borderRadius: "50%", lineHeight: 0 }}><VerifiedBadge size={13} /></div>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              <span onClick={() => goTo(author.username)} className="syne" style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", cursor: "pointer" }}>{author.username}</span>
              {author.verified && <VerifiedBadge size={13} />}
              {(author.role === "admin" || author.role === "superadmin") && (
                <span style={{ background: "#ec489918", color: "var(--pink)", border: "1px solid #ec489933", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>Admin</span>
              )}
            </div>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>
              {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          {isAdmin && (
            <button onClick={handleDelete} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 5 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          )}
        </div>

        {/* Media */}
        {mediaItems.length > 0 && <MediaCarousel mediaItems={mediaItems} />}

        {/* Actions */}
        <div style={{ padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <button onClick={handleLike} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: liked ? "var(--pink)" : "var(--muted)", fontSize: 13, fontWeight: 700 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill={liked ? "var(--pink)" : "none"} stroke={liked ? "var(--pink)" : "var(--muted)"} strokeWidth="1.8" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              {likeCount.toLocaleString()}
            </button>
            <button onClick={handleToggleComments} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: showComments ? "var(--accent)" : "var(--muted)", fontSize: 13, fontWeight: 700 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={showComments ? "var(--accent)" : "var(--muted)"} strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              {loadingComments ? "..." : commentCount.toLocaleString()}
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={() => setSaved(!saved)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill={saved ? "var(--gold)" : "none"} stroke={saved ? "var(--gold)" : "var(--muted)"} strokeWidth="1.8" strokeLinecap="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            </button>
            <button onClick={() => setShowShare(true)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          </div>

          {post.caption && (
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text)", marginBottom: 5 }}>
              <span onClick={() => goTo(author.username)} style={{ fontWeight: 700, cursor: "pointer" }}>{author.username} </span>
              <span style={{ color: "var(--subtext)" }}>{post.caption}</span>
            </p>
          )}
          {post.tags?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>{post.tags.map((t) => <span key={t} style={{ color: "var(--accent)", fontSize: 12, fontWeight: 600 }}>#{t}</span>)}</div>}
          {post.mentions?.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{post.mentions.map((m) => <span key={m} onClick={() => goTo(m)} style={{ color: "var(--pink)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>@{m}</span>)}</div>}

          {showComments && (
            <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              {comments.length === 0 && <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, padding: "8px 0" }}>No comments yet. Be the first!</div>}
              {comments.map((cm) => {
                const canDelete = cm.author?._id === user?._id || isAdmin;
                return (
                  <div key={cm._id} style={{ display: "flex", gap: 7, marginBottom: 8, alignItems: "flex-start" }}>
                    <div onClick={() => goTo(cm.author?.username)} style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, cursor: "pointer", background: cm.author?.profilePicture ? `url(${cm.author.profilePicture}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#7c3aed" }}>
                      {!cm.author?.profilePicture && cm.author?.username?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "7px 11px", fontSize: 12 }}>
                        <span onClick={() => goTo(cm.author?.username)} style={{ fontWeight: 700, color: "var(--text)", marginRight: 5, cursor: "pointer" }}>{cm.author?.username}</span>
                        <span style={{ color: "var(--subtext)" }}>{cm.text}</span>
                      </div>
                      {canDelete && <button onClick={() => handleDeleteComment(cm._id, cm.author?._id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#ef4444", marginTop: 2, marginLeft: 5, fontWeight: 600, padding: 0 }}>Delete</button>}
                    </div>
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: 7, marginTop: 7, alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: user?.profilePicture ? `url(${user.profilePicture}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#7c3aed" }}>
                  {!user?.profilePicture && (user?.username?.[0]?.toUpperCase() || "?")}
                </div>
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  placeholder={user ? "Add a comment..." : "Login to comment..."}
                  onClick={() => { if (!user) needsLogin(navigate, "comment"); }}
                  readOnly={!user}
                  style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "7px 12px", color: "var(--text)", fontSize: 12, outline: "none", cursor: user ? "text" : "pointer" }}
                />
                <button onClick={submitComment} style={{ background: "var(--accent)", border: "none", borderRadius: 9, padding: "7px 12px", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>Post</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {showShare && <ShareModal post={post} author={author} onClose={() => setShowShare(false)} />}
    </>
  );
}