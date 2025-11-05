import path from "path";
import Handover from "../models/handover.model.js";
import Rental from "../models/rental.model.js";
import Vehicle from "../models/vehicle.model.js";
import Station from "../models/station.model.js";
import User from "../models/user.model.js";
import {
  RENTAL_STATUS,
  VEHICLE_STATUS,
} from "../constants/statusCodes.js";
import {
  applyRentalStatus,
  updateVehicleByRentalStatus,
} from "../services/rentalStatus.js";

const HANDOVER_POPULATE = [
  { path: "rental" },
  { path: "vehicle" },
  { path: "staff" },
  { path: "stationId" },
];

export const listHandovers = async (req, res, next) => {
  try {
    const { rentalId } = req.query;
    const filter = {};

    if (rentalId) {
      filter.rental = rentalId;
    }

    const handovers = await Handover.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .populate(HANDOVER_POPULATE);

    res.json({ data: handovers });
  } catch (error) {
    next(error);
  }
};

export const getHandover = async (req, res, next) => {
  try {
    const handover = await Handover.findById(req.params.id).populate(HANDOVER_POPULATE);
    if (!handover) {
      return res.status(404).json({ message: "Handover not found" });
    }
    res.json({ data: handover });
  } catch (error) {
    next(error);
  }
};

const normalizeNumberField = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const normalizeFilePath = (filePath) => {
  const relativePath = path.relative(process.cwd(), filePath);
  return relativePath.split(path.sep).join("/");
};

export const createHandover = async (req, res, next) => {
  try {
    const { rental, stationId, type, notes, staff } = req.body;
    if (!rental || !stationId || !type || !staff) {
      return res
        .status(400)
        .json({ message: "rental, stationId, type and staff are required to create a handover" });
    }

    const rentalDoc = await Rental.findById(rental);
    if (!rentalDoc) {
      return res.status(404).json({ message: "Rental not found" });
    }

    const stationDoc = await Station.findById(stationId);
    if (!stationDoc) {
      return res.status(404).json({ message: "Station not found" });
    }

    const vehicleDoc = await Vehicle.findById(rentalDoc.vehicle);
    if (!vehicleDoc) {
      return res.status(404).json({ message: "Vehicle not found for rental" });
    }

    const staffDoc = await User.findById(staff);
    if (!staffDoc) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const odoReading = normalizeNumberField(req.body.odoReading);
    const batteryPercent = normalizeNumberField(req.body.batteryPercent);
    const photos = Array.isArray(req.files)
      ? req.files.map((file) => normalizeFilePath(file.path))
      : [];

    const handoverPayload = {
      rental: rentalDoc._id,
      vehicle: vehicleDoc._id,
      stationId: stationDoc._id,
      staff: staffDoc._id,
      type,
      notes: notes ?? null,
      photos,
    };

    if (odoReading !== undefined) {
      handoverPayload.odoReading = odoReading;
    }
    if (batteryPercent !== undefined) {
      handoverPayload.batteryPercent = batteryPercent;
    }

    const handover = await Handover.create(handoverPayload);

    if (type === "pickup") {
      const now = new Date();
      rentalDoc.pickupStation = stationDoc._id;
      rentalDoc.handoverPickup = handover._id;
      rentalDoc.pickupTime = rentalDoc.pickupTime ?? now;
      if (odoReading !== undefined) {
        rentalDoc.odoStart = odoReading;
      }
      applyRentalStatus(rentalDoc, RENTAL_STATUS.IN_PROGRESS, {
        userId: staffDoc._id,
        note: "Vehicle handed over to customer",
        timestamp: now,
      });
      updateVehicleByRentalStatus(vehicleDoc, RENTAL_STATUS.IN_PROGRESS, stationDoc.code ?? stationDoc._id);
    }

    if (type === "return") {
      const now = new Date();
      const damageFlag =
        req.body.isDamaged === true ||
        req.body.damageStatus === "damaged" ||
        Boolean(req.body.damageNotes) ||
        Boolean(req.body.damages);

      rentalDoc.returnStation = stationDoc._id;
      rentalDoc.handoverReturn = handover._id;
      applyRentalStatus(rentalDoc, RENTAL_STATUS.RETURNED, {
        userId: staffDoc._id,
        note: "Vehicle returned to station",
        timestamp: now,
      });

      if (odoReading !== undefined) {
        rentalDoc.odoEnd = odoReading;
      }

      if (damageFlag) {
        applyRentalStatus(rentalDoc, RENTAL_STATUS.DAMAGED, {
          userId: staffDoc._id,
          note: req.body.damageNotes ?? notes ?? "Damage reported on return",
          timestamp: now,
        });
        updateVehicleByRentalStatus(
          vehicleDoc,
          RENTAL_STATUS.DAMAGED,
          stationDoc.code ?? stationDoc._id,
          req.body.damageNotes ?? notes ?? null,
        );
      } else {
        applyRentalStatus(rentalDoc, RENTAL_STATUS.COMPLETED, {
          userId: staffDoc._id,
          note: "Rental completed after return",
          timestamp: now,
        });
        updateVehicleByRentalStatus(vehicleDoc, RENTAL_STATUS.COMPLETED, stationDoc.code ?? stationDoc._id);
      }
    }

    if (notes) {
      rentalDoc.conditionNotes = notes;
    }

    if (batteryPercent !== undefined) {
      vehicleDoc.batteryPercent = batteryPercent;
    }
    if (stationDoc?.code ?? stationDoc?._id) {
      vehicleDoc.stationId = stationDoc.code ?? stationDoc._id;
    }

    await Promise.all([rentalDoc.save(), vehicleDoc.save()]);

    const populated = await handover.populate(HANDOVER_POPULATE);

    res.status(201).json({ data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateHandover = async (req, res, next) => {
  try {
    if (req.body.staff) {
      const staffDoc = await User.findById(req.body.staff);
      if (!staffDoc) {
        return res.status(404).json({ message: "Staff not found" });
      }
    }

    const handover = await Handover.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate(HANDOVER_POPULATE);

    if (!handover) {
      return res.status(404).json({ message: "Handover not found" });
    }

    res.json({ data: handover });
  } catch (error) {
    next(error);
  }
};

export const deleteHandover = async (req, res, next) => {
  try {
    const handover = await Handover.findByIdAndDelete(req.params.id);
    if (!handover) {
      return res.status(404).json({ message: "Handover not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export default {
  listHandovers,
  getHandover,
  createHandover,
  updateHandover,
  deleteHandover,
};
