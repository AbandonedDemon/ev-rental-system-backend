import mongoose from "mongoose";
import { RENTAL_STATUS } from "../constants/statusCodes.js";

const rentalSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    pickupStation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },
    plannedPickupTime: {
      type: Date,
      default: null,
    },
    plannedReturnTime: {
      type: Date,
      default: null,
    },
    returnStation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      default: null,
    },
    pickupTime: {
      type: Date,
      default: null,
    },
    returnTime: {
      type: Date,
      default: null,
    },
    actualStartTime: {
      type: Date,
      default: null,
    },
    actualEndTime: {
      type: Date,
      default: null,
    },
    odoStart: {
      type: Number,
      default: null,
      min: 0,
    },
    odoEnd: {
      type: Number,
      default: null,
      min: 0,
    },
    conditionNotes: {
      type: String,
      default: null,
    },
    note: {
      type: String,
      default: null,
      trim: true,
    },
    handoverPickup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Handover",
      default: null,
    },
    handoverReturn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Handover",
      default: null,
    },
    readyAt: {
      type: Date,
      default: null,
    },
    lateDetectedAt: {
      type: Date,
      default: null,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    damagedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
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
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    extraCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
    extraChargeNotes: {
      type: String,
      default: null,
      trim: true,
    },
    lateDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFeeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(RENTAL_STATUS),
      default: RENTAL_STATUS.CREATED,
    },
    statusHistory: {
      type: [
        {
          status: {
            type: String,
            enum: Object.values(RENTAL_STATUS),
          },
          changedAt: {
            type: Date,
            default: Date.now,
          },
          changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          note: {
            type: String,
            trim: true,
            default: null,
          },
        },
      ],
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Rental = mongoose.model("Rental", rentalSchema);

export default Rental;
