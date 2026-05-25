import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import VerifiedBadge from "./VerifiedBadge";
import api from "../api/axios";
import toast from "react-hot-toast";

const needsLogin = (navigate, action) => {
  toast(`Login to ${action}`, { icon: "🔒" });
  setTimeout(() => navigate("/login"), 800);
};

export default function StoryBar() {
  const { currentCampus, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories]               = useState([]);
  const [viewing, setViewing]               = useState(null);
  const [uploading, setUploading]           = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [replyText, setReplyText]           = useState("");
  const [showReplies, setShowReplies]       = useState(false);
  const [isSending, setIsSending]           = useState(false);
  const timerRef = useRef(null);

  const safeCampus = currentCampus && currentCampus !== "undefined" && currentCampus !== "null"
    ? currentCampus : null;

  useEffect(() => {
    const url = safeCampus ? `/stories?campus=${safeCampus}` : "/stories";
    api.get(url).then((r) => setStories(r.data)).catch(() => {});
  }, [currentCampus]);

  useEffect(() => {
    if (!viewing || viewing.mediaType === "video") return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => goNext(), 6000);
    return () => clearTimeout(timerRef.current);
  }, [viewing]);

  const openStory   = (story) => { setViewing(story); setReplyText(""); setShowReplies(false); };
  const closeViewer = () => { clearTimeout(timerRef.current); setViewing(null); };

  const goNext = () => {
    const idx = stories.findIndex((s) => s._id === viewing?._id);
    if (idx < stories.length - 1) openStory(stories[idx + 1]);
    else closeViewer();
  };
  const goPrev = () => {
    const idx = stories.findIndex((s) => s._id === viewing?._id);
    if (idx > 0) openStory(stories[idx - 1]);
  };

  const handleProfileRedirect = (e, username) => {
    e.stopPropagation();
    closeViewer();
    navigate(`/profile/${username}`);
  };

  // ── Like — requires login ───────────────────────────────────────────────────
  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return needsLogin(navigate, "like stories");
    if (!viewing) return;
    try {
      const { data } = await api.post(`/stories/${viewing._id}/like`);
      const updated  = { ...viewing, likeCount: data.likeCount, userLiked: data.liked };
      setViewing(updated);
      setStories((prev) => prev.map((s) => s._id === viewing._id ? updated : s));
    } catch { toast.error("Failed to like"); }
  };

  // ── Reply — requires login ──────────────────────────────────────────────────
  const handleReply = async (e) => {
    if (e) e.stopPropagation();
    if (!user) return needsLogin(navigate, "reply to stories");
    if (!replyText.trim() || isSending) return;
    setIsSending(true);
    try {
      const { data } = await api.post(`/stories/${viewing._id}/reply`, { text: replyText });
      const updated  = { ...viewing, replies: [data, ...(viewing.replies || [])] };
      setViewing(updated);
      setStories((prev) => prev.map((s) => s._id === viewing._id ? updated : s));
      setReplyText("");
      setShowReplies(true);
    } catch { toast.error("Failed to reply"); }
    finally { setIsSending(false); }
  };

  // ── Admin delete story ──────────────────────────────────────────────────────
  const handleDeleteStory = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this story?")) return;
    try {
      await api.delete(`/stories/${viewing._id}`);
      setStories((prev) => prev.filter((s) => s._id !== viewing._id));
      closeViewer();
      toast.success("Story deleted");
    } catch { toast.error("Failed to delete story"); }
  };

  // ── Admin multi-file upload ─────────────────────────────────────────────────
  const handleUpload = async (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;
    e.target.value = "";
    if (selected.length > 4) { toast.error("Max 4 stories at once"); return; }

    setUploading(true);
    setUploadProgress({ done: 0, total: selected.length });
    const newStories = [];

    for (let i = 0; i < selected.length; i++) {
      const fd = new FormData();
      fd.append("media", selected[i]);
      try {
        const { data } = await api.post("/stories", fd);
        newStories.push(data);
        setUploadProgress({ done: i + 1, total: selected.length });
      } catch { toast.error(`File ${i + 1} failed`); }
    }

    if (newStories.length) {
      setStories((prev) => [...newStories, ...prev]);
      toast.success(newStories.length === 1 ? "Story posted! 🎉" : `${newStories.length} stories posted! 🎉`);
    }
    setUploading(false);
    setUploadProgress({ done: 0, total: 0 });
  };

  // ── Viewer overlay ──────────────────────────────────────────────────────────
  const ViewerOverlay = viewing && (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 99999, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <div style={{ position: "absolute", top: 0, width: "100%", padding: "50px 15px 30px", zIndex: 100, background: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={(e) => handleProfileRedirect(e, viewing.author?.username)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <img src={viewing.author?.profilePicture || "/default-avatar.png"} style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #fff", objectFit: "cover" }} alt="" />
            <div style={{ color: "#fff", fontWeight: "bold", textShadow: "0 2px 4px rgba(0,0,0,0.8)", display: "flex", alignItems: "center", gap: 5 }}>
              {viewing.author?.username} {viewing.author?.verified && <VerifiedBadge size={14} />}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isAdmin && (
              <button onClick={handleDeleteStory} style={{ background: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.5)", color: "#fff", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                </svg>
              </button>
            )}
            <button onClick={closeViewer} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✕</button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div onClick={goPrev} style={{ position: "absolute", left: 0, width: "35%", height: "100%", zIndex: 10 }} />
        <div onClick={goNext} style={{ position: "absolute", right: 0, width: "65%", height: "100%", zIndex: 10 }} />
        {viewing.mediaType === "video"
          ? <video src={viewing.mediaUrl} autoPlay controls style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: "100dvh" }} />
          : <img src={viewing.mediaUrl} style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: "100dvh" }} alt="story" />
        }
      </div>

      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", bottom: 0, width: "100%", padding: "20px 15px 40px", background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={handleLike} style={{ background: "none", border: "none", fontSize: 28, cursor: "pointer", transition: "transform 0.15s", transform: viewing.userLiked ? "scale(1.2)" : "scale(1)" }}>
            {viewing.userLiked ? "❤️" : "🤍"}
          </button>
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReply()}
            onClick={() => { if (!user) needsLogin(navigate, "reply to stories"); }}
            readOnly={!user}
            placeholder={user ? "Send a reply..." : "Login to reply..."}
            style={{ flex: 1, height: 46, borderRadius: 23, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", padding: "0 20px", outline: "none", backdropFilter: "blur(10px)", fontSize: 15, cursor: user ? "text" : "pointer" }}
          />
          {user && replyText.trim() && (
            <button onClick={handleReply} disabled={isSending} style={{ background: "var(--accent)", border: "none", borderRadius: 12, padding: "10px 14px", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
              {isSending ? "..." : "Send"}
            </button>
          )}
        </div>

        {viewing.replies?.length > 0 && (
          <div style={{ marginTop: 15 }}>
            <button onClick={() => setShowReplies(!showReplies)} style={{ color: "#ffffffcc", background: "none", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {showReplies ? "Hide replies" : `View ${viewing.replies.length} replies`}
            </button>
            {showReplies && (
              <div style={{ maxHeight: 140, overflowY: "auto", marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {viewing.replies.map((r, i) => (
                  <div key={i} style={{ color: "#fff", fontSize: 14, background: "rgba(255,255,255,0.15)", padding: "8px 14px", borderRadius: 18, alignSelf: "flex-start", backdropFilter: "blur(5px)" }}>
                    <b style={{ color: "#eee", marginRight: 6 }}>{r.user?.username}:</b>{r.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ width: "100%", background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", gap: 14, padding: "14px", overflowX: "auto", scrollbarWidth: "none" }}>
        {isAdmin && (
          <label style={{ flexShrink: 0, cursor: "pointer", textAlign: "center" }}>
            <input type="file" accept="image/*,video/*" multiple onChange={handleUpload} style={{ display: "none" }} />
            <div style={{ width: 66, height: 66, borderRadius: "50%", background: uploading ? "#6366f1" : "linear-gradient(135deg,#7c3aed,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: uploading ? 14 : 32, fontWeight: 800, border: "3px solid var(--border)" }}>
              {uploading ? `${uploadProgress.done}/${uploadProgress.total}` : "+"}
            </div>
            <div style={{ fontSize: 10, marginTop: 5, color: "var(--muted)", fontWeight: 600 }}>{uploading ? "Posting..." : "Story"}</div>
          </label>
        )}

        {stories.map((s) => (
          <div key={s._id} onClick={() => openStory(s)} style={{ flexShrink: 0, textAlign: "center", cursor: "pointer" }}>
            <div style={{ width: 66, height: 66, borderRadius: "50%", padding: 2, background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>
              <img src={s.author?.profilePicture || "/default-avatar.png"} style={{ width: "100%", height: "100%", borderRadius: "50%", border: "2px solid var(--bg)", objectFit: "cover" }} alt={s.author?.username} />
            </div>
            <div style={{ fontSize: 11, marginTop: 5, fontWeight: 600, color: "var(--text)", maxWidth: 66, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.author?.username}
            </div>
          </div>
        ))}

        {stories.length === 0 && (
          <div style={{ padding: "10px 0", color: "var(--muted)", fontSize: 12, display: "flex", alignItems: "center" }}>
            No stories yet
          </div>
        )}
      </div>
      {ViewerOverlay}
    </div>
  );
}