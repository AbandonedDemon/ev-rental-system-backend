import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["renter", "staff", "admin"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending_documents",
        "documents_submitted",
        "verified",
        "active",
        "inactive",
        "suspended",
      ],
      default: "pending_documents",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ role: 1 });

export const User = mongoose.model("User", userSchema);

export default User;
