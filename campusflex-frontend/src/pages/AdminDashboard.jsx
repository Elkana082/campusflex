import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CAMPUSES } from "../components/Navbar";
import VerifiedBadge from "../components/VerifiedBadge";
import api from "../api/axios";
import toast from "react-hot-toast";

// ── Avatar component — always clickable to profile ───────────────────────────
function Avatar({ user, size = 40, navigate }) {
  const initial = user?.username?.[0]?.toUpperCase() || "?";
  return (
    <div
      onClick={() => navigate && user?.username && navigate(`/profile/${user.username}`)}
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0, cursor: navigate ? "pointer" : "default",
        background: user?.profilePicture ? `url(${user.profilePicture}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)",
        border: "2px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.38, fontWeight: 800, color: "#7c3aed", fontFamily: "Syne",
        position: "relative",
      }}
    >
      {!user?.profilePicture && initial}
    </div>
  );
}

// ── Campus Admin Manager ──────────────────────────────────────────────────────
function CampusAdminManager({ campus, navigate }) {
  const [admins, setAdmins]               = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [newUsername, setNewUsername]     = useState("");
  const [assigning, setAssigning]         = useState(false);
  const [open, setOpen]                   = useState(false);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const { data } = await api.get(`/auth/admins/${campus.id}`);
      setAdmins(data);
    } catch {
      /* silent */
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    if (open) fetchAdmins();
  }, [open]);

  const handleAssign = async () => {
    if (!newUsername.trim()) return toast.error("Enter a username");
    if (admins.length >= 4) return toast.error(`${campus.short} already has 4 admins. Remove one first.`);
    setAssigning(true);
    try {
      const { data: userData } = await api.get(`/users/${newUsername.trim()}`);
      const { data }           = await api.post(`/auth/make-admin/${userData.user._id}`);
      toast.success(data.message);
      setNewUsername("");
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || "User not found");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (adminId, username) => {
    if (!window.confirm(`Remove @${username} as admin?`)) return;
    try {
      const { data } = await api.post(`/auth/remove-admin/${adminId}`);
      toast.success(data.message);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove admin");
    }
  };

  return (
    <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14, marginBottom: 14 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "6px 0", textAlign: "left" }}
      >
        <span style={{ fontSize: 22 }}>{campus.emoji}</span>
        <div style={{ flex: 1 }}>
          <div className="syne" style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>{campus.short}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{campus.name}</div>
        </div>
        <span style={{ background: campus.color + "18", color: campus.color, border: `1px solid ${campus.color}33`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
          {loadingAdmins ? "..." : `${admins.length}/4 admins`}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
          <polyline points={open ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
        </svg>
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          {admins.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: 13, padding: "8px 0", textAlign: "center" }}>No admins assigned yet</div>
          ) : (
            admins.map((admin) => (
              <div key={admin._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)44" }}>
                <Avatar user={admin} size={36} navigate={navigate} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
                    {admin.username}
                    {admin.verified && <VerifiedBadge size={13} />}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Admin · {admin.campus}</div>
                </div>
                <button
                  onClick={() => handleRemove(admin._id, admin.username)}
                  style={{ background: "#ef444418", border: "1px solid #ef444433", borderRadius: 10, padding: "5px 12px", color: "#ef4444", cursor: "pointer", fontWeight: 700, fontSize: 12 }}
                >
                  Remove
                </button>
              </div>
            ))
          )}

          {admins.length < 4 && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                className="input"
                placeholder="Username to make admin"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.replace("@", "").trim())}
                style={{ flex: 1, borderRadius: 12 }}
                onKeyDown={(e) => e.key === "Enter" && handleAssign()}
              />
              <button
                onClick={handleAssign}
                disabled={assigning}
                style={{ background: campus.color, border: "none", borderRadius: 12, padding: "0 16px", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, flexShrink: 0 }}
              >
                {assigning ? "..." : "+ Assign"}
              </button>
            </div>
          )}
          {admins.length >= 4 && (
            <div style={{ background: "var(--gold)18", border: "1px solid var(--gold)44", borderRadius: 12, padding: "8px 12px", marginTop: 10, fontSize: 12, color: "var(--gold)", fontWeight: 600 }}>
              ⚠️ Maximum 4 admins reached for {campus.short}. Remove one to add another.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared media card used for both feature requests and fit submissions ───────
function SubmissionCard({ item, onApprove, onReject, navigate, approveLabel = "✅ Approve", rejectLabel = "✕ Reject" }) {
  return (
    <div style={{ marginBottom: 18, borderBottom: "1px solid var(--border)", paddingBottom: 18 }}>
      <div
        onClick={() => navigate(`/profile/${item.user?.username}`)}
        style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}
      >
        <Avatar user={item.user} size={38} navigate={navigate} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 4 }}>
            {item.user?.username} {item.user?.verified && <VerifiedBadge size={12} />}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>
            {item.user?.campus?.toUpperCase()} · {new Date(item.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div style={{ borderRadius: 14, overflow: "hidden", aspectRatio: "1/1", background: "var(--border)", marginBottom: 10 }}>
        {item.mediaType === "video"
          ? <video src={item.mediaUrl} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <img src={item.mediaUrl} alt="submission" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        }
      </div>

      {item.caption && (
        <p style={{ fontSize: 13, color: "var(--subtext)", marginBottom: 10, lineHeight: 1.5 }}>{item.caption}</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button
          onClick={() => onApprove(item._id)}
          style={{ background: "var(--accent)", border: "none", borderRadius: 12, padding: "11px", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
        >
          {approveLabel}
        </button>
        <button
          onClick={() => onReject(item._id)}
          style={{ background: "transparent", border: "1px solid #ef4444", borderRadius: 12, padding: "11px", color: "#ef4444", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
        >
          {rejectLabel}
        </button>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, isSuperAdmin, currentCampus } = useAuth();
  const navigate        = useNavigate();
  const campus          = CAMPUSES.find((c) => c.id === currentCampus);

  const [featureRequests, setFeatureRequests] = useState([]);
  const [fitSubmissions, setFitSubmissions]   = useState([]);   // ← NEW
  const [verifyUsername, setVerifyUsername]   = useState("");
  const [loadingVerify, setLoadingVerify]     = useState(false);

  // ── Fetch feature requests (route was broken before — fixed in users.js) ───
  useEffect(() => {
    api.get("/users/admin/feature-requests")
      .then((r) => setFeatureRequests(r.data))
      .catch(() => {});
  }, []);

  // ── Fetch fit submissions ─────────────────────────────────────────────────
  useEffect(() => {
    api.get("/fitrating/submissions")
      .then((r) => setFitSubmissions(r.data))
      .catch(() => {});
  }, []);

  // ── Feature request handlers ──────────────────────────────────────────────
  const handleApproveFeature = async (id) => {
    try {
      await api.post(`/users/admin/feature-request/${id}/approve`);
      setFeatureRequests((prev) => prev.filter((r) => r._id !== id));
      toast.success("Approved ✅ User earns Featured Creator badge!");
    } catch { toast.error("Failed to approve"); }
  };

  const handleRejectFeature = async (id) => {
    try {
      await api.post(`/users/admin/feature-request/${id}/reject`);
      setFeatureRequests((prev) => prev.filter((r) => r._id !== id));
      toast.success("Rejected");
    } catch { toast.error("Failed to reject"); }
  };

  // ── Fit submission handlers ───────────────────────────────────────────────
  const handleApproveFit = async (id) => {
    try {
      await api.post(`/fitrating/submissions/${id}/approve`);
      setFitSubmissions((prev) => prev.filter((s) => s._id !== id));
      toast.success("Outfit approved! 🔥 Now live in Fit Rating.");
    } catch { toast.error("Failed to approve fit"); }
  };

  const handleRejectFit = async (id) => {
    try {
      await api.post(`/fitrating/submissions/${id}/reject`);
      setFitSubmissions((prev) => prev.filter((s) => s._id !== id));
      toast.success("Fit submission rejected");
    } catch { toast.error("Failed to reject fit"); }
  };

  // ── Verification handlers ─────────────────────────────────────────────────
  const handleVerifyUser = async (revoke = false) => {
    if (!verifyUsername.trim()) return toast.error("Enter a username");
    setLoadingVerify(true);
    try {
      const { data: u }  = await api.get(`/users/${verifyUsername.trim()}`);
      const endpoint     = revoke ? `/auth/unverify/${u.user._id}` : `/auth/verify/${u.user._id}`;
      const { data }     = await api.post(endpoint);
      toast.success(data.message);
      setVerifyUsername("");
    } catch (err) {
      toast.error(err.response?.data?.message || "User not found");
    } finally {
      setLoadingVerify(false);
    }
  };

  const totalPending = featureRequests.length + fitSubmissions.length;

  return (
    <div className="page" style={{ paddingTop: 14 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={isSuperAdmin ? "var(--gold)" : "var(--accent)"} strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <div>
          <h2 className="syne" style={{ fontWeight: 800, fontSize: 18, color: "var(--text)" }}>
            {isSuperAdmin ? "Superadmin Dashboard" : "Admin Dashboard"}
          </h2>
          {campus && <div style={{ fontSize: 12, color: campus.color, fontWeight: 700 }}>{campus.emoji} Managing {campus.short}</div>}
        </div>
      </div>

      {/* Superadmin banner */}
      {isSuperAdmin && (
        <div style={{ background: "var(--gold)16", border: "1px solid var(--gold)44", borderRadius: 14, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--gold)", fontWeight: 600 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          You are the Superadmin — full control over all campuses and admins.
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Feature Requests", value: featureRequests.length, color: "var(--gold)" },
          { label: "Fit Submissions",  value: fitSubmissions.length,  color: "var(--pink)" },
          { label: "Campus",           value: campus?.short || "—",   color: campus?.color || "var(--pink)" },
          { label: "Logged in as",     value: `@${user?.username}`,   color: "var(--muted)" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "14px 15px" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 5 }}>{s.label}</div>
            <div className="syne" style={{ fontWeight: 800, fontSize: 17, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Feature Requests ───────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 className="syne" style={{ fontWeight: 800, marginBottom: 14, color: "var(--text)", fontSize: 15 }}>
          ⭐ Feature Requests ({featureRequests.length})
        </h3>
        {featureRequests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "16px 0", color: "var(--muted)", fontSize: 13 }}>
            No pending feature requests
          </div>
        ) : (
          featureRequests.map((r) => (
            <SubmissionCard
              key={r._id}
              item={r}
              navigate={navigate}
              onApprove={handleApproveFeature}
              onReject={handleRejectFeature}
              approveLabel="✅ Approve & Post"
              rejectLabel="✕ Reject"
            />
          ))
        )}
      </div>

      {/* ── Fit Submissions ────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 className="syne" style={{ fontWeight: 800, marginBottom: 4, color: "var(--text)", fontSize: 15 }}>
          👗 Fit Rating Submissions ({fitSubmissions.length})
        </h3>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
          Approve outfits to make them live in the weekly Fit Rating contest.
        </p>
        {fitSubmissions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "16px 0", color: "var(--muted)", fontSize: 13 }}>
            No pending fit submissions
          </div>
        ) : (
          fitSubmissions.map((s) => (
            <div key={s._id}>
              {/* Week badge */}
              <div style={{ display: "inline-block", background: "var(--pink)18", border: "1px solid var(--pink)44", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "var(--pink)", fontWeight: 700, marginBottom: 10 }}>
                Week #{s.weekNumber}
              </div>
              <SubmissionCard
                item={s}
                navigate={navigate}
                onApprove={handleApproveFit}
                onReject={handleRejectFit}
                approveLabel="🔥 Approve Fit"
                rejectLabel="✕ Reject"
              />
            </div>
          ))
        )}
      </div>

      {/* ── Superadmin: All campuses — assign/remove admins ── */}
      {isSuperAdmin && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3 className="syne" style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, color: "var(--text)" }}>
            🌐 Campus Admin Management
          </h3>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
            Each campus can have up to 4 admins. Tap a campus to expand, assign or remove admins.
          </p>
          {CAMPUSES.map((c) => (
            <CampusAdminManager key={c.id} campus={c} navigate={navigate} />
          ))}
        </div>
      )}

      {/* ── Superadmin: Verification badge ── */}
      {isSuperAdmin && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3 className="syne" style={{ fontWeight: 800, fontSize: 15, marginBottom: 5, color: "var(--text)" }}>
            <span style={{ color: "#1d9bf0" }}>✓</span> Grant / Revoke Verification Badge
          </h3>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Only you can grant the blue badge. Enter the exact username.</p>
          <input
            className="input"
            placeholder="Username (without @)"
            value={verifyUsername}
            onChange={(e) => setVerifyUsername(e.target.value.replace("@", ""))}
            style={{ marginBottom: 10 }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={() => handleVerifyUser(false)} disabled={loadingVerify} style={{ background: "#1d9bf018", border: "1px solid #1d9bf044", borderRadius: 12, padding: "11px", color: "#1d9bf0", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
              {loadingVerify ? "..." : "✓ Grant Badge"}
            </button>
            <button onClick={() => handleVerifyUser(true)} disabled={loadingVerify} style={{ background: "#ef444418", border: "1px solid #ef444444", borderRadius: 12, padding: "11px", color: "#ef4444", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
              {loadingVerify ? "..." : "✕ Revoke Badge"}
            </button>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <h3 className="syne" style={{ fontWeight: 800, marginBottom: 12, fontSize: 14, color: "var(--text)" }}>Quick Actions</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Go to Feed",     color: "var(--accent)", path: "/",        icon: "🏠" },
          { label: "Post Event",     color: "var(--pink)",   path: "/events",  icon: "📅" },
          { label: "Post News",      color: "#10b981",       path: "/news",    icon: "📰" },
          { label: "View Shoutouts", color: "#38bdf8",       path: "/wall",    icon: "💬" },
        ].map((a) => (
          <button key={a.label} onClick={() => navigate(a.path)} style={{ background: a.color + "18", border: `1px solid ${a.color}44`, borderRadius: 14, padding: "14px 11px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: a.color, fontWeight: 700, fontSize: 13, fontFamily: "Syne", textAlign: "left" }}>
            <span style={{ fontSize: 18 }}>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}