const mongoose = require("mongoose");

const featureRequestSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    campus:    { type: String, required: true },
    mediaUrl:  { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    caption:   { type: String, default: "" },
    status:    { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeatureRequest", featureRequestSchema);