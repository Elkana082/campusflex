const router        = require("express").Router();
const Story         = require("../models/Story");
const StoryReaction = require("../models/StoryReaction");
const Notification  = require("../models/Notification");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadStory }        = require("../middleware/cloudinary");

// Sanitise the campus query param — treat "undefined" / "null" strings as
// no filter so new users always see stories even before AuthContext hydrates.
const parseCampus = (raw) =>
  raw && raw !== "undefined" && raw !== "null" ? raw : null;

// GET /api/stories?campus=maseno
router.get("/", protect, async (req, res) => {
  try {
    const campus = parseCampus(req.query.campus);
    const filter = { expiresAt: { $gt: new Date() }, ...(campus && { campus }) };

    const stories = await Story.find(filter)
      .populate("author", "username profilePicture verified role")
      .sort({ createdAt: -1 });

    const withMeta = await Promise.all(stories.map(async (story) => {
      const likes     = await StoryReaction.countDocuments({ story: story._id, type: "like" });
      const userLiked = await StoryReaction.findOne({ story: story._id, user: req.user._id, type: "like" });
      const replies   = await StoryReaction.find({ story: story._id, type: "reply" })
        .populate("user", "username profilePicture verified")
        .sort({ createdAt: -1 })
        .limit(20);
      return { ...story.toObject(), likeCount: likes, userLiked: !!userLiked, replies };
    }));

    res.json(withMeta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/stories — admin posts a story
router.post("/", protect, adminOnly, uploadStory.single("media"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Media required" });
    const story = await Story.create({
      author:    req.user._id,
      campus:    req.user.campus,
      mediaUrl:  req.file.path,
      mediaType: req.file.mimetype.startsWith("video") ? "video" : "image",
      caption:   req.body.caption || "",
    });
    await story.populate("author", "username profilePicture verified role");
    res.status(201).json({ ...story.toObject(), likeCount: 0, userLiked: false, replies: [] });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/stories/:id — admin deletes
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Story.findByIdAndDelete(req.params.id);
    await StoryReaction.deleteMany({ story: req.params.id });
    res.json({ message: "Story deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/stories/:id/like — toggle like on a story
router.post("/:id/like", protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });

    const existing = await StoryReaction.findOne({ story: req.params.id, user: req.user._id, type: "like" });

    if (existing) {
      await existing.deleteOne();
    } else {
      await StoryReaction.create({ story: req.params.id, user: req.user._id, type: "like" });
      if (story.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: story.author,
          sender:    req.user._id,
          type:      "like",
          text:      `@${req.user.username} liked your story`,
        });
      }
    }

    const likeCount = await StoryReaction.countDocuments({ story: req.params.id, type: "like" });
    res.json({ liked: !existing, likeCount });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/stories/:id/reply — reply to a story
router.post("/:id/reply", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Reply cannot be empty" });

    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });

    const reply = await StoryReaction.create({
      story: req.params.id,
      user:  req.user._id,
      type:  "reply",
      text:  text.trim(),
    });
    await reply.populate("user", "username profilePicture verified");

    if (story.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: story.author,
        sender:    req.user._id,
        type:      "comment",
        text:      `@${req.user.username} replied to your story: "${text.trim().slice(0, 40)}"`,
      });
    }

    res.status(201).json(reply);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/stories/:id/replies — get all replies for a story
router.get("/:id/replies", protect, async (req, res) => {
  try {
    const replies = await StoryReaction.find({ story: req.params.id, type: "reply" })
      .populate("user", "username profilePicture verified")
      .sort({ createdAt: -1 });
    res.json(replies);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;