import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import VerifiedBadge from "../components/VerifiedBadge";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function FitRating() {
  const { currentCampus, isAdmin } = useAuth();
  const [fits, setFits]           = useState([]);
  const [submissions, setSubmissions] = useState([]); // pending, admin only
  const [loading, setLoading]     = useState(true);
  // User submission form
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [caption, setCaption]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/fitrating?campus=${currentCampus}`)
      .then((r) => setFits(r.data))
      .catch(() => toast.error("Could not load fit ratings"))
      .finally(() => setLoading(false));

    if (isAdmin) {
      api.get("/fitrating/submissions")
        .then((r) => setSubmissions(r.data))
        .catch(() => {});
    }
  }, [currentCampus, isAdmin]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleSubmitOutfit = async (e) => {
    e.preventDefault();
    if (!mediaFile) return toast.error("Please select your outfit photo or video");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("media", mediaFile);
      if (caption) fd.append("caption", caption);
      await api.post("/fitrating/submit", fd);
      setSubmitted(true);
      setMediaFile(null);
      setMediaPreview(null);
      setCaption("");
      toast.success("Outfit submitted! Admin will review it ✅");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRate = async (fitId, score) => {
    try {
      const { data } = await api.post(`/fitrating/${fitId}/rate`, { score });
      setFits((prev) => prev.map((f) =>
        f._id === fitId
          ? { ...f, userVoted: true, averageRating: data.averageRating, totalVotes: data.totalVotes }
          : f
      ));
      toast.success(`Rated ${score}/5! ${"😐🙂😊🔥💜"[score - 1]}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit rating");
    }
  };

  const handleApproveSubmission = async (id) => {
    try {
      const { data } = await api.post(`/fitrating/submissions/${id}/approve`);
      setSubmissions((prev) => prev.filter((s) => s._id !== id));
      // refresh live fits
      const { data: freshFits } = await api.get(`/fitrating?campus=${currentCampus}`);
      setFits(freshFits);
      toast.success("Outfit approved and live! 🔥");
    } catch {
      toast.error("Could not approve");
    }
  };

  const handleRejectSubmission = async (id) => {
    try {
      await api.post(`/fitrating/submissions/${id}/reject`);
      setSubmissions((prev) => prev.filter((s) => s._id !== id));
      toast.success("Submission rejected");
    } catch {
      toast.error("Could not reject");
    }
  };

  return (
    <div className="page" style={{ paddingTop: 14 }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z"/>
          </svg>
          <h2 className="syne" style={{ fontWeight: 800, fontSize: 21, color: "var(--text)" }}>Campus Fit Rating</h2>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z"/>
          </svg>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Submit your fit. Top rated wins Featured Spotlight 🏆</p>
      </div>

      {/* ── Admin: pending outfit submissions ── */}
      {isAdmin && submissions.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16, border: "1px solid var(--gold)44" }}>
          <h3 className="syne" style={{ fontWeight: 800, fontSize: 15, color: "var(--gold)", marginBottom: 14 }}>
            ⏳ Pending Outfit Submissions ({submissions.length})
          </h3>
          {submissions.map((s) => (
            <div key={s._id} style={{ marginBottom: 14, borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: s.user?.profilePicture ? `url(${s.user.profilePicture}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)",
                  border: "2px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, color: "#7c3aed", flexShrink: 0,
                }}>
                  {!s.user?.profilePicture && s.user?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 4 }}>
                    {s.user?.username} {s.user?.verified && <VerifiedBadge size={12} />}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Week {s.weekNumber} submission</div>
                </div>
              </div>
              {/* Preview */}
              <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 10, aspectRatio: "1/1", background: "var(--border)" }}>
                {s.mediaType === "video"
                  ? <video src={s.mediaUrl} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <img src={s.mediaUrl} alt="outfit" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                }
              </div>
              {s.caption && <p style={{ fontSize: 13, color: "var(--subtext)", marginBottom: 10 }}>{s.caption}</p>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button onClick={() => handleApproveSubmission(s._id)} style={{ background: "var(--accent)", border: "none", borderRadius: 10, padding: "10px", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                  ✅ Approve & Go Live
                </button>
                <button onClick={() => handleRejectSubmission(s._id)} style={{ background: "transparent", border: "1px solid #ef4444", borderRadius: 10, padding: "10px", color: "#ef4444", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── User: submit outfit form ── */}
      {!isAdmin && (
        submitted ? (
          <div className="card" style={{ padding: 24, marginBottom: 20, textAlign: "center", background: "var(--accent)12", border: "1px solid var(--accent)33" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔥</div>
            <div className="syne" style={{ fontWeight: 800, fontSize: 16, color: "var(--text)", marginBottom: 4 }}>Outfit Submitted!</div>
            <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>Admin will review and approve it for this week's rating.</div>
            <button onClick={() => setSubmitted(false)} className="btn-secondary" style={{ width: "auto", padding: "8px 20px", margin: "0 auto", display: "block" }}>
              Submit Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitOutfit} className="card" style={{ padding: 16, marginBottom: 20 }}>
            <h3 className="syne" style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>Submit Your Outfit 👗</h3>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Pick a photo or video from your gallery. Admin reviews before it goes live for rating.</p>

            {/* Gallery picker */}
            <label style={{ display: "block", cursor: "pointer", marginBottom: 12 }}>
              <input type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileChange} />
              {mediaPreview ? (
                <div style={{ borderRadius: 14, overflow: "hidden", aspectRatio: "1/1", background: "var(--border)", position: "relative" }}>
                  {mediaFile?.type.startsWith("video")
                    ? <video src={mediaPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <img src={mediaPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  }
                  <div style={{ position: "absolute", bottom: 10, right: 10, background: "var(--accent)", borderRadius: 10, padding: "5px 12px", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                    Change Photo
                  </div>
                </div>
              ) : (
                <div style={{ border: "2px dashed var(--border)", borderRadius: 14, padding: "36px 20px", textAlign: "center", color: "var(--muted)", background: "var(--surface)" }}>
                  <div style={{ fontSize: 44, marginBottom: 10 }}>👗</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Tap to pick your outfit</div>
                  <div style={{ fontSize: 12 }}>Photo or video from your gallery</div>
                </div>
              )}
            </label>

            <input
              className="input"
              placeholder="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{ marginBottom: 12 }}
            />

            <button type="submit" className="btn-primary" disabled={submitting || !mediaFile}>
              {submitting ? "Submitting..." : "Submit for Rating 🔥"}
            </button>
          </form>
        )
      )}

      {/* ── Live fit ratings ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Loading fits...</div>
      ) : fits.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 20px", color: "var(--muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🕐</div>
          <div className="syne" style={{ fontWeight: 700, fontSize: 15 }}>No fits approved yet this week</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Submit yours above and wait for admin to approve!</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span className="syne" style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>THIS WEEK'S FITS</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          {fits.map((fit) => {
            const fitPost  = fit.post || {};
            const fitAuthor = fitPost.author || {};
            return (
              <div key={fit._id} className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
                {/* Media */}
                <div style={{ width: "100%", aspectRatio: "1/1", maxHeight: 380, background: "var(--border)", overflow: "hidden", position: "relative" }}>
                  {fitPost.mediaType === "video"
                    ? <video src={fitPost.mediaUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <img src={fitPost.mediaUrl} alt="fit" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  }
                  <div style={{ position: "absolute", top: 12, left: 12, background: "#00000077", borderRadius: 10, padding: "4px 12px", fontSize: 11, color: "#fff", backdropFilter: "blur(8px)", fontWeight: 700 }}>
                    Week {fit.weekNumber}
                  </div>
                  {/* Average score badge */}
                  <div style={{ position: "absolute", top: 12, right: 12, background: "var(--gold)", borderRadius: 10, padding: "4px 10px", fontSize: 12, fontWeight: 800, color: "#fff" }}>
                    ⭐ {fit.averageRating || "0.0"}
                  </div>
                </div>

                <div style={{ padding: 15 }}>
                  {/* Author row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                      background: fitAuthor.profilePicture ? `url(${fitAuthor.profilePicture}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)",
                      border: "2px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 800, color: "#7c3aed",
                    }}>
                      {!fitAuthor.profilePicture && fitAuthor.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 4 }}>
                        {fitAuthor.username} {fitAuthor.verified && <VerifiedBadge size={13} />}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{fit.totalVotes} votes so far</div>
                    </div>
                  </div>

                  {/* Rating buttons or voted state */}
                  {!fit.userVoted ? (
                    <>
                      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12, textAlign: "center" }}>Rate this fit 1 – 5</p>
                      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => handleRate(fit._id, n)}
                            style={{ width: 50, height: 50, borderRadius: 14, fontSize: 22, background: "var(--surface)", border: "1.5px solid var(--border)", cursor: "pointer", transition: "transform 0.1s" }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.15)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                          >
                            {["😐", "🙂", "😊", "🔥", "💜"][n - 1]}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ background: "var(--accent)18", border: "1px solid var(--accent)33", borderRadius: 14, padding: 14, textAlign: "center" }}>
                      <div style={{ fontSize: 30, marginBottom: 5 }}>✅</div>
                      <div className="syne" style={{ fontWeight: 800, color: "var(--text)" }}>You rated this fit!</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                        Average: ⭐ {fit.averageRating} · {fit.totalVotes} votes
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}