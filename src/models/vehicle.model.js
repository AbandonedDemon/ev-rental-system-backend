import mongoose from "mongoose";
import { VEHICLE_STATUS } from "../constants/statusCodes.js";

const vehicleSchema = new mongoose.Schema(
  {
    stationId: {
      type: String,
      default: null,
      trim: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    vin: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    model: {
      type: String,
      trim: true,
      required: true,
    },
    plateNo: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    batteryPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    status: {
      type: String,
      trim: true,
      enum: Object.values(VEHICLE_STATUS),
      default: VEHICLE_STATUS.AVAILABLE,
    },
    lastStatusChangedAt: {
      type: Date,
      default: null,
    },
    statusHistory: {
      type: [
        {
          status: {
            type: String,
            enum: Object.values(VEHICLE_STATUS),
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
    maintenanceNotes: {
      type: String,
      trim: true,
      default: null,
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
      description: "Booking ID that reserved this vehicle"
    },
    reservedUntil: {
      type: Date,
      default: null,
      description: "Reservation expires at this time"
    },
    odometer: {
      type: Number,
      min: 0,
      default: 0,
    },
    specifications: {
      seatCount: {
        type: Number,
        min: 1,
        max: 20,
        default: null,
      },
      transmissionType: {
        type: String,
        enum: [
          "automatic",
          "manual",
          "cvt",
          "dual-clutch",
          "semi-automatic",
          "single-speed",
          "other",
        ],
        default: null,
      },
      airbagCount: {
        type: Number,
        min: 0,
        max: 20,
        default: null,
      },
      horsepower: {
        type: Number,
        min: 0,
        max: 2000,
        default: null,
      },
      motorType: {
        type: String,
        default: null,
        trim: true,
      },
      motorSupplier: {
        type: String,
        default: null,
        trim: true,
      },
      batteryCapacityKWh: {
        type: Number,
        min: 0,
        max: 500,
        default: null,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;
