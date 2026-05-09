import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function FeatureRequest() {
  const navigate              = useNavigate();
  const [mediaFile, setMediaFile]     = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [caption, setCaption]         = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [done, setDone]               = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mediaFile) return toast.error("Please select a photo or video first");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("media", mediaFile);
      if (caption.trim()) fd.append("caption", caption.trim());
      await api.post("/users/me/feature-request", fd);
      setDone(true);
      toast.success("Feature request submitted! Admin will review it ✅");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✨</div>
        <h2 className="syne" style={{ fontWeight: 800, fontSize: 22, color: "var(--text)", marginBottom: 8 }}>Request Submitted!</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Your post is now in the admin review queue. You'll get a notification once it's approved or rejected.
        </p>
        <button onClick={() => navigate("/")} className="btn-primary">Go Back to Feed</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "0 0 90px" }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, background: "var(--nav-bg)", backdropFilter: "blur(18px)", borderBottom: "1px solid var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h2 className="syne" style={{ fontWeight: 800, fontSize: 17, color: "var(--text)" }}>Request to Feature My Post</h2>
      </div>

      <div style={{ padding: "20px 16px" }}>
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ fontSize: 32 }}>✨</div>
            <div>
              <div className="syne" style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>How it works</div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
                Select any photo or video from your device gallery that you want the admin to feature on the main feed. Admin will review and either approve or reject it. You'll get a notification either way.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Gallery picker — triggers device photo gallery */}
          <label style={{ display: "block", cursor: "pointer", marginBottom: 16 }}>
            <input
              type="file"
              accept="image/*,video/*"
              capture={undefined}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            {mediaPreview ? (
              <div style={{ borderRadius: 20, overflow: "hidden", aspectRatio: "1/1", background: "var(--border)", position: "relative" }}>
                {mediaFile?.type.startsWith("video")
                  ? <video src={mediaPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <img src={mediaPreview} alt="selected" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                }
                <div style={{ position: "absolute", bottom: 14, right: 14, background: "var(--accent)", borderRadius: 12, padding: "8px 16px", color: "#fff", fontSize: 13, fontWeight: 700 }}>
                  Change Photo/Video
                </div>
              </div>
            ) : (
              <div style={{ border: "2px dashed var(--border)", borderRadius: 20, padding: "48px 20px", textAlign: "center", color: "var(--muted)", background: "var(--surface)" }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>📸</div>
                <div className="syne" style={{ fontWeight: 800, fontSize: 16, color: "var(--text)", marginBottom: 6 }}>Open Gallery</div>
                <div style={{ fontSize: 13 }}>Tap to select a photo or video from your device</div>
              </div>
            )}
          </label>

          {/* Optional caption */}
          <textarea
            className="input"
            placeholder="Add a caption (optional)..."
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{ resize: "none", marginBottom: 16, borderRadius: 14 }}
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !mediaFile}
          >
            {submitting ? "Submitting..." : "Submit for Featuring ✨"}
          </button>
        </form>
      </div>
    </div>
  );
}