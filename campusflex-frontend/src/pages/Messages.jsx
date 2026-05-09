import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

const formatTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function Messages() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const username = searchParams.get("username");
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const NAV_BAR_HEIGHT = 85; 

  // Fetch Message History for 1-on-1 DM
  useEffect(() => {
    if (!userId) return;
    const fetchMessages = async () => {
      try {
        const { data } = await api.get(`/messages/history/${userId}`);
        setMessages(data);
        await api.post(`/messages/read/${userId}`);
      } catch (err) {
        console.error("Chat loading error:", err);
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const textToSend = newMessage.trim();
    setNewMessage("");

    try {
      const { data } = await api.post("/messages/send", {
        recipientId: userId,
        text: textToSend,
      });
      setMessages((prev) => [...prev, data]);
    } catch (err) {
      toast.error("Failed to send");
      setNewMessage(textToSend);
    } finally {
      setSending(false);
    }
  };

  if (!userId) {
    return <ConversationList />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--bg)", overflow: "hidden" }}>
      {/* DM Header */}
      <div style={{ 
        height: 65, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", 
        background: "var(--nav-bg)", backdropFilter: "blur(18px)", borderBottom: "1px solid var(--border)", zIndex: 10 
      }}>
        <button onClick={() => navigate("/messages")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="syne" style={{ fontWeight: 800, fontSize: 16, color: "var(--text)" }}>
          {username || "Chat"}
        </div>
      </div>
      {/* DM Message Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg) => {
          const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
          return (
            <div key={msg._id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "75%", padding: "12px 16px", borderRadius: isMine ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                background: isMine ? "linear-gradient(135deg, var(--accent), var(--pink))" : "var(--card)",
                color: isMine ? "#fff" : "var(--text)", border: isMine ? "none" : "1px solid var(--border)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
              }}>
                <div style={{ fontSize: 14, lineHeight: "1.4" }}>{msg.text}</div>
                <div style={{ fontSize: 9, marginTop: 4, opacity: 0.7, textAlign: "right", fontWeight: 700 }}>
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: `12px 14px ${NAV_BAR_HEIGHT}px`, background: "var(--nav-bg)", borderTop: "1px solid var(--border)", zIndex: 20 }}>
        <form onSubmit={handleSend} style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: "600px", margin: "0 auto" }}>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 22, padding: "12px 16px", color: "var(--text)", fontSize: 16, outline: "none" }}
          />
          <button type="submit" disabled={!newMessage.trim()} style={{ background: "linear-gradient(135deg, var(--accent), var(--pink))", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
function ConversationList() {
  const navigate = useNavigate();
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get("/messages/conversations");
      setConvos(data);
    } catch (err) {
      console.error("Inbox load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const deleteConversation = async (e, otherUserId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await api.delete(`/messages/conversation/${otherUserId}`);
      setConvos(prev => prev.filter(c => c.otherUser?._id !== otherUserId));
      toast.success("Chat deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const clearAllInbox = async () => {
    if (!window.confirm("Clear all messages permanently?")) return;
    setIsDeleting(true);
    try {
      await api.delete("/messages/inbox/clear");
      setConvos([]);
      toast.success("Inbox cleared");
    } catch {
      toast.error("Action failed");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ 
        position: "sticky", top: 0, zIndex: 10, background: "var(--nav-bg)", 
        backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)", 
        padding: "20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" 
      }}>
        <div>
          <h2 className="syne" style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "var(--text)" }}>Messages</h2>
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 800 }}>CAMPUS INBOX</div>
        </div>
        {convos.length > 0 && (
          <button onClick={clearAllInbox} disabled={isDeleting} style={{ background: "rgba(239, 68, 68, 0.1)", border: "none", color: "#ef4444", padding: "8px 14px", borderRadius: 12, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
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
          <button onClick={() => navigate("/explore")} className="btn-primary" style={{ padding: "10px 24px" }}>Start a vibe</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {convos.map((c) => {
            const hasUnread = c.unreadCount > 0;
            return (
              <div
                key={c.otherUser?._id}
                onClick={() => navigate(`/messages/${c.otherUser?._id}?username=${c.otherUser?.username}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "16px",
                  borderBottom: "1px solid var(--border)", cursor: "pointer",
                  background: hasUnread ? "rgba(var(--accent-rgb), 0.04)" : "transparent"
                }}
              >
                <img src={c.otherUser?.profilePicture || "/default-avatar.png"} style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", border: hasUnread ? "2.5px solid var(--accent)" : "1px solid var(--border)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>{c.otherUser?.username || "Unknown"}</span>
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>{new Date(c.lastMessage?.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ margin: 0, fontSize: 13, color: hasUnread ? "var(--text)" : "var(--muted)", fontWeight: hasUnread ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "80%" }}>
                      {c.lastMessage?.text || "..."}
                    </p>
                    {hasUnread && <div style={{ background: "var(--accent)", color: "#fff", borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 900 }}>{c.unreadCount}</div>}
                  </div>
                </div>
                <button onClick={(e) => deleteConversation(e, c.otherUser?._id)} style={{ background: "none", border: "none", color: "var(--muted)", padding: 8, cursor: "pointer", opacity: 0.4 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}