import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CAMPUSES } from "../components/Navbar";
import VerifiedBadge from "../components/VerifiedBadge";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Explore() {
  const { switchCampus }            = useAuth();
  const navigate                    = useNavigate();
  const [search, setSearch]         = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]   = useState(false);
  const [topPosts, setTopPosts]     = useState([]);   // most liked posts across all campuses
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Load top posts across all campuses (most liked)
  useEffect(() => {
    const fetchAll = async () => {
      setLoadingPosts(true);
      try {
        const results = await Promise.all(
          CAMPUSES.map((c) => api.get(`/posts?campus=${c.id}&limit=5`).then((r) => r.data))
        );
        const all = results.flat();
        // Sort by likes descending, take top 6 for trending grid
        all.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        setTopPosts(all.slice(0, 6));
      } catch {
        /* silent */
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchAll();
  }, []);

  // Live search users by username
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        // Search each campus for the username
        const { data } = await api.get(`/users/${search.trim().replace("@", "")}`);
        setSearchResults([data.user]);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleCampusClick = (campusId) => {
    switchCampus(campusId);
    navigate("/");
  };

  return (
    <div className="page" style={{ paddingTop: 14 }}>

      {/* Search bar */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 14 }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by username..."
          style={{ background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 14, flex: 1 }}
        />
        {searching && <span style={{ fontSize: 12, color: "var(--muted)" }}>Searching...</span>}
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="card" style={{ padding: "8px 0", marginBottom: 16 }}>
          {searchResults.map((u) => (
            <div
              key={u._id}
              onClick={() => { navigate(`/profile/${u.username}`); setSearch(""); setSearchResults([]); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer" }}
            >
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: u.profilePicture ? `url(${u.profilePicture}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#7c3aed", flexShrink: 0 }}>
                {!u.profilePicture && u.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
                  {u.username} {u.verified && <VerifiedBadge size={14} />}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {CAMPUSES.find((c) => c.id === u.campus)?.short || u.campus}
                  {u.role === "admin" || u.role === "superadmin" ? " · Admin" : ""}
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
      )}

      {search.trim() && searchResults.length === 0 && !searching && (
        <div className="card" style={{ padding: "20px 16px", marginBottom: 16, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
          No user found with that username
        </div>
      )}

      {/* All Campuses */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
          </svg>
          <span className="syne" style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>All Campuses</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {CAMPUSES.map((campus) => (
            <button
              key={campus.id}
              onClick={() => handleCampusClick(campus.id)}
              className="card"
              style={{ padding: "14px 13px", cursor: "pointer", textAlign: "left", border: "1px solid var(--border)", background: "var(--card)", transition: "all 0.15s" }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{campus.emoji}</div>
              <div className="syne" style={{ fontWeight: 800, fontSize: 13, color: "var(--text)" }}>{campus.short}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, marginBottom: 8, lineHeight: 1.4 }}>{campus.name}</div>
              <span style={{ fontSize: 11, color: campus.color, fontWeight: 700, background: campus.color + "14", borderRadius: 8, padding: "2px 8px" }}>
                View Feed →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Trending — real posts from API */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z"/>
          </svg>
          <span className="syne" style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>
            Trending Across All Campuses
          </span>
        </div>

        {loadingPosts ? (
          <div style={{ textAlign: "center", padding: "30px", color: "var(--muted)", fontSize: 13 }}>Loading trending posts...</div>
        ) : topPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "var(--muted)", fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
            No posts yet across campuses. Be the first to post!
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
            {topPosts.map((post, i) => (
              <div
                key={post._id}
                onClick={() => navigate(`/profile/${post.author?.username}`)}
                style={{
                  aspectRatio: "1/1",
                  background: "var(--border)",
                  borderRadius: i === 0 ? "16px 4px 4px 4px" : 4,
                  overflow: "hidden",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                {post.mediaType === "video"
                  ? <video src={post.mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <img src={post.mediaUrl} alt="trending" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                }
                {/* Like count overlay */}
                <div style={{ position: "absolute", bottom: 4, left: 4, background: "#00000077", borderRadius: 8, padding: "2px 7px", fontSize: 10, color: "#fff", fontWeight: 700, backdropFilter: "blur(4px)" }}>
                  ❤️ {post.likes?.length || 0}
                </div>
                {i === 0 && (
                  <div style={{ position: "absolute", top: 6, left: 6, background: "var(--pink)", borderRadius: 8, padding: "2px 8px", fontSize: 10, color: "#fff", fontWeight: 800 }}>
                    🔥 TOP
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Creators — loaded from real posts */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span className="syne" style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>Top Creators</span>
        </div>

        {loadingPosts ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)", fontSize: 13 }}>Loading...</div>
        ) : topPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)", fontSize: 13 }}>No creators yet</div>
        ) : (
          // Deduplicate by author, sort by total likes
          (() => {
            const byAuthor = {};
            topPosts.forEach((p) => {
              const id = p.author?._id;
              if (!id) return;
              if (!byAuthor[id]) byAuthor[id] = { author: p.author, totalLikes: 0 };
              byAuthor[id].totalLikes += (p.likes?.length || 0);
            });
            const ranked = Object.values(byAuthor).sort((a, b) => b.totalLikes - a.totalLikes).slice(0, 5);
            const medalColors = ["var(--gold)", "#9ca3af", "#b45309", "var(--accent)", "var(--pink)"];
            return ranked.map((entry, i) => {
              const campus = CAMPUSES.find((c) => c.id === entry.author?.campus);
              return (
                <div
                  key={entry.author._id}
                  onClick={() => navigate(`/profile/${entry.author.username}`)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                >
                  <span className="syne" style={{ fontWeight: 800, fontSize: 17, color: medalColors[i], minWidth: 24 }}>
                    #{i + 1}
                  </span>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: entry.author.profilePicture ? `url(${entry.author.profilePicture}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#7c3aed" }}>
                      {!entry.author.profilePicture && entry.author.username?.[0]?.toUpperCase()}
                    </div>
                    {entry.author.verified && (
                      <div style={{ position: "absolute", bottom: -2, right: -2, border: "2px solid var(--bg)", borderRadius: "50%" }}>
                        <VerifiedBadge size={12} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 4 }}>
                      {entry.author.username}
                      {entry.author.verified && <VerifiedBadge size={12} />}
                    </div>
                    {campus && (
                      <span style={{ background: campus.color + "18", color: campus.color, borderRadius: 8, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>
                        {campus.emoji} {campus.short}
                      </span>
                    )}
                  </div>
                  <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>
                    ❤️ {entry.totalLikes.toLocaleString()}
                  </span>
                </div>
              );
            });
          })()
        )}
      </div>
    </div>
  );
}