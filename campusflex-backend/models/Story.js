const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    author:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    campus:    { type: String, required: true },
    mediaUrl:  { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    caption:   { type: String, default: "" },
    // Auto-expire after 24 hours — cron job in server.js cleans these up
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Story", storySchema);