const router  = require("express").Router();
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const { protect, superAdminOnly } = require("../middleware/auth");
const { sendVerificationEmail }   = require("../middleware/mailer");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const safeUser = (user) => ({
  _id:                   user._id,
  username:              user.username,
  email:                 user.email,
  campus:                user.campus,
  role:                  user.role,
  displayName:           user.displayName,
  bio:                   user.bio,
  profilePicture:        user.profilePicture,
  verified:              user.verified,
  emailVerified:         user.emailVerified,
  socials:               user.socials,
  badges:                user.badges,
  featureRequestPending: user.featureRequestPending,
  createdAt:             user.createdAt,
});

const makeCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── POST /api/auth/send-code ──────────────────────────────────────────────────
router.post("/send-code", async (req, res) => {
  try {
    const { username, email, password, campus } = req.body;
    if (!username || !email || !password || !campus)
      return res.status(400).json({ message: "All fields are required" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      if (exists.email === email.toLowerCase().trim() && exists.emailVerified)
        return res.status(400).json({ message: "Email already registered" });
      if (exists.username === username.toLowerCase().trim() && exists.emailVerified)
        return res.status(400).json({ message: "Username already taken" });
    }

    const code    = makeCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    let tempUser = await User.findOne({ email: email.toLowerCase().trim(), emailVerified: false });
    if (tempUser) {
      tempUser.verificationCode    = code;
      tempUser.verificationExpires = expires;
      await tempUser.save();
    } else {
      const totalVerified = await User.countDocuments({ emailVerified: true });
      const isFirst       = totalVerified === 0;
      tempUser = await User.create({
        username:              username.toLowerCase().trim(),
        email:                 email.toLowerCase().trim(),
        password,
        campus,
        role:                  isFirst ? "superadmin" : "user",
        verified:              isFirst,
        badges:                isFirst ? ["👑 Superadmin", "✨ Founding Member"] : [],
        emailVerified:         false,
        verificationCode:      code,
        verificationExpires:   expires,
        displayName:           "",
        bio:                   "",
        profilePicture:        "",
        socials:               { tiktok: "", instagram: "", facebook: "" },
        featureRequestPending: false,
      });
    }

    await sendVerificationEmail(email, username, code);
    res.json({ message: "Verification code sent ✅" });
  } catch (err) {
    console.error("send-code error:", err);
    res.status(500).json({ message: "Failed to send code. Check your email address and try again." });
  }
});

// ── POST /api/auth/verify-code ────────────────────────────────────────────────
router.post("/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Email and code are required" });

    const user = await User.findOne({ email: email.toLowerCase().trim(), emailVerified: false });
    if (!user) return res.status(400).json({ message: "No pending signup for this email" });
    if (user.verificationCode !== code)
      return res.status(400).json({ message: "Incorrect code" });
    if (new Date() > user.verificationExpires)
      return res.status(400).json({ message: "Code expired. Sign up again to get a new code." });

    user.emailVerified       = true;
    user.verificationCode    = null;
    user.verificationExpires = null;
    await user.save();

    res.json({ token: generateToken(user._id), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    if (!user.emailVerified)
      return res.status(401).json({ message: "Please verify your email first" });
    if (!(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid email or password" });

    res.json({ token: generateToken(user._id), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", protect, (req, res) => res.json(safeUser(req.user)));

// ── POST /api/auth/verify/:userId — superadmin grants blue badge ──────────────
router.post("/verify/:userId", protect, superAdminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { verified: true }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: `✅ @${user.username} is now verified`, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/auth/unverify/:userId — superadmin revokes badge ────────────────
router.post("/unverify/:userId", protect, superAdminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { verified: false }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: `❌ @${user.username} verification revoked`, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/auth/make-admin/:userId — superadmin assigns admin role ──────────
// Max 4 admins per campus enforced here
router.post("/make-admin/:userId", protect, superAdminOnly, async (req, res) => {
  try {
    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.role === "superadmin")
      return res.status(400).json({ message: "Cannot change the superadmin role" });

    if (target.role === "admin")
      return res.status(400).json({ message: `@${target.username} is already an admin` });

    // Count current admins for this campus (exclude superadmin)
    const campusAdminCount = await User.countDocuments({
      campus: target.campus,
      role:   "admin",
    });

    if (campusAdminCount >= 4)
      return res.status(400).json({
        message: `${target.campus.toUpperCase()} already has 4 admins. Remove one before adding another.`,
      });

    const user = await User.findByIdAndUpdate(
      req.params.userId, { role: "admin" }, { new: true }
    );
    res.json({ message: `✅ @${user.username} is now an admin for ${user.campus}`, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/auth/remove-admin/:userId — superadmin removes admin role ───────
router.post("/remove-admin/:userId", protect, superAdminOnly, async (req, res) => {
  try {
    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.role === "superadmin")
      return res.status(400).json({ message: "Cannot remove the superadmin" });

    if (target.role !== "admin")
      return res.status(400).json({ message: `@${target.username} is not an admin` });

    const user = await User.findByIdAndUpdate(
      req.params.userId, { role: "user" }, { new: true }
    );
    res.json({ message: `✅ @${user.username} has been removed as admin`, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/auth/admins/:campus — get all admins for a campus ────────────────
router.get("/admins/:campus", protect, superAdminOnly, async (req, res) => {
  try {
    const admins = await User.find({
      campus: req.params.campus,
      role:   "admin",
    }).select("username profilePicture verified campus role createdAt");
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;