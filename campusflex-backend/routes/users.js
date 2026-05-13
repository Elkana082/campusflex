const router         = require("express").Router();
const User           = require("../models/User");
const Post           = require("../models/Post");
const FeatureRequest = require("../models/FeatureRequest");
const Notification   = require("../models/Notification");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadPost, uploadAvatar } = require("../middleware/cloudinary");

// ── /me routes MUST come before /:username ────────────────────────────────────

router.put("/me", protect, async (req, res) => {
  try {
    const allowed = ["displayName", "bio", "socials", "username"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (updates.username) {
      const taken = await User.findOne({ username: updates.username });
      if (taken && taken._id.toString() !== req.user._id.toString())
        return res.status(400).json({ message: "Username already taken" });
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.json(user);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

router.put("/me/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword)))
      return res.status(401).json({ message: "Current password is incorrect" });
    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

router.post("/me/avatar", protect, uploadAvatar.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Image required" });
    const user = await User.findByIdAndUpdate(
      req.user._id, { profilePicture: req.file.path }, { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// POST /api/users/me/feature-request — supports up to 4 files
router.post("/me/feature-request", protect, uploadPost.array("media", 4), async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length)
      return res.status(400).json({ message: "Please select at least one image or video" });

    const videos = files.filter((f) => f.mimetype.startsWith("video"));
    if (videos.length > 1)
      return res.status(400).json({ message: "Maximum 1 video. Add up to 3 images alongside it." });

    const existing = await FeatureRequest.findOne({ user: req.user._id, status: "pending" });
    if (existing)
      return res.status(400).json({ message: "You already have a pending request. Wait for admin to review it." });

    const mediaArray = files.map((f) => ({
      url:  f.path,
      type: f.mimetype.startsWith("video") ? "video" : "image",
    }));

    const request = await FeatureRequest.create({
      user:      req.user._id,
      campus:    req.user.campus,
      mediaUrl:  mediaArray[0].url,
      mediaType: mediaArray[0].type,
      media:     mediaArray,
      caption:   req.body.caption || "",
      status:    "pending",
    });
    await request.populate("user", "username profilePicture verified campus");
    res.status(201).json({ message: "Feature request submitted! Admin will review it ✅", request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── /admin routes MUST come before /:username ─────────────────────────────────

router.get("/admin/feature-requests", protect, adminOnly, async (req, res) => {
  try {
    const requests = await FeatureRequest.find({ campus: req.user.campus, status: "pending" })
      .populate("user", "username profilePicture verified campus")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

router.post("/admin/feature-request/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const request = await FeatureRequest.findById(req.params.id)
      .populate("user", "_id username profilePicture verified campus");
    if (!request) return res.status(404).json({ message: "Request not found" });

    const media = request.media?.length
      ? request.media
      : [{ url: request.mediaUrl, type: request.mediaType }];

    const post = await Post.create({
      author:    request.user._id,
      campus:    request.campus,
      mediaUrl:  media[0].url,
      mediaType: media[0].type,
      media,
      caption:   request.caption || `✨ Featured post by @${request.user.username}`,
      tags:      ["Featured", "CampusFlex"],
      mentions:  [],
      featured:  true,
    });

    await FeatureRequest.findByIdAndUpdate(req.params.id, { status: "approved" });
    await User.findByIdAndUpdate(request.user._id, { $addToSet: { badges: "✨ Featured Creator" } });
    await Notification.create({
      recipient: request.user._id,
      type:      "feature_approved",
      post:      post._id,
      text:      "🎉 Your feature request was approved! Your post is now live on the feed.",
    });

    res.json({ message: "Approved ✅ Post is now live on the feed!", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/admin/feature-request/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const request = await FeatureRequest.findByIdAndUpdate(
      req.params.id, { status: "rejected" }, { new: true }
    ).populate("user", "_id username");
    if (!request) return res.status(404).json({ message: "Request not found" });

    await Notification.create({
      recipient: request.user._id,
      type:      "feature_rejected",
      text:      "Your feature request was reviewed but not approved this time. Keep posting! 💜",
    });
    res.json({ message: "Rejected" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// ── GET /:username — MUST be last ─────────────────────────────────────────────
router.get("/:username", protect, async (req, res) => {
  try {
    const user  = await User.findOne({ username: req.params.username }).select("-password -verificationCode -verificationExpires");
    if (!user) return res.status(404).json({ message: "User not found" });
    const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 });
    res.json({ user, posts });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

module.exports = router;