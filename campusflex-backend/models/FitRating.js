const mongoose = require("mongoose");

const fitRatingSchema = new mongoose.Schema(
  {
    post:       { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    campus:     { type: String, required: true },
    weekNumber: { type: Number, required: true },
    ratings: [
      {
        user:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        score: { type: Number, min: 1, max: 5 },
      },
    ],
  },
  { timestamps: true }
);

// Auto-compute average rating without storing it
fitRatingSchema.virtual("averageRating").get(function () {
  if (!this.ratings.length) return 0;
  const sum = this.ratings.reduce((acc, r) => acc + r.score, 0);
  return (sum / this.ratings.length).toFixed(1);
});

module.exports = mongoose.model("FitRating", fitRatingSchema);