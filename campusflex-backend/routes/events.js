const router = require("express").Router();
const Event  = require("../models/Event");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadPost } = require("../middleware/cloudinary");

// GET /api/events?campus=unilag
router.get("/", protect, async (req, res) => {
  try {
    const { campus } = req.query;
    const events = await Event.find(campus ? { campus } : {})
      .populate("author", "username profilePicture verified role")
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/events — admin posts with media + caption
router.post("/", protect, adminOnly, uploadPost.single("media"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please select an image or video" });
    const event = await Event.create({
      author:    req.user._id,
      campus:    req.user.campus,
      mediaUrl:  req.file.path,
      mediaType: req.file.mimetype.startsWith("video") ? "video" : "image",
      caption:   req.body.caption || "",
    });
    await event.populate("author", "username profilePicture verified role");
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/events/:id
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;