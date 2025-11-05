import mongoose from "mongoose";
import { PAYMENT_STATUS } from "../constants/statusCodes.js";

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      default: null,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    method: {
      type: String,
      enum: ["cash", "card", "wallet", "transfer"],
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    depositAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    surchargeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    txnRef: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

paymentSchema.index({ booking: 1, rental: 1 });
paymentSchema.index({ booking: 1, status: 1 });
paymentSchema.index({ processedBy: 1, createdAt: -1 });

export const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
