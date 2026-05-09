const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    author:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    campus:    { type: String, required: true },
    mediaUrl:  { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    caption:   { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);