import Booking from "../models/booking.model.js";

const DEFAULT_BOOKINGS = [
  {
    key: "alice-early-june",
    renterEmail: "alice.nguyen@example.com",
    pickupStationCode: "station-hcm-01",
    vehicleVin: "EVR-2024-0001",
    pickupTimeExpected: new Date("2024-06-01T08:00:00.000Z"),
    status: "confirmed",
    rentalDays: 3,
  },
  {
    key: "alice-july-hold",
    renterEmail: "alice.nguyen@example.com",
    pickupStationCode: "station-hn-01",
    vehicleVin: null,
    pickupTimeExpected: new Date("2024-07-10T09:00:00.000Z"),
    status: "pending",
    rentalDays: 2,
  },
  {
    key: "alice-august-getaway",
    renterEmail: "alice.nguyen@example.com",
    pickupStationCode: "station-hcm-01",
    vehicleVin: "EVR-2024-0005",
    pickupTimeExpected: new Date("2024-08-05T02:00:00.000Z"),
    status: "confirmed",
    rentalDays: 5,
  },
  {
    key: "minh-danang-weekend",
    renterEmail: "minh.pham@example.com",
    pickupStationCode: "station-dn-01",
    vehicleVin: "EVR-2024-0003",
    pickupTimeExpected: new Date("2024-08-17T02:30:00.000Z"),
    status: "confirmed",
    rentalDays: 4,
  },
];

export const seedBookings = async ({ userMap, stationMap, vehicleMap }) => {
  const bookingMap = new Map();

  for (const booking of DEFAULT_BOOKINGS) {
    const renter = userMap.get(booking.renterEmail);
    const pickupStation = stationMap.get(booking.pickupStationCode);

    if (!renter || !pickupStation) {
      continue;
    }

    const payload = {
      renter: renter._id,
      pickupStation: pickupStation._id,
      vehicle: booking.vehicleVin
        ? vehicleMap.get(booking.vehicleVin)?._id ?? null
        : null,
      pickupTimeExpected: booking.pickupTimeExpected,
      status: booking.status,
      rentalDays: booking.rentalDays ?? 1,
    };

    let doc = await Booking.findOneAndUpdate(
      {
        renter: renter._id,
        pickupTimeExpected: booking.pickupTimeExpected,
      },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    doc = await doc.populate(["renter", "pickupStation", "vehicle"]);
    bookingMap.set(booking.key, doc);
  }

  const count = await Booking.estimatedDocumentCount();
  console.log(`Booking seed complete. Total bookings: ${count}`);

  return bookingMap;
};

export default seedBookings;
