import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

// ── Reusable multi-file picker used here and in FitRating ─────────────────────
export function MultiFilePicker({ files, previews, onChange, onRemove }) {
  const handleChange = (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;
    const combined = [...files, ...selected].slice(0, 4);
    const videos   = combined.filter((f) => f.type.startsWith("video"));
    if (videos.length > 1) { toast.error("Maximum 1 video. Add up to 3 images alongside it."); return; }
    if (combined.length > 4) { toast.error("Maximum 4 files total"); return; }
    onChange(combined);
    e.target.value = "";
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {previews.length === 0 ? (
        <label style={{ display: "block", cursor: "pointer" }}>
          <input type="file" accept="image/*,video/*" multiple style={{ display: "none" }} onChange={handleChange} />
          <div style={{ border: "2px dashed var(--border)", borderRadius: 20, padding: "44px 20px", textAlign: "center", color: "var(--muted)", background: "var(--surface)" }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>📸</div>
            <div className="syne" style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", marginBottom: 5 }}>Tap to open gallery</div>
            <div style={{ fontSize: 12 }}>Up to 4 photos — or 1 video + up to 3 photos</div>
          </div>
        </label>
      ) : (
        <div>
          {/* Horizontal scroll preview */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
            {previews.map((p, i) => (
              <div key={i} style={{ position: "relative", flexShrink: 0, width: 130, height: 130, borderRadius: 14, overflow: "hidden", background: "#000" }}>
                {p.type === "video"
                  ? <video src={p.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                }
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  style={{ position: "absolute", top: 5, right: 5, background: "#000000bb", border: "none", borderRadius: "50%", width: 24, height: 24, color: "#fff", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
                >✕</button>
                {p.type === "video" && (
                  <div style={{ position: "absolute", bottom: 5, left: 5, background: "#000000bb", borderRadius: 6, padding: "2px 6px", fontSize: 9, color: "#fff", fontWeight: 700 }}>VIDEO</div>
                )}
                {/* Position badge */}
                <div style={{ position: "absolute", top: 5, left: 5, background: "var(--accent)", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 800 }}>{i + 1}</div>
              </div>
            ))}

            {/* Add more slot */}
            {previews.length < 4 && (
              <label style={{ flexShrink: 0, width: 130, height: 130, borderRadius: 14, border: "2px dashed var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--muted)" }}>
                <input type="file" accept="image/*,video/*" multiple style={{ display: "none" }} onChange={handleChange} />
                <span style={{ fontSize: 28, marginBottom: 4 }}>＋</span>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{previews.length}/4</span>
              </label>
            )}
          </div>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Swipe to see all • tap ✕ to remove</p>
        </div>
      )}
    </div>
  );
}

export default function FeatureRequest() {
  const navigate    = useNavigate();
  const [mediaFiles, setMediaFiles]   = useState([]);
  const [previews, setPreviews]       = useState([]);
  const [caption, setCaption]         = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [done, setDone]               = useState(false);

  const handleFilesChange = (newFiles) => {
    setMediaFiles(newFiles);
    setPreviews(newFiles.map((f) => ({ url: URL.createObjectURL(f), type: f.type.startsWith("video") ? "video" : "image" })));
  };

  const handleRemove = (index) => {
    const nf = mediaFiles.filter((_, i) => i !== index);
    const np = previews.filter((_, i) => i !== index);
    setMediaFiles(nf);
    setPreviews(np);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mediaFiles.length) return toast.error("Please select at least one photo or video");
    setSubmitting(true);
    try {
      const fd = new FormData();
      mediaFiles.forEach((f) => fd.append("media", f));
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
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✨</div>
        <h2 className="syne" style={{ fontWeight: 800, fontSize: 22, color: "var(--text)", marginBottom: 8 }}>Request Submitted!</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Your post is in the admin review queue. You'll get a notification once it's approved or rejected.
        </p>
        <button onClick={() => navigate("/")} className="btn-primary">Go Back to Feed</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", padding: "0 0 90px" }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, background: "var(--nav-bg)", backdropFilter: "blur(18px)", borderBottom: "1px solid var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, zIndex: 50 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h2 className="syne" style={{ fontWeight: 800, fontSize: 17, color: "var(--text)" }}>Request to Feature My Post</h2>
      </div>

      <div style={{ padding: "20px 16px" }}>
        {/* Info card */}
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ fontSize: 32 }}>✨</div>
            <div>
              <div className="syne" style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>How it works</div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
                Select up to 4 photos or 1 video (+ up to 3 photos) you want featured on the main feed. Admin reviews and approves or rejects. You'll get notified either way.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <MultiFilePicker
            files={mediaFiles}
            previews={previews}
            onChange={handleFilesChange}
            onRemove={handleRemove}
          />

          <textarea
            className="input"
            placeholder="Add a caption (optional)..."
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{ resize: "none", marginBottom: 16, borderRadius: 14 }}
          />

          <button type="submit" className="btn-primary" disabled={submitting || !mediaFiles.length}>
            {submitting ? "Submitting..." : `Submit for Featuring ✨${mediaFiles.length > 1 ? ` (${mediaFiles.length} files)` : ""}`}
          </button>
        </form>
      </div>
    </div>
  );
}