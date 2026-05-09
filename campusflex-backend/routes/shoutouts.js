const router = require("express").Router();
const { Shoutout } = require("../models/index");
const { protect, adminOnly } = require("../middleware/auth");

// ── GET /api/shoutouts?campus=unilag — approved shoutouts only ────────────────
router.get("/", protect, async (req, res) => {
  const { campus } = req.query;
  const filter = { approved: true, ...(campus && { campus }) };
  const shoutouts = await Shoutout.find(filter).sort({ createdAt: -1 });
  res.json(shoutouts);
});

// ── GET /api/shoutouts/pending — admin sees unapproved ones ──────────────────
router.get("/pending", protect, adminOnly, async (req, res) => {
  const shoutouts = await Shoutout.find({ approved: false, campus: req.user.campus }).sort({ createdAt: -1 });
  res.json(shoutouts);
});

// ── POST /api/shoutouts — any user submits anonymously ───────────────────────
router.post("/", protect, async (req, res) => {
  const { toUsername, message } = req.body;
  if (!toUsername || !message)
    return res.status(400).json({ message: "toUsername and message are required" });
  const shoutout = await Shoutout.create({
    campus: req.user.campus,
    toUsername,
    message,
    approved: false,
  });
  res.status(201).json({ message: "Shoutout submitted! Awaiting admin review ✅" });
});

// ── POST /api/shoutouts/:id/approve — admin approves ─────────────────────────
router.post("/:id/approve", protect, adminOnly, async (req, res) => {
  const shoutout = await Shoutout.findByIdAndUpdate(
    req.params.id,
    { approved: true },
    { new: true }
  );
  res.json({ message: "Shoutout approved and now live ✅", shoutout });
});

// ── DELETE /api/shoutouts/:id — admin deletes ────────────────────────────────
router.delete("/:id", protect, adminOnly, async (req, res) => {
  await Shoutout.findByIdAndDelete(req.params.id);
  res.json({ message: "Shoutout deleted" });
});

module.exports = router;