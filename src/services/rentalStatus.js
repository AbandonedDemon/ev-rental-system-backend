import mongoose from "mongoose";
import { RENTAL_STATUS, VEHICLE_STATUS } from "../constants/statusCodes.js";

const toObjectId = (value) => {
  if (!value) {
    return null;
  }
  if (mongoose.isValidObjectId(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
};

const ensureHistoryArray = (rental) => {
  if (!Array.isArray(rental.statusHistory)) {
    rental.statusHistory = [];
  }
};

export const applyRentalStatus = (
  rental,
  status,
  { userId = null, note = null, timestamp = new Date() } = {},
) => {
  if (!rental) {
    return;
  }

  ensureHistoryArray(rental);

  rental.statusHistory.push({
    status,
    changedAt: timestamp,
    changedBy: toObjectId(userId),
    note: note ?? null,
  });
  if (typeof rental.markModified === "function") {
    rental.markModified("statusHistory");
  }

  rental.status = status;

  switch (status) {
    case RENTAL_STATUS.CREATED: {
      rental.readyAt = rental.readyAt ?? null;
      rental.actualStartTime = rental.actualStartTime ?? null;
      rental.actualEndTime = rental.actualEndTime ?? null;
      break;
    }
    case RENTAL_STATUS.READY_FOR_PICKUP: {
      rental.readyAt = rental.readyAt ?? timestamp;
      break;
    }
    case RENTAL_STATUS.IN_PROGRESS: {
      rental.actualStartTime = rental.actualStartTime ?? timestamp;
      rental.pickupTime = rental.pickupTime ?? timestamp;
      break;
    }
    case RENTAL_STATUS.LATE: {
      rental.lateDetectedAt = rental.lateDetectedAt ?? timestamp;
      break;
    }
    case RENTAL_STATUS.RETURNED: {
      rental.returnedAt = rental.returnedAt ?? timestamp;
      rental.actualEndTime = rental.actualEndTime ?? timestamp;
      rental.returnTime = rental.returnTime ?? timestamp;
      break;
    }
    case RENTAL_STATUS.DAMAGED: {
      rental.damagedAt = rental.damagedAt ?? timestamp;
      break;
    }
    case RENTAL_STATUS.COMPLETED: {
      rental.completedAt = rental.completedAt ?? timestamp;
      if (!rental.actualEndTime) {
        rental.actualEndTime = timestamp;
      }
      if (!rental.returnTime) {
        rental.returnTime = timestamp;
      }
      break;
    }
    case RENTAL_STATUS.CANCELLED: {
      rental.cancelledAt = rental.cancelledAt ?? timestamp;
      break;
    }
    default:
      break;
  }
};

export const updateVehicleByRentalStatus = (vehicle, rentalStatus, stationId = null, notes = null) => {
  if (!vehicle) {
    return;
  }

  switch (rentalStatus) {
    case RENTAL_STATUS.READY_FOR_PICKUP:
    case RENTAL_STATUS.IN_PROGRESS:
      vehicle.status = VEHICLE_STATUS.RENTED;
      break;
    case RENTAL_STATUS.RETURNED:
    case RENTAL_STATUS.COMPLETED:
      vehicle.status = VEHICLE_STATUS.AVAILABLE;
      if (stationId) {
        vehicle.stationId = stationId;
      }
      vehicle.maintenanceNotes = null;
      break;
    case RENTAL_STATUS.DAMAGED:
      vehicle.status = VEHICLE_STATUS.DAMAGED;
      vehicle.maintenanceNotes = notes ?? vehicle.maintenanceNotes ?? null;
      break;
    case RENTAL_STATUS.CANCELLED:
      vehicle.status = VEHICLE_STATUS.AVAILABLE;
      if (stationId) {
        vehicle.stationId = stationId;
      }
      break;
    default:
      break;
  }
};

export default {
  applyRentalStatus,
  updateVehicleByRentalStatus,
};
