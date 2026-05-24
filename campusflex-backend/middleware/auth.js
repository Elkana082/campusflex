const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// ── protect — requires a valid JWT ───────────────────────────────────────────
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, access denied" });
  }
  try {
    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user      = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ── optionalAuth — sets req.user if a valid token is present, otherwise null ─
// Use this on public GET routes so logged-in users see personalised data
// (e.g. whether they liked a post) while guests still get the content.
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }
  try {
    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user      = await User.findById(decoded.id).select("-password");
  } catch {
    req.user = null;
  }
  next();
};

// ── adminOnly ─────────────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin" && req.user?.role !== "superadmin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
};

// ── superAdminOnly ────────────────────────────────────────────────────────────
const superAdminOnly = (req, res, next) => {
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({ message: "Superadmin only" });
  }
  next();
};

module.exports = { protect, optionalAuth, adminOnly, superAdminOnly };