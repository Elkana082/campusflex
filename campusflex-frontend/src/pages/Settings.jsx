import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const [profileForm, setProfileForm] = useState({
    username:    user?.username    || "",
    displayName: user?.displayName || "",
    bio:         user?.bio         || "",
    socials: {
      tiktok:    user?.socials?.tiktok    || "",
      instagram: user?.socials?.instagram || "",
      facebook:  user?.socials?.facebook  || "",
    },
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put("/users/me", profileForm);
      updateUser(data);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      return toast.error("Passwords don't match");
    if (passwordForm.newPassword.length < 6)
      return toast.error("Password must be at least 6 characters");
    setSavingPassword(true);
    try {
      await api.put("/users/me/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword:     passwordForm.newPassword,
      });
      toast.success("Password changed!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const { data } = await api.post("/users/me/avatar", fd);
      updateUser(data);
      toast.success("Profile picture updated!");
    } catch {
      toast.error("Failed to upload picture");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const initial = user?.username?.[0]?.toUpperCase() || "?";

  return (
    <div className="page" style={{ paddingTop: 14 }}>
      <h2 className="syne" style={{ fontWeight: 800, fontSize: 20, color: "var(--text)", marginBottom: 20 }}>Account Settings</h2>

      {/* Profile picture */}
      <div className="card" style={{ padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <label style={{ cursor: "pointer", flexShrink: 0 }}>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: user?.profilePicture
              ? `url(${user.profilePicture}) center/cover`
              : "linear-gradient(135deg, #ede9fe, #dbeafe)",
            border: "2px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 800, color: "#7c3aed", fontFamily: "Syne",
            position: "relative", overflow: "hidden",
          }}>
            {!user?.profilePicture && initial}
            <div style={{
              position: "absolute", inset: 0, background: "#00000055",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>
              {uploadingAvatar ? "⏳" : "📷"}
            </div>
          </div>
        </label>
        <div>
          <div className="syne" style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{user?.username}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Tap photo to change</div>
        </div>
      </div>

      {/* Profile info form */}
      <form onSubmit={handleProfileSave} className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 className="syne" style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "var(--text)" }}>Profile Info</h3>

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 5 }}>Username</label>
        <input className="input" value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value.toLowerCase().replace(/\s/g, "") })} style={{ marginBottom: 12 }} />

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 5 }}>Display Name</label>
        <input className="input" placeholder="Your full name" value={profileForm.displayName} onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })} style={{ marginBottom: 12 }} />

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 5 }}>Bio</label>
        <textarea className="input" placeholder="Tell the campus about yourself..." rows={3} value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} style={{ resize: "none", marginBottom: 16, borderRadius: 12 }} maxLength={200} />

        <h3 className="syne" style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "var(--text)" }}>Social Accounts</h3>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Enter your usernames only (without @). Anyone can tap to view your profiles.</p>

        {[
          { key: "tiktok",    label: "TikTok username",    placeholder: "yourusername" },
          { key: "instagram", label: "Instagram username",  placeholder: "yourusername" },
          { key: "facebook",  label: "Facebook username",   placeholder: "yourusername" },
        ].map((s) => (
          <div key={s.key} style={{ marginBottom: 10 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 5 }}>{s.label}</label>
            <input
              className="input"
              placeholder={s.placeholder}
              value={profileForm.socials[s.key]}
              onChange={(e) => setProfileForm({ ...profileForm, socials: { ...profileForm.socials, [s.key]: e.target.value.replace("@", "") } })}
            />
          </div>
        ))}

        <button type="submit" className="btn-primary" disabled={savingProfile} style={{ marginTop: 8 }}>
          {savingProfile ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {/* Change password form */}
      <form onSubmit={handlePasswordSave} className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 className="syne" style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "var(--text)" }}>Change Password</h3>

        <input className="input" type="password" placeholder="Current password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} style={{ marginBottom: 10 }} />
        <input className="input" type="password" placeholder="New password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} style={{ marginBottom: 10 }} />
        <input className="input" type="password" placeholder="Confirm new password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} style={{ marginBottom: 12 }} />

        <button type="submit" className="btn-primary" disabled={savingPassword}>
          {savingPassword ? "Changing..." : "Change Password"}
        </button>
      </form>

      {/* Logout */}
      <button onClick={logout} className="btn-secondary" style={{ color: "var(--red)", borderColor: "var(--red)44", marginBottom: 20 }}>
        Log Out
      </button>
    </div>
  );
}