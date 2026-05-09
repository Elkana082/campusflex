const router          = require("express").Router();
const { FitRating }   = require("../models/index");
const FitSubmission   = require("../models/FitSubmission");
const Post            = require("../models/Post");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadPost }  = require("../middleware/cloudinary");

const getWeekNumber = () => {
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
};

// GET /api/fitrating?campus=unilag — approved fits this week
router.get("/", protect, async (req, res) => {
  try {
    const week   = getWeekNumber();
    const filter = { weekNumber: week, ...(req.query.campus && { campus: req.query.campus }) };
    const ratings = await FitRating.find(filter)
      .populate({ path: "post", populate: { path: "author", select: "username profilePicture verified campus" } })
      .sort({ createdAt: -1 });
    const withMeta = ratings.map((r) => ({
      ...r.toObject({ virtuals: true }),
      averageRating: r.averageRating,
      totalVotes:    r.ratings.length,
      userVoted:     r.ratings.some((rv) => rv.user?.toString() === req.user._id.toString()),
    }));
    res.json(withMeta);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/fitrating/submissions — admin sees pending outfit submissions
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

// POST /api/fitrating/submit — user picks outfit from gallery
router.post("/submit", protect, uploadPost.single("media"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please select a photo or video of your outfit" });
    const week = getWeekNumber();
    const existing = await FitSubmission.findOne({ user: req.user._id, weekNumber: week, status: { $in: ["pending", "approved"] } });
    if (existing) return res.status(400).json({ message: "You already submitted an outfit this week!" });
    const submission = await FitSubmission.create({
      user:       req.user._id,
      campus:     req.user.campus,
      mediaUrl:   req.file.path,
      mediaType:  req.file.mimetype.startsWith("video") ? "video" : "image",
      caption:    req.body.caption || "",
      weekNumber: week,
      status:     "pending",
    });
    await submission.populate("user", "username profilePicture verified campus");
    res.status(201).json({ message: "Outfit submitted! Admin will review it ✅", submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/fitrating/submissions/:id/approve — admin approves, makes it live
router.post("/submissions/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const submission = await FitSubmission.findById(req.params.id).populate("user");
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    const week = getWeekNumber();
    const post = await Post.create({
      author:    submission.user._id,
      campus:    submission.campus,
      mediaUrl:  submission.mediaUrl,
      mediaType: submission.mediaType,
      caption:   submission.caption || "",
      tags:      ["FitCheck", "CampusFlex"],
      mentions:  [],
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

// POST /api/fitrating/submissions/:id/reject
router.post("/submissions/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    await FitSubmission.findByIdAndUpdate(req.params.id, { status: "rejected" });
    res.json({ message: "Submission rejected" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/fitrating/:id/rate — user rates a fit
router.post("/:id/rate", protect, async (req, res) => {
  try {
    const { score } = req.body;
    if (!score || score < 1 || score > 5)
      return res.status(400).json({ message: "Score must be 1–5" });
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