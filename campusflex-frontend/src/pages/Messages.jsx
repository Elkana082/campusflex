import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

const formatTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// ── Individual message with hold-to-reveal delete ─────────────────────────────
function MessageBubble({ msg, isMine, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);
  const holdTimer = useRef(null);

  const startHold = () => {
    holdTimer.current = setTimeout(() => setShowDelete(true), 500);
  };
  const cancelHold = () => clearTimeout(holdTimer.current);

  return (
    <div
      style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
    >
      {/* Delete button — left side for own messages, right for others (if admin) */}
      {showDelete && (
        <button
          onClick={() => { setShowDelete(false); onDelete(msg._id); }}
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          title="Delete message"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          </svg>
        </button>
      )}

      <div
        onClick={() => setShowDelete((v) => !v)}
        style={{
          maxWidth: "75%", padding: "12px 16px",
          borderRadius: isMine ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
          background: isMine ? "linear-gradient(135deg, var(--accent), var(--pink))" : "var(--card)",
          color: isMine ? "#fff" : "var(--text)",
          border: isMine ? "none" : "1px solid var(--border)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ fontSize: 14, lineHeight: 1.4 }}>{msg.text}</div>
        <div style={{ fontSize: 9, marginTop: 4, opacity: 0.7, textAlign: "right", fontWeight: 700 }}>
          {formatTime(msg.createdAt)}
        </div>
      </div>
    </div>
  );
}

// ── DM view ───────────────────────────────────────────────────────────────────
export default function Messages() {
  const { userId }         = useParams();
  const [searchParams]     = useSearchParams();
  const username           = searchParams.get("username");
  const { user, isAdmin }  = useAuth();
  const navigate           = useNavigate();
  const scrollRef          = useRef();

  const [messages, setMessages]   = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending]     = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const { data } = await api.get(`/messages/history/${userId}`);
        setMessages(data);
        await api.post(`/messages/read/${userId}`);
      } catch (err) { console.error(err); }
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const text = newMessage.trim();
    setNewMessage("");
    try {
      const { data } = await api.post("/messages/send", { recipientId: userId, text });
      setMessages((prev) => [...prev, data]);
    } catch {
      toast.error("Failed to send");
      setNewMessage(text);
    } finally { setSending(false); }
  };

  // ── Delete individual message ───────────────────────────────────────────────
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await api.delete(`/messages/${messageId}`);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    }
  };

  if (!userId) return <ConversationList />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--bg)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ height: 60, display: "flex", alignItems: "center", gap: 12, padding: "0 14px", background: "var(--nav-bg)", backdropFilter: "blur(18px)", borderBottom: "1px solid var(--border)", zIndex: 10, flexShrink: 0 }}>
        <button onClick={() => navigate("/messages")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", padding: 4 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="syne" style={{ fontWeight: 800, fontSize: 16, color: "var(--text)", flex: 1 }}>{username || "Chat"}</div>
        {/* Clear this chat */}
        <button
          onClick={async () => {
            if (!window.confirm("Delete entire conversation?")) return;
            try {
              await api.delete(`/messages/conversation/${userId}`);
              navigate("/messages");
              toast.success("Conversation deleted");
            } catch { toast.error("Failed"); }
          }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}
          title="Delete conversation"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 40 }}>
            No messages yet — say hi! 👋
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
          // Show delete for own messages always; admin can delete any
          const canDelete = isMine || isAdmin;
          return canDelete ? (
            <MessageBubble key={msg._id} msg={msg} isMine={isMine} onDelete={handleDeleteMessage} />
          ) : (
            <div key={msg._id} style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ maxWidth: "75%", padding: "12px 16px", borderRadius: "20px 20px 20px 4px", background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: 14, lineHeight: 1.4 }}>{msg.text}</div>
                <div style={{ fontSize: 9, marginTop: 4, opacity: 0.7, textAlign: "right", fontWeight: 700 }}>{formatTime(msg.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 14px", background: "var(--nav-bg)", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <form onSubmit={handleSend} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 22, padding: "12px 16px", color: "var(--text)", fontSize: 15, outline: "none" }}
          />
          <button type="submit" disabled={!newMessage.trim() || sending} style={{ background: sending ? "var(--muted)" : "linear-gradient(135deg,var(--accent),var(--pink))", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Conversation list ─────────────────────────────────────────────────────────
function ConversationList() {
  const navigate    = useNavigate();
  const [convos, setConvos]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/messages/conversations");
      setConvos(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

  const deleteConvo = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await api.delete(`/messages/conversation/${id}`);
      setConvos((prev) => prev.filter((c) => c.otherUser?._id !== id));
      toast.success("Chat deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const clearAll = async () => {
    if (!window.confirm("Clear ALL messages permanently?")) return;
    setIsDeleting(true);
    try {
      await api.delete("/messages/inbox/clear");
      setConvos([]);
      toast.success("Inbox cleared");
    } catch { toast.error("Action failed"); }
    finally { setIsDeleting(false); }
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", paddingBottom: 100 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--nav-bg)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)", padding: "18px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="syne" style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "var(--text)" }}>Messages</h2>
          <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 800 }}>CAMPUS INBOX</div>
        </div>
        {convos.length > 0 && (
          <button onClick={clearAll} disabled={isDeleting} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", padding: "7px 12px", borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
            {isDeleting ? "..." : "CLEAR ALL"}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>Syncing...</div>
      ) : convos.length === 0 ? (
        <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>📬</div>
          <h3 className="syne" style={{ color: "var(--text)" }}>No messages</h3>
          <button onClick={() => navigate("/explore")} className="btn-primary" style={{ padding: "10px 24px" }}>Find people</button>
        </div>
      ) : (
        convos.map((c) => {
          const hasUnread = c.unreadCount > 0;
          return (
            <div
              key={c.otherUser?._id}
              onClick={() => navigate(`/messages/${c.otherUser?._id}?username=${c.otherUser?.username}`)}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: hasUnread ? "var(--accent)06" : "transparent" }}
            >
              <img src={c.otherUser?.profilePicture || "/default-avatar.png"} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: hasUnread ? "2.5px solid var(--accent)" : "1px solid var(--border)", flexShrink: 0 }} alt="" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>{c.otherUser?.username || "Unknown"}</span>
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>{new Date(c.lastMessage?.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ margin: 0, fontSize: 13, color: hasUnread ? "var(--text)" : "var(--muted)", fontWeight: hasUnread ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "80%" }}>
                    {c.lastMessage?.text || "..."}
                  </p>
                  {hasUnread && <div style={{ background: "var(--accent)", color: "#fff", borderRadius: 10, padding: "2px 7px", fontSize: 10, fontWeight: 900 }}>{c.unreadCount}</div>}
                </div>
              </div>
              <button onClick={(e) => deleteConvo(e, c.otherUser?._id)} style={{ background: "none", border: "none", color: "var(--muted)", padding: 8, cursor: "pointer", opacity: 0.5, flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}