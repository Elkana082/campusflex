const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    campus:    { type: String, required: true },

    // ── NEW: array of up to 4 media items ─────────────────────────────────
    // Rule: max 4 total. If any is video, max 1 video + up to 3 images.
    media: [
      {
        url:  { type: String, required: true },
        type: { type: String, enum: ["image", "video"], required: true },
      },
    ],

    // ── LEGACY: kept for backward compat with old posts ───────────────────
    mediaUrl:  { type: String, default: "" },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },

    caption:   { type: String, default: "" },
    tags:      [{ type: String }],
    mentions:  [{ type: String }],
    likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    featured:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);