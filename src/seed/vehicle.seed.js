import Vehicle from "../models/vehicle.model.js";

const DEFAULT_VEHICLES = [
  {
    vin: "EVR-2024-0001",
    model: "Tesla Model 3",
    plateNo: "51H-123.45",
    batteryPercent: 85,
    status: "available",
    odometer: 12450,
    stationId: "station-hcm-01",
  },
  {
    vin: "EVR-2024-0002",
    model: "Nissan Leaf",
    plateNo: "59A-678.90",
    batteryPercent: 60,
    status: "maintenance",
    odometer: 30210,
    stationId: "station-hcm-02",
  },
];

export const seedVehicles = async () => {
  for (const vehicle of DEFAULT_VEHICLES) {
    await Vehicle.findOneAndUpdate(
      { vin: vehicle.vin },
      vehicle,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const count = await Vehicle.estimatedDocumentCount();
  console.log(`Vehicle seed complete. Total vehicles: ${count}`);
};

export default seedVehicles;
