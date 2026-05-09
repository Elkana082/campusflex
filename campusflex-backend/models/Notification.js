const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type:      {
      type: String,
      enum: ["like", "comment", "follow", "feature_approved", "feature_rejected", "fit_approved", "fit_rejected", "message", "shoutout_approved"],
      required: true,
    },
    post:      { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    text:      { type: String, default: "" },
    read:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);