const mongoose = require("mongoose");

const storyReactionSchema = new mongoose.Schema(
  {
    story:  { type: mongoose.Schema.Types.ObjectId, ref: "Story", required: true },
    user:   { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    type:   { type: String, enum: ["like", "reply"], required: true },
    text:   { type: String, default: "" }, // only for replies
  },
  { timestamps: true }
);

module.exports = mongoose.model("StoryReaction", storyReactionSchema);