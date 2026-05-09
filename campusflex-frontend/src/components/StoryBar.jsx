import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import VerifiedBadge from "./VerifiedBadge";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function StoryBar() {
  const { currentCampus, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [stories, setStories] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const timerRef = useRef(null);

  useEffect(() => {
    // REMINDER: Switch on GPS for campus-specific content
    api.get(`/stories?campus=${currentCampus}`)
      .then((r) => setStories(r.data))
      .catch(() => {});
  }, [currentCampus]);

  useEffect(() => {
    if (!viewing || viewing.mediaType === "video") return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => goNext(), 6000);
    return () => clearTimeout(timerRef.current);
  }, [viewing]);

  const openStory = (story) => {
    setViewing(story);
    setReplyText("");
    setShowReplies(false);
  };

  const closeViewer = () => {
    clearTimeout(timerRef.current);
    setViewing(null);
  };

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

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!viewing) return;
    try {
      const { data } = await api.post(`/stories/${viewing._id}/like`);
      const updated = { ...viewing, likeCount: data.likeCount, userLiked: data.liked };
      setViewing(updated);
      setStories(prev => prev.map(s => s._id === viewing._id ? updated : s));
    } catch {
      toast.error("Failed to like");
    }
  };

  const handleReply = async (e) => {
    if (e) e.stopPropagation();
    if (!replyText.trim() || isSending) return;
    setIsSending(true);
    try {
      const { data } = await api.post(`/stories/${viewing._id}/reply`, { text: replyText });
      const updated = { ...viewing, replies: [data, ...(viewing.replies || [])] };
      setViewing(updated);
      setStories(prev => prev.map(s => s._id === viewing._id ? updated : s));
      setReplyText("");
      setShowReplies(true);
    } catch {
      toast.error("Failed to reply");
    } finally {
      setIsSending(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("media", file);
    try {
      const { data } = await api.post("/stories", fd);
      setStories(prev => [data, ...prev]);
      toast.success("Story posted!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };
  const ViewerOverlay = viewing && (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 99999, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      
      {/* Immersive Header */}
      <div style={{ position: "absolute", top: 0, width: "100%", padding: "50px 15px 30px", zIndex: 100, background: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={(e) => handleProfileRedirect(e, viewing.author?.username)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <img src={viewing.author?.profilePicture || "/default-avatar.png"} style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #fff", objectFit: "cover" }} />
            <div style={{ color: "#fff", fontWeight: "bold", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
              {viewing.author?.username} {viewing.author?.verified && <VerifiedBadge size={14} />}
            </div>
          </div>
          <button onClick={closeViewer} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✕</button>
        </div>
      </div>

      {/* Full-Screen Media Display */}
      <div style={{ flex: 1, width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div onClick={goPrev} style={{ position: "absolute", left: 0, width: "35%", height: "100%", zIndex: 10 }} />
        <div onClick={goNext} style={{ position: "absolute", right: 0, width: "65%", height: "100%", zIndex: 10 }} />
        
        {viewing.mediaType === "video" ? (
          <video 
            src={viewing.mediaUrl} 
            autoPlay 
            controls 
            style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: "100vh" }} 
          />
        ) : (
          <img 
            src={viewing.mediaUrl} 
            style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: "100vh" }} 
            alt="high quality story"
          />
        )}
      </div>

      {/* Interaction Overlay */}
      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", bottom: 0, width: "100%", padding: "20px 15px 40px", background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={handleLike} style={{ background: "none", border: "none", fontSize: 28, cursor: "pointer", transition: "transform 0.1s active" }}>
            {viewing.userLiked ? "❤️" : "🤍"}
          </button>
          <input 
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReply()}
            placeholder="Send a reply..."
            style={{ flex: 1, height: 46, borderRadius: 23, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", padding: "0 20px", outline: "none", backdropFilter: "blur(10px)", fontSize: 15 }}
          />
        </div>

        {viewing.replies?.length > 0 && (
          <div style={{ marginTop: 15 }}>
            <button onClick={() => setShowReplies(!showReplies)} style={{ color: "#ffffffcc", background: "none", border: "none", fontSize: 13, fontWeight: "600", cursor: "pointer" }}>
              {showReplies ? "Hide replies" : `View ${viewing.replies.length} replies`}
            </button>
            {showReplies && (
              <div style={{ maxHeight: 140, overflowY: "auto", marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {viewing.replies.map((r, i) => (
                  <div key={i} style={{ color: "#fff", fontSize: 14, background: "rgba(255,255,255,0.15)", padding: "8px 14px", borderRadius: "18px", alignSelf: "flex-start", backdropFilter: "blur(5px)" }}>
                    <b style={{ color: "#eee", marginRight: 6 }}>{r.user?.username}:</b> {r.text}
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
    <div style={{ width: "100%", background: "#fff" }}>
      <div style={{ display: "flex", gap: 14, padding: "14px", overflowX: "auto", borderBottom: "1px solid #f2f2f2" }}>
        {isAdmin && (
          <label style={{ flexShrink: 0, cursor: "pointer" }}>
            <input type="file" onChange={handleUpload} style={{ display: "none" }} />
            <div style={{ width: 66, height: 66, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 32 }}>
              {uploading ? "..." : "+"}
            </div>
          </label>
        )}
        
        {stories.map((s) => (
          <div key={s._id} onClick={() => openStory(s)} style={{ flexShrink: 0, textAlign: "center", cursor: "pointer" }}>
            <div style={{ width: 66, height: 66, borderRadius: "50%", padding: 2, background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}>
              <img src={s.author?.profilePicture || "/default-avatar.png"} style={{ width: "100%", height: "100%", borderRadius: "50%", border: "2px solid #fff", objectFit: "cover" }} />
            </div>
            <div style={{ fontSize: 11, marginTop: 5, fontWeight: "500", color: "#222" }}>{s.author?.username}</div>
          </div>
        ))}
      </div>
      {ViewerOverlay}
    </div>
  );
}