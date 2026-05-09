const mongoose = require("mongoose");

const fitSubmissionSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    campus:    { type: String, required: true },
    mediaUrl:  { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    caption:   { type: String, default: "" },
    weekNumber:{ type: Number, required: true },
    status:    { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    // Once approved, linked to a FitRating document
    fitRatingId: { type: mongoose.Schema.Types.ObjectId, ref: "FitRating", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FitSubmission", fitSubmissionSchema);