const mongoose = require("mongoose");

const shoutoutSchema = new mongoose.Schema(
  {
    campus:     { type: String, required: true },
    toUsername: { type: String, required: true },
    message:    { type: String, required: true, maxlength: 300 },
    // Admin must approve before it shows publicly
    approved:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shoutout", shoutoutSchema);