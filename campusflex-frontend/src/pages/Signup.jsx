import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import { CAMPUSES } from "../components/Navbar";

export default function Signup() {
  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState({ username: "", email: "", password: "" });
  const [campus, setCampus]   = useState("");
  const [code, setCode]       = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  // ── Step 1 — account details ──────────────────────────────────────────────
  const handleStep1 = (e) => {
    e.preventDefault();
    if (!form.username.trim())      return toast.error("Username is required");
    if (!form.email.includes("@")) return toast.error("Enter a valid email address");
    if (form.password.length < 6)  return toast.error("Password must be at least 6 characters");
    setStep(2);
  };

  // ── Step 2 — campus + send code ───────────────────────────────────────────
  const handleSendCode = async () => {
    if (!campus) return toast.error("Please select your campus");
    setLoading(true);
    try {
      await api.post("/auth/send-code", { ...form, campus });
      toast.success(`Verification code sent to ${form.email} 📧`);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send code. Check your email.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3 — verify 6-digit code ─────────────────────────────────────────
  const fullCode = code.join("");

  const handleCodeInput = (val, idx) => {
    const next = [...code];
    next[idx]  = val.replace(/\D/g, "").slice(-1);
    setCode(next);
    // Auto-focus next box
    if (val && idx < 5) {
      document.getElementById(`code-${idx + 1}`)?.focus();
    }
  };

  const handleCodeKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      document.getElementById(`code-${idx - 1}`)?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (fullCode.length !== 6) return toast.error("Enter all 6 digits");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-code", { email: form.email, code: fullCode });
      login(data.user, data.token);
      toast.success("Welcome to CampusFlex! 🎉");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Wrong or expired code");
      setCode(["", "", "", "", "", ""]);
      document.getElementById("code-0")?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    try {
      await api.post("/auth/send-code", { ...form, campus });
      toast.success("New code sent!");
    } catch {
      toast.error("Could not resend. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 1) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1 className="syne gradient-text" style={{ fontWeight: 800, fontSize: 36, marginBottom: 6 }}>CampusFlex</h1>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Your campus. Your vibe.</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28 }}>
        {[1,2,3].map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: s <= step ? 28 : 24, height: s <= step ? 28 : 24, borderRadius: "50%", background: s <= step ? "var(--accent)" : "var(--border)", color: s <= step ? "#fff" : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, transition: "all 0.2s" }}>{s}</div>
            {s < 3 && <div style={{ width: 24, height: 2, background: s < step ? "var(--accent)" : "var(--border)", borderRadius: 1, transition: "all 0.2s" }} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleStep1} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ display: "block" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 5 }}>USERNAME</div>
          <input className="input" placeholder="e.g. john.kamau" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "").replace(/[^a-z0-9._]/g, "") })} />
        </label>
        <label style={{ display: "block" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 5 }}>EMAIL ADDRESS</div>
          <input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label style={{ display: "block" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 5 }}>PASSWORD</div>
          <input className="input" type="password" placeholder="Minimum 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        <button type="submit" className="btn-primary" style={{ marginTop: 6 }}>Continue →</button>
      </form>

      <p style={{ marginTop: 20, color: "var(--muted)", fontSize: 13 }}>
        Already have an account?{" "}
        <span style={{ color: "var(--accent)", fontWeight: 700, cursor: "pointer" }} onClick={() => navigate("/login")}>Log in</span>
      </p>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — Campus
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 2) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "24px 16px 40px" }}>
      <button onClick={() => setStep(1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", marginBottom: 24, fontSize: 14 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back
      </button>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
        {[1,2,3].map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: s <= step ? 28 : 24, height: s <= step ? 28 : 24, borderRadius: "50%", background: s <= step ? "var(--accent)" : "var(--border)", color: s <= step ? "#fff" : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{s}</div>
            {s < 3 && <div style={{ width: 24, height: 2, background: s < step ? "var(--accent)" : "var(--border)", borderRadius: 1 }} />}
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 className="syne" style={{ fontWeight: 800, fontSize: 22, color: "var(--text)", marginBottom: 6 }}>Select Your Campus</h2>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>This sets your home feed. You can browse other campuses anytime.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {CAMPUSES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCampus(c.id)}
            style={{ background: campus === c.id ? c.color + "18" : "var(--card)", border: `2px solid ${campus === c.id ? c.color : "var(--border)"}`, borderRadius: 16, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left", transition: "all 0.15s", boxShadow: campus === c.id ? `0 0 0 3px ${c.color}22` : "var(--shadow)" }}
          >
            <span style={{ fontSize: 26 }}>{c.emoji}</span>
            <div style={{ flex: 1 }}>
              <div className="syne" style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>{c.short}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{c.name}</div>
            </div>
            {campus === c.id && (
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: c.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 12 4 10"/></svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <button className="btn-primary" onClick={handleSendCode} disabled={!campus || loading}>
        {loading ? "Sending code..." : campus ? `Send Verification Code 📧` : "Select a campus first"}
      </button>
      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, marginTop: 10 }}>
        A 6-digit code will be sent to <strong>{form.email}</strong>
      </p>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 — Enter verification code
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <button onClick={() => setStep(2)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", marginBottom: 28, fontSize: 14 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back
        </button>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28, justifyContent: "center" }}>
          {[1,2,3].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{s}</div>
              {s < 3 && <div style={{ width: 24, height: 2, background: "var(--accent)", borderRadius: 1 }} />}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 14 }}>📧</div>
          <h2 className="syne" style={{ fontWeight: 800, fontSize: 22, color: "var(--text)", marginBottom: 8 }}>Enter Your Code</h2>
          <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.65 }}>
            We sent a 6-digit verification code to<br />
            <strong style={{ color: "var(--text)" }}>{form.email}</strong>
          </p>
        </div>

        {/* 6 individual input boxes */}
        <form onSubmit={handleVerify}>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
            {code.map((digit, idx) => (
              <input
                key={idx}
                id={`code-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeInput(e.target.value, idx)}
                onKeyDown={(e) => handleCodeKeyDown(e, idx)}
                style={{
                  width: 46, height: 56, borderRadius: 14,
                  border: `2px solid ${digit ? "var(--accent)" : "var(--border)"}`,
                  background: "var(--surface)", color: "var(--text)",
                  fontSize: 24, fontWeight: 800, textAlign: "center",
                  outline: "none", fontFamily: "Syne", transition: "border-color 0.2s",
                }}
              />
            ))}
          </div>

          <button type="submit" className="btn-primary" disabled={loading || fullCode.length !== 6}>
            {loading ? "Verifying..." : "Verify & Create Account ✅"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 8 }}>
            Didn't receive the code?
          </p>
          <button onClick={resendCode} disabled={loading} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: 13, opacity: loading ? 0.5 : 1 }}>
            {loading ? "Sending..." : "Resend Code"}
          </button>
        </div>
      </div>
    </div>
  );
}