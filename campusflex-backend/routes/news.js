const router = require("express").Router();
const News   = require("../models/News");
const { protect, optionalAuth, adminOnly } = require("../middleware/auth");
const { uploadPost } = require("../middleware/cloudinary");

const parseCampus = (raw) =>
  raw && raw !== "undefined" && raw !== "null" ? raw : null;

// GET /api/news — public
router.get("/", optionalAuth, async (req, res) => {
  try {
    const campus   = parseCampus(req.query.campus);
    const articles = await News.find(campus ? { campus } : {})
      .populate("author", "username profilePicture verified role")
      .sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/news — admin only
router.post("/", protect, adminOnly, uploadPost.single("media"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please select an image or video" });
    const article = await News.create({
      author:    req.user._id,
      campus:    req.user.campus,
      mediaUrl:  req.file.path,
      mediaType: req.file.mimetype.startsWith("video") ? "video" : "image",
      caption:   req.body.caption || "",
    });
    await article.populate("author", "username profilePicture verified role");
    res.status(201).json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/news/:id — admin only
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.json({ message: "News deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;