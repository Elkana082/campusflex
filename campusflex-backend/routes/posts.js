const router       = require("express").Router();
const Post         = require("../models/Post");
const { Comment }  = require("../models/index");
const Notification = require("../models/Notification");
const { protect, optionalAuth, adminOnly } = require("../middleware/auth");
const { uploadPost } = require("../middleware/cloudinary");

const parseCampus = (raw) =>
  raw && raw !== "undefined" && raw !== "null" ? raw : null;

// GET /api/posts — public, optionalAuth so logged-in users get like state
router.get("/", optionalAuth, async (req, res) => {
  try {
    const campus = parseCampus(req.query.campus);
    const page   = Number(req.query.page)  || 1;
    const limit  = Number(req.query.limit) || 20;

    const posts = await Post.find(campus ? { campus } : {})
      .populate("author", "username profilePicture verified role badges campus")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/posts/:id — public
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username profilePicture verified role badges campus");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/posts — admin only
router.post("/", protect, adminOnly, uploadPost.array("media", 4), async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ message: "Please select at least one image or video" });
    const videos = files.filter((f) => f.mimetype.startsWith("video"));
    if (videos.length > 1) return res.status(400).json({ message: "Maximum 1 video per post." });

    const { caption, tags, mentions } = req.body;
    const mediaArray = files.map((f) => ({
      url:  f.path,
      type: f.mimetype.startsWith("video") ? "video" : "image",
    }));

    const post = await Post.create({
      author:    req.user._id,
      campus:    req.user.campus,
      media:     mediaArray,
      mediaUrl:  mediaArray[0].url,
      mediaType: mediaArray[0].type,
      caption:   caption  || "",
      tags:      tags     ? JSON.parse(tags)     : [],
      mentions:  mentions ? JSON.parse(mentions) : [],
    });
    await post.populate("author", "username profilePicture verified role badges campus");
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/posts/:id — admin only
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/posts/:id/like — requires login
router.post("/:id/like", protect, async (req, res) => {
  try {
    const post    = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const already = post.likes.includes(req.user._id);
    if (already) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author, sender: req.user._id, type: "like", post: post._id,
          text: `@${req.user.username} liked your post`,
        });
      }
    }
    await post.save();
    res.json({ liked: !already, likeCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/posts/:id/comments — public
router.get("/:id/comments", optionalAuth, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate("author", "username profilePicture verified role")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/posts/:id/comments — requires login
router.post("/:id/comments", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Comment cannot be empty" });
    const post    = await Post.findById(req.params.id);
    const comment = await Comment.create({ post: req.params.id, author: req.user._id, text: text.trim() });
    await comment.populate("author", "username profilePicture verified role");
    if (post && post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author, sender: req.user._id, type: "comment", post: post._id,
        text: `@${req.user.username} commented on your post`,
      });
    }
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/posts/:id/comments/:commentId
router.delete("/:id/comments/:commentId", protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    const isOwner = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin" || req.user.role === "superadmin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "You can only delete your own comments" });
    await comment.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;