const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ── Verify JWT token ──────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, access denied" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ── Must be admin or superadmin ───────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
};

// ── Must be superadmin (you only) ─────────────────────────────────────────────
const superAdminOnly = (req, res, next) => {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Superadmin only — verification badges are restricted" });
  }
  next();
};

module.exports = { protect, adminOnly, superAdminOnly };