const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const cron     = require("node-cron");
require("dotenv").config();

const app = express();

// Updated CORS to specifically allow your Vercel frontend
app.use(cors({ 
  origin: ["https://campusflex.vercel.app", "http://localhost:5173"], 
  credentials: true 
}));

app.use(express.json());

// Pre-load all models (Using PascalCase to match your file naming)
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

// Routes
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

app.get("/", (req, res) => res.json({ status: "CampusFlex API running 🚀" }));
// Delete expired stories every hour
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

// Database Connection and Server Start
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    
    // CRITICAL FIX FOR RENDER: Use 0.0.0.0 and dynamic port
    const PORT = process.env.PORT || 10000;
    app.listen(PORT, '0.0.0.0', () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch((err) => console.error("❌ DB error:", err));