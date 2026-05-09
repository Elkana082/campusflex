import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm]     = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login }           = useAuth();
  const navigate            = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.user, data.token);
      toast.success("Welcome back! 🎉");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1 className="syne gradient-text" style={{ fontWeight: 800, fontSize: 34, marginBottom: 6 }}>CampusFlex</h1>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Welcome back 👋</p>
      </div>

      <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          className="input"
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      <p style={{ marginTop: 20, color: "var(--muted)", fontSize: 13 }}>
        Don't have an account?{" "}
        <span style={{ color: "var(--accent)", fontWeight: 700, cursor: "pointer" }} onClick={() => navigate("/signup")}>
          Sign up
        </span>
      </p>
    </div>
  );
}