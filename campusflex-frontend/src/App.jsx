import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Events from "./pages/Events";
import News from "./pages/News";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import FitRating from "./pages/FitRating";
import Shoutouts from "./pages/Shoutouts";
import AdminDashboard from "./pages/AdminDashboard";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import FeatureRequest from "./pages/FeatureRequest";
import PostDetail from "./pages/PostDetail";

// Requires login — redirects to /login if not authenticated
const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100dvh", color: "var(--muted)", fontFamily: "Syne", fontWeight: 700, fontSize: 18 }}>
      CampusFlex...
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const AdminOnly = ({ children }) => {
  const { user, isAdmin } = useAuth();
  return user && isAdmin ? children : <Navigate to="/" replace />;
};

export default function App() {
  const { user } = useAuth();

  return (
    <div style={{
      maxWidth: 480,
      margin: "0 auto",
      minHeight: "100dvh",
      background: "var(--bg)",
      position: "relative",
      boxShadow: "0 0 0 1px var(--border)",
    }}>
      {/* Navbar always visible — shows Login/Signup buttons when logged out */}
      <Navbar />

      <main style={{
        paddingBottom: user ? "calc(68px + env(safe-area-inset-bottom))" : 0,
        minHeight: "calc(100dvh - 52px)",
        boxSizing: "border-box",
      }}>
        <Routes>
          {/* Auth pages — redirect to home if already logged in */}
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" replace />} />
          <Route path="/login"  element={!user ? <Login />  : <Navigate to="/" replace />} />

          {/* ── Public pages — no login required ── */}
          <Route path="/"                  element={<Home />} />
          <Route path="/explore"           element={<Explore />} />
          <Route path="/events"            element={<Events />} />
          <Route path="/news"              element={<News />} />
          <Route path="/fit"               element={<FitRating />} />
          <Route path="/fitrating"         element={<FitRating />} />
          <Route path="/wall"              element={<Shoutouts />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/post/:id"          element={<PostDetail />} />

          {/* ── Semi-protected — own profile needs login ── */}
          <Route path="/profile" element={<Protected><Profile /></Protected>} />

          {/* ── Fully protected — requires login ── */}
          <Route path="/settings"          element={<Protected><Settings /></Protected>} />
          <Route path="/notifications"     element={<Protected><Notifications /></Protected>} />
          <Route path="/messages"          element={<Protected><Messages /></Protected>} />
          <Route path="/messages/:userId"  element={<Protected><Messages /></Protected>} />
          <Route path="/feature-request"   element={<Protected><FeatureRequest /></Protected>} />

          {/* Admin only */}
          <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Bottom nav always visible */}
      <BottomNav />
    </div>
  );
}