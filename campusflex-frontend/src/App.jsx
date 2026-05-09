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

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--muted)", fontFamily: "Syne", fontWeight: 700, fontSize: 18 }}>
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
    <>
      {user && <Navbar />}

      <Routes>
        {/* Public */}
        <Route path="/signup" element={!user ? <Signup />        : <Navigate to="/" replace />} />
        <Route path="/login"  element={!user ? <Login />         : <Navigate to="/" replace />} />

        {/* Protected */}
        <Route path="/"                  element={<Protected><Home /></Protected>} />
        <Route path="/explore"           element={<Protected><Explore /></Protected>} />
        <Route path="/events"            element={<Protected><Events /></Protected>} />
        <Route path="/news"              element={<Protected><News /></Protected>} />
        <Route path="/fit"               element={<Protected><FitRating /></Protected>} />
        <Route path="/wall"              element={<Protected><Shoutouts /></Protected>} />
        <Route path="/profile"           element={<Protected><Profile /></Protected>} />
        <Route path="/profile/:username" element={<Protected><Profile /></Protected>} />
        <Route path="/settings"          element={<Protected><Settings /></Protected>} />
        <Route path="/notifications"     element={<Protected><Notifications /></Protected>} />
        <Route path="/messages"          element={<Protected><Messages /></Protected>} />
        <Route path="/messages/:userId"  element={<Protected><Messages /></Protected>} />
        <Route path="/feature-request"   element={<Protected><FeatureRequest /></Protected>} />

        {/* Admin only */}
        <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {user && <BottomNav />}
    </>
  );
}