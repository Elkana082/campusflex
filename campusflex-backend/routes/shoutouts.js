const router = require("express").Router();
const { Shoutout } = require("../models/index");
const { protect, optionalAuth, adminOnly } = require("../middleware/auth");

const parseCampus = (raw) =>
  raw && raw !== "undefined" && raw !== "null" ? raw : null;

// GET /api/shoutouts — approved shoutouts, public
router.get("/", optionalAuth, async (req, res) => {
  try {
    const campus   = parseCampus(req.query.campus);
    const filter   = { approved: true, ...(campus && { campus }) };
    const shoutouts = await Shoutout.find(filter).sort({ createdAt: -1 });
    res.json(shoutouts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/shoutouts/pending — admin sees unapproved ones
router.get("/pending", protect, adminOnly, async (req, res) => {
  try {
    const shoutouts = await Shoutout.find({ approved: false, campus: req.user.campus }).sort({ createdAt: -1 });
    res.json(shoutouts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/shoutouts — requires login
router.post("/", protect, async (req, res) => {
  try {
    const { toUsername, message } = req.body;
    if (!toUsername || !message)
      return res.status(400).json({ message: "toUsername and message are required" });
    await Shoutout.create({ campus: req.user.campus, toUsername, message, approved: false });
    res.status(201).json({ message: "Shoutout submitted! Awaiting admin review ✅" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/shoutouts/:id/approve — admin only
router.post("/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const shoutout = await Shoutout.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    res.json({ message: "Shoutout approved and now live ✅", shoutout });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/shoutouts/:id — admin only
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Shoutout.findByIdAndDelete(req.params.id);
    res.json({ message: "Shoutout deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;