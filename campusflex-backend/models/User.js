const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username:       { type: String, required: true, unique: true, trim: true, lowercase: true },
    email:          { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:       { type: String, required: true },
    campus:         { type: String, required: true, default: "unilag" },
    role:           { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
    displayName:    { type: String, default: "" },
    bio:            { type: String, default: "", maxlength: 200 },
    profilePicture: { type: String, default: "" },
    verified:       { type: Boolean, default: false },
    socials: {
      tiktok:    { type: String, default: "" },
      instagram: { type: String, default: "" },
      facebook:  { type: String, default: "" },
    },
    badges:                { type: [String], default: [] },
    featureRequestPending: { type: Boolean, default: false },
    // Email verification
    emailVerified:         { type: Boolean, default: false },
    verificationCode:      { type: String, default: null },
    verificationExpires:   { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("User", userSchema);