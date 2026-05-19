import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CAMPUSES } from "../components/Navbar";
import VerifiedBadge from "../components/VerifiedBadge";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Profile() {
  const { username }      = useParams();
  const { user, isAdmin } = useAuth();
  const navigate          = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts]   = useState([]);
  const [tab, setTab]       = useState("posts");
  const [loading, setLoading] = useState(true);

  const targetUsername = username || user?.username;
  const isOwnProfile   = targetUsername === user?.username;

  useEffect(() => {
    setLoading(true);
    api.get(`/users/${targetUsername}`)
      .then((r) => { setProfileUser(r.data.user); setPosts(r.data.posts); })
      .catch(() => toast.error("Could not load profile"))
      .finally(() => setLoading(false));
  }, [targetUsername]);

  if (loading) return <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--muted)" }}>Loading profile...</div>;
  if (!profileUser) return <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--muted)" }}>User not found</div>;

  const campus  = CAMPUSES.find((c) => c.id === profileUser.campus);
  const initial = profileUser.username?.[0]?.toUpperCase() || "?";

  const socialLinks = [
    { key: "tiktok",    handle: profileUser.socials?.tiktok,    color: "#fe2c55", url: `https://tiktok.com/@${profileUser.socials?.tiktok}` },
    { key: "instagram", handle: profileUser.socials?.instagram,  color: "#c13584", url: `https://instagram.com/${profileUser.socials?.instagram}` },
    { key: "facebook",  handle: profileUser.socials?.facebook,   color: "#1877f2", url: `https://facebook.com/${profileUser.socials?.facebook}` },
  ].filter((s) => s.handle);

  // Thumbnail for a post — prefers first media item
  const getThumb = (p) => {
    if (p.media?.length) return p.media[0];
    if (p.mediaUrl) return { url: p.mediaUrl, type: p.mediaType || "image" };
    return null;
  };

  return (
    <div style={{ paddingBottom: 90 }}>
      {/* Cover gradient */}
      <div style={{ height: 120, background: `linear-gradient(135deg, ${campus?.color || "var(--accent)"}cc, #ec489988)`, position: "relative" }}>
        <div style={{ position: "absolute", bottom: -42, left: 16 }}>
          <div style={{ width: 84, height: 84, borderRadius: "50%", border: "4px solid var(--bg)", background: profileUser.profilePicture ? `url(${profileUser.profilePicture}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontFamily: "Syne", fontWeight: 800, color: "#7c3aed" }}>
            {!profileUser.profilePicture && initial}
          </div>
        </div>
      </div>

      <div style={{ padding: "52px 16px 0" }}>
        {/* Name + buttons */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span className="syne" style={{ fontWeight: 800, fontSize: 20, color: "var(--text)" }}>{profileUser.username}</span>
              {profileUser.verified && <VerifiedBadge size={20} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              {profileUser.displayName && <span style={{ fontSize: 13, color: "var(--muted)" }}>{profileUser.displayName}</span>}
              {campus && <span style={{ background: campus.color + "18", color: campus.color, border: `1px solid ${campus.color}33`, borderRadius: 20, padding: "1px 9px", fontSize: 11, fontWeight: 700 }}>{campus.emoji} {campus.short}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isOwnProfile ? (
              <button onClick={() => navigate("/settings")} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "8px 16px", color: "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Edit Profile</button>
            ) : (
              <button onClick={() => navigate(`/messages/${profileUser._id}?username=${profileUser.username}`)} style={{ background: "linear-gradient(135deg,var(--accent),var(--pink))", border: "none", borderRadius: 12, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                Message
              </button>
            )}
          </div>
        </div>

        {profileUser.bio && <p style={{ fontSize: 13, color: "var(--subtext)", lineHeight: 1.65, marginBottom: 12 }}>{profileUser.bio}</p>}

        {socialLinks.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {socialLinks.map((s) => (
              <a key={s.key} href={s.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "6px 12px", color: s.color, fontSize: 12, fontWeight: 700 }}>
                @{s.handle}
              </a>
            ))}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, marginBottom: 14, boxShadow: "var(--shadow)" }}>
          {[
            [posts.length, "Posts"],
            [posts.reduce((a, p) => a + (p.likes?.length || 0), 0).toLocaleString(), "Likes"],
            [profileUser.badges?.length || 0, "Badges"],
          ].map(([v, l], i) => (
            <div key={l} style={{ textAlign: "center", padding: "13px 0", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
              <div className="syne" style={{ fontWeight: 800, fontSize: 18, color: "var(--text)" }}>{v}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        {profileUser.badges?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {profileUser.badges.map((b) => <span key={b} style={{ background: "var(--accent)18", color: "var(--accent)", border: "1px solid var(--accent)33", borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700 }}>{b}</span>)}
          </div>
        )}

        {/* Feature request button */}
        {isOwnProfile && !isAdmin && (
          <button onClick={() => navigate("/feature-request")} style={{ width: "100%", background: "linear-gradient(135deg,var(--accent),var(--pink))", border: "none", borderRadius: 14, padding: "13px", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 800, fontFamily: "Syne", marginBottom: 16 }}>
            ✨ Request to Feature My Post
          </button>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 10 }}>
          {["posts", "saved", "tagged"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "10px 0", fontSize: 13, fontWeight: 700, color: tab === t ? "var(--accent)" : "var(--muted)", borderBottom: tab === t ? "2.5px solid var(--accent)" : "2.5px solid transparent", textTransform: "capitalize" }}>
              {t}
            </button>
          ))}
        </div>

        {/* Posts grid — clicking any thumbnail opens /post/:id */}
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>No posts yet</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
            {posts.map((p) => {
              const thumb = getThumb(p);
              return (
                <div
                  key={p._id}
                  onClick={() => navigate(`/post/${p._id}`)}   // ← navigate to PostDetail
                  style={{ aspectRatio: "1/1", background: "var(--border)", borderRadius: 4, overflow: "hidden", cursor: "pointer", position: "relative" }}
                >
                  {thumb ? (
                    thumb.type === "video"
                      ? <video src={thumb.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <img src={thumb.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "var(--border)" }} />
                  )}
                  {/* Multi-media badge */}
                  {p.media?.length > 1 && (
                    <div style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "2px 5px", fontSize: 9, color: "#fff", fontWeight: 700 }}>
                      1/{p.media.length}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}