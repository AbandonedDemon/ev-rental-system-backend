import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    stationId: {
      type: String,
      default: null,
      trim: true,
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
      enum: ["available", "maintenance", "rented", "unavailable"],
      default: "available",
    },
    odometer: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;
