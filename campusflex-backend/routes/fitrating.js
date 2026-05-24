const router          = require("express").Router();
const { FitRating }   = require("../models/index");
const FitSubmission   = require("../models/FitSubmission");
const Post            = require("../models/Post");
const { protect, optionalAuth, adminOnly } = require("../middleware/auth");
const { uploadPost }  = require("../middleware/cloudinary");

const getWeekNumber = () => {
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
};

const parseCampus = (raw) =>
  raw && raw !== "undefined" && raw !== "null" ? raw : null;

// GET /api/fitrating — public
router.get("/", optionalAuth, async (req, res) => {
  try {
    const week   = getWeekNumber();
    const campus = parseCampus(req.query.campus);
    const filter = { weekNumber: week, ...(campus && { campus }) };

    const ratings = await FitRating.find(filter)
      .populate({ path: "post", populate: { path: "author", select: "username profilePicture verified campus" } })
      .sort({ createdAt: -1 });

    const withMeta = ratings.map((r) => ({
      ...r.toObject({ virtuals: true }),
      averageRating: r.averageRating,
      totalVotes:    r.ratings.length,
      // Guard: only check userVoted for logged-in users
      userVoted: req.user
        ? r.ratings.some((rv) => rv.user?.toString() === req.user._id.toString())
        : false,
    }));
    res.json(withMeta);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/fitrating/submissions — admin only
router.get("/submissions", protect, adminOnly, async (req, res) => {
  try {
    const submissions = await FitSubmission.find({ campus: req.user.campus, status: "pending" })
      .populate("user", "username profilePicture verified campus")
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/fitrating/submit — requires login
router.post("/submit", protect, uploadPost.array("media", 4), async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ message: "Please select a photo or video of your outfit" });
    const videos = files.filter((f) => f.mimetype.startsWith("video"));
    if (videos.length > 1) return res.status(400).json({ message: "Maximum 1 video." });

    const week     = getWeekNumber();
    const existing = await FitSubmission.findOne({
      user: req.user._id, weekNumber: week, status: { $in: ["pending", "approved"] },
    });
    if (existing) return res.status(400).json({ message: "You already submitted an outfit this week!" });

    const mediaArray = files.map((f) => ({ url: f.path, type: f.mimetype.startsWith("video") ? "video" : "image" }));
    const submission = await FitSubmission.create({
      user: req.user._id, campus: req.user.campus,
      mediaUrl: mediaArray[0].url, mediaType: mediaArray[0].type,
      media: mediaArray, caption: req.body.caption || "",
      weekNumber: week, status: "pending",
    });
    await submission.populate("user", "username profilePicture verified campus");
    res.status(201).json({ message: "Outfit submitted! Admin will review it ✅", submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/fitrating/submissions/:id/approve — admin only
router.post("/submissions/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const submission = await FitSubmission.findById(req.params.id).populate("user");
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    const week  = getWeekNumber();
    const media = submission.media?.length
      ? submission.media
      : [{ url: submission.mediaUrl, type: submission.mediaType }];
    const post = await Post.create({
      author: submission.user._id, campus: submission.campus,
      mediaUrl: media[0].url, mediaType: media[0].type, media,
      caption: submission.caption || "", tags: ["FitCheck", "CampusFlex"], mentions: [],
    });
    const fitRating = await FitRating.create({
      post: post._id, campus: submission.campus, weekNumber: week, ratings: [],
    });
    submission.status      = "approved";
    submission.fitRatingId = fitRating._id;
    await submission.save();
    res.json({ message: `✅ Outfit by @${submission.user.username} is now live!`, fitRating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/fitrating/submissions/:id/reject — admin only
router.post("/submissions/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    await FitSubmission.findByIdAndUpdate(req.params.id, { status: "rejected" });
    res.json({ message: "Submission rejected" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/fitrating/:id/rate — requires login
router.post("/:id/rate", protect, async (req, res) => {
  try {
    const { score } = req.body;
    if (!score || score < 1 || score > 5) return res.status(400).json({ message: "Score must be 1–5" });
    const fitRating = await FitRating.findById(req.params.id);
    if (!fitRating) return res.status(404).json({ message: "Not found" });
    const already = fitRating.ratings.find((r) => r.user?.toString() === req.user._id.toString());
    if (already) return res.status(400).json({ message: "You already rated this fit" });
    fitRating.ratings.push({ user: req.user._id, score: Number(score) });
    await fitRating.save();
    res.json({ message: "Rated!", averageRating: fitRating.averageRating, totalVotes: fitRating.ratings.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;