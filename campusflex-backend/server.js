const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const cron     = require("node-cron");
require("dotenv").config();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "https://campusflex.vercel.app",
  "https://campusflex-frontend.vercel.app",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());

// ── Pre-load all models ───────────────────────────────────────────────────────
require("./models/User");
require("./models/Post");
require("./models/Story");
require("./models/StoryReaction");
require("./models/Event");
require("./models/News");
require("./models/Comment");
require("./models/Shoutout");
require("./models/FitRating");
require("./models/FitSubmission");
require("./models/FeatureRequest");
require("./models/Message");
require("./models/Notification");

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",          require("./routes/auth"));
app.use("/api/posts",         require("./routes/posts"));
app.use("/api/stories",       require("./routes/stories"));
app.use("/api/events",        require("./routes/events"));
app.use("/api/news",          require("./routes/news"));
app.use("/api/users",         require("./routes/users"));
app.use("/api/shoutouts",     require("./routes/shoutouts"));
app.use("/api/fitrating",     require("./routes/fitrating"));
app.use("/api/messages",      require("./routes/messages"));
app.use("/api/notifications", require("./routes/notifications"));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "CampusFlex API running 🚀" }));

// ── Cron: delete expired stories every hour ───────────────────────────────────
cron.schedule("0 * * * *", async () => {
  try {
    const Story         = require("./models/Story");
    const StoryReaction = require("./models/StoryReaction");
    const expired       = await Story.find({ expiresAt: { $lt: new Date() } });
    for (const s of expired) {
      await StoryReaction.deleteMany({ story: s._id });
      await s.deleteOne();
    }
    if (expired.length > 0) console.log(`🗑️  Cleared ${expired.length} expired stories`);
  } catch (err) {
    console.error("Cron error:", err.message);
  }
});

// ── Connect to MongoDB then start server ──────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });