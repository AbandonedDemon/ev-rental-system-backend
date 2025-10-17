import Vehicle from "../models/vehicle.model.js";

export const listVehicles = async (req, res, next) => {
  try {
    const { stationId } = req.query;
    const filter = {};

    if (stationId) {
      filter.stationId = stationId;
    }

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1, _id: -1 });
    res.json({ data: vehicles });
  } catch (error) {
    next(error);
  }
};

export const getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.json({ data: vehicle });
  } catch (error) {
    next(error);
  }
};

export const createVehicle = async (req, res, next) => {
  try {
    const payload = req.body;
    const vehicle = await Vehicle.create(payload);
    res.status(201).json({ data: vehicle });
  } catch (error) {
    next(error);
  }
};

export const updateVehicle = async (req, res, next) => {
  try {
    const payload = req.body;
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({ data: vehicle });
  } catch (error) {
    next(error);
  }
};

export const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export default {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
