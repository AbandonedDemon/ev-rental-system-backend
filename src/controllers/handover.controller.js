import path from "path";
import Handover from "../models/handover.model.js";
import Rental from "../models/rental.model.js";
import Vehicle from "../models/vehicle.model.js";
import Station from "../models/station.model.js";

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
      .sort({ createdAt: -1 })
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
    if (!rental || !stationId || !type) {
      return res
        .status(400)
        .json({ message: "rental, stationId and type are required to create a handover" });
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

    const odoReading = normalizeNumberField(req.body.odoReading);
    const batteryPercent = normalizeNumberField(req.body.batteryPercent);
    const photos = Array.isArray(req.files)
      ? req.files.map((file) => normalizeFilePath(file.path))
      : [];

    const handoverPayload = {
      rental: rentalDoc._id,
      vehicle: vehicleDoc._id,
      stationId: stationDoc._id,
      staff: staff || null,
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
      rentalDoc.status = "ongoing";
      rentalDoc.pickupStation = stationDoc._id;
      rentalDoc.pickupTime = rentalDoc.pickupTime ?? new Date();
      if (odoReading !== undefined) {
        rentalDoc.odoStart = odoReading;
      }
      vehicleDoc.status = "rented";
    }

    if (type === "return") {
      rentalDoc.status = "completed";
      rentalDoc.returnStation = stationDoc._id;
      rentalDoc.returnTime = new Date();
      if (odoReading !== undefined) {
        rentalDoc.odoEnd = odoReading;
      }
      vehicleDoc.status = "available";
    }

    if (notes) {
      rentalDoc.conditionNotes = notes;
    }

    if (batteryPercent !== undefined) {
      vehicleDoc.batteryPercent = batteryPercent;
    }
    vehicleDoc.stationId = stationDoc._id;

    await Promise.all([rentalDoc.save(), vehicleDoc.save()]);

    const populated = await handover.populate(HANDOVER_POPULATE);

    res.status(201).json({ data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateHandover = async (req, res, next) => {
  try {
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
