import mongoose from "mongoose";

const userDocumentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentType: {
      type: String,
      required: true,
      trim: true,
      default: "national_id",
    },
    identityNumber: {
      type: String,
      trim: true,
      required: true,
    },
    drivingLicenseNumber: {
      type: String,
      trim: true,
      required: true,
    },
    frontImageUrl: {
      type: String,
      trim: true,
      required: true,
    },
    backImageUrl: {
      type: String,
      trim: true,
      required: true,
    },
    drivingLicenseImageUrl: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "verified", "rejected"],
      default: "pending",
    },
    notes: {
      type: String,
      default: null,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const UserDocument = mongoose.model("UserDocument", userDocumentSchema);

export default UserDocument;
